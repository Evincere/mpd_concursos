# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Install necessary certificates and SSL tools
RUN apt-get update && apt-get install -y ca-certificates curl openssl && update-ca-certificates

# Configure Maven settings.xml
COPY settings.xml /usr/share/maven/conf/settings.xml

# Copy source files
COPY pom.xml .
COPY src ./src

# Build
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create directory for document storage
RUN mkdir -p /app/document-storage

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]