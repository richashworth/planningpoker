# syntax=docker/dockerfile:1.7
# GraalVM native-image build of the Spring Boot backend.
#
# Three stages:
#   1. web-builder: Node builds the React frontend into static files
#   2. native-builder: GraalVM compiles the Java source to a native ELF binary
#   3. runtime: debian-slim runs the binary, no JVM
#
# Cache mounts on the npm and gradle caches survive across builds even when
# source COPYs invalidate the surrounding layers — saves 30-60s per cold
# build. Requires BuildKit (default in modern Docker, used by Railway and
# GitHub Actions docker/build-push-action).

# Stage 1: build frontend ----------------------------------------------------
FROM node:22-bookworm-slim AS web-builder
WORKDIR /web
COPY planningpoker-web/package.json planningpoker-web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY planningpoker-web/ ./
RUN npm run build

# Stage 2: native compile ----------------------------------------------------
FROM ghcr.io/graalvm/native-image-community:25 AS native-builder
WORKDIR /build
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
COPY planningpoker-web/build.gradle ./planningpoker-web/build.gradle
COPY planningpoker-api ./planningpoker-api
# Bring in the freshly built frontend so planningpoker-web:jar can package it
COPY --from=web-builder /web/build ./planningpoker-web/build
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew planningpoker-web:jar --no-daemon
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew planningpoker-api:nativeCompile --no-daemon

# Stage 3: runtime -----------------------------------------------------------
# debian:bookworm-slim with just the libs the native binary needs.
# libz1 is required by Spring's WebSocket per-message compression; ca-certificates
# is needed for outbound HTTPS (none today, but cheap to include).
FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app app
WORKDIR /app
COPY --from=native-builder /build/planningpoker-api/build/native/nativeCompile/planningpoker /app/planningpoker
RUN chown app:app /app/planningpoker
USER app
EXPOSE 9000
ENTRYPOINT ["/app/planningpoker"]
