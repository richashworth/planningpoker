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
# GitHub Actions docker/build-push-action). The `id=s/<service-id>-...`
# prefix is required by Railway's builder; env vars aren't allowed in
# mount IDs so the service ID is hardcoded.

# Stage 1: build frontend ----------------------------------------------------
FROM node:26-bookworm-slim AS web-builder
WORKDIR /web
COPY planningpoker-web/package.json planningpoker-web/package-lock.json ./
RUN --mount=type=cache,id=s/3a138f12-84af-4eea-b7cf-38f2e8dc8251-npm,target=/root/.npm \
    npm ci
COPY planningpoker-web/ ./
RUN npm run build

# Stage 2: native compile ----------------------------------------------------
# Base stays ghcr.io/graalvm/native-image-community:25 (Oracle Linux 9, glibc
# 2.34) so the native binary's glibc requirement stays <= the distroless
# runtime's glibc 2.36 below. Gradle itself is copied in from the official
# gradle image instead of letting the wrapper download its distribution from
# services.gradle.org on every cold build — that download was observed
# failing outright (connection reset within ~1s, twice in a row) from
# Railway's builder network, which hard-failed the whole image build. Keep
# this tag's Gradle version in step with gradle/wrapper/gradle-wrapper.properties
# when Dependabot bumps it.
FROM ghcr.io/graalvm/native-image-community:25 AS native-builder
COPY --from=gradle:9.6.1-jdk25-graal /opt/gradle /opt/gradle
ENV PATH="/opt/gradle/bin:${PATH}"
WORKDIR /build
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
COPY planningpoker-web/build.gradle ./planningpoker-web/build.gradle
COPY planningpoker-api ./planningpoker-api
# Bring in the freshly built frontend so planningpoker-web:jar can package it
COPY --from=web-builder /web/build ./planningpoker-web/build
RUN --mount=type=cache,id=s/3a138f12-84af-4eea-b7cf-38f2e8dc8251-gradle,target=/root/.gradle \
    gradle planningpoker-web:jar --no-daemon
RUN --mount=type=cache,id=s/3a138f12-84af-4eea-b7cf-38f2e8dc8251-gradle,target=/root/.gradle \
    gradle planningpoker-api:nativeCompile --no-daemon

# Stage 3a: extract libz from debian -----------------------------------------
# Distroless `base` ships glibc, ca-certificates, libssl and tzdata but not
# zlib. GraalVM native binaries dynamically link libz.so.1, and Spring's
# WebSocket per-message compression uses it at runtime. Pull just the .so
# from a debian-slim helper stage so the runtime image stays minimal.
FROM debian:bookworm-slim AS lib-source
RUN apt-get update \
    && apt-get install -y --no-install-recommends zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Stage 3: runtime -----------------------------------------------------------
# Distroless: no shell, no apt, no package db. ~25MB image, drops every
# package the native binary doesn't need. The :nonroot tag pre-sets
# USER 65532. ca-certificates is bundled (cheap, even though we don't
# do outbound HTTPS today).
FROM gcr.io/distroless/base-debian12:nonroot
COPY --from=lib-source /usr/lib/x86_64-linux-gnu/libz.so.1 /usr/lib/x86_64-linux-gnu/libz.so.1
COPY --from=native-builder --chown=nonroot:nonroot \
    /build/planningpoker-api/build/native/nativeCompile/planningpoker /app/planningpoker
WORKDIR /app
EXPOSE 9000
ENTRYPOINT ["/app/planningpoker"]
