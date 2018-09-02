FROM openjdk:8-jdk-alpine
VOLUME /tmp
ADD /build/libs/planningpoker-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","app.jar"]
