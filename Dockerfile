# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/planningpoker-web
COPY planningpoker-web/package.json planningpoker-web/package-lock.json ./
RUN npm ci
COPY planningpoker-web/ ./
RUN npm run build

# Stage 2: Build backend
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew settings.gradle build.gradle ./
COPY planningpoker-api/ planningpoker-api/
COPY planningpoker-web/build.gradle planningpoker-web/build.gradle
COPY --from=frontend /app/planningpoker-web/build/ planningpoker-web/build/
RUN mkdir -p planningpoker-web/dist/libs
RUN chmod +x gradlew && ./gradlew planningpoker-web:jar planningpoker-api:bootJar --no-daemon

# Stage 3: Runtime
FROM eclipse-temurin:21-jre
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY --from=backend /app/planningpoker-api/build/libs/planningpoker-*.jar app.jar
USER app
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
