FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system fintrack && useradd --system --gid fintrack fintrack
WORKDIR /app
COPY --from=build /app/target/fintrack-backend-*.jar app.jar
USER fintrack
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=5 \
    CMD curl --fail --silent http://localhost:8080/api/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
