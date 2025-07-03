# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Configure Maven settings.xml
COPY settings.xml /usr/share/maven/conf/settings.xml

# Copy source files
COPY pom.xml .
COPY src ./src

# Build
RUN mvn clean package -DskipTests -Dmaven.test.skip=true

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create directories for document storage and profile images
RUN mkdir -p /app/document-storage && \
    mkdir -p /app/uploads/profile-images && \
    chmod -R 755 /app/uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
