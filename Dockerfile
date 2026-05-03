# Single-stage: pull the JAR that semantic-release already built and uploaded
# to the latest GitHub release, instead of recompiling from source.
#
# Filter by asset *label* ("planningpoker.jar") rather than asset name —
# semantic-release uploads with the version-suffixed filename
# (planningpoker-api-X.Y.Z.jar) but applies the stable label, so this works
# for every release v2.7.0+ without needing a transition.
#
# RAILWAY_GIT_COMMIT_SHA is auto-injected by Railway and busts the Docker
# layer cache on every master commit, ensuring we re-fetch when a new
# release lands.
FROM eclipse-temurin:25-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates jq \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
ARG RAILWAY_GIT_COMMIT_SHA=local
RUN echo "fetching latest planningpoker.jar for ${RAILWAY_GIT_COMMIT_SHA}" \
    && URL=$(curl -fsSL "https://api.github.com/repos/richashworth/planningpoker/releases/latest" \
              | jq -er '.assets[] | select(.label == "planningpoker.jar") | .browser_download_url') \
    && echo "downloading $URL" \
    && curl -fsSL "$URL" -o app.jar \
    && chown app:app app.jar
USER app
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
