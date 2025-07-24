# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Install necessary certificates and SSL tools
RUN apt-get update && apt-get install -y ca-certificates curl openssl && update-ca-certificates

# Copy and install custom certificate for Maven Central
COPY repo.maven.apache.org.crt /tmp/repo.maven.apache.org.crt
RUN keytool -import -alias maven-central -keystore $JAVA_HOME/lib/security/cacerts -file /tmp/repo.maven.apache.org.crt -storepass changeit -noprompt

# Configure Maven settings.xml
COPY settings.xml /usr/share/maven/conf/settings.xml

# Copy source files
COPY pom.xml .
COPY src ./src

# Build with SSL debugging (remove -Djavax.net.debug=ssl in production)
RUN mvn clean package -DskipTests -Dmaven.wagon.http.ssl.insecure=false -Dmaven.wagon.http.ssl.allowall=false

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create directories for document storage and profile images
RUN mkdir -p /app/document-storage && \
    mkdir -p /app/uploads/profile-images && \
    chmod -R 755 /app/uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]