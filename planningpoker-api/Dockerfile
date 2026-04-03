FROM eclipse-temurin:21-jdk
VOLUME /tmp
ADD /build/libs/planningpoker-*.jar app.jar
EXPOSE 9000
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","app.jar"]
