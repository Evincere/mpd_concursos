# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Install necessary certificates and SSL tools
RUN apt-get update && apt-get install -y ca-certificates curl openssl && update-ca-certificates

# Copy the custom certificate and configure SSL
COPY repo.maven.apache.org.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Configure Maven settings.xml for SSL
COPY settings.xml /usr/share/maven/conf/settings.xml

# Set fixed path for cacerts
ENV CACERTS=/opt/java/openjdk/lib/security/cacerts
ENV MAVEN_OPTS="-Djavax.net.ssl.trustStore=${CACERTS} -Djavax.net.ssl.trustStorePassword=changeit -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true"

# Copy source files
COPY pom.xml .
COPY src ./src

# Import certificate and build
RUN keytool -import -noprompt -trustcacerts -alias maven \
    -file /usr/local/share/ca-certificates/repo.maven.apache.org.crt \
    -keystore ${CACERTS} -storepass changeit && \
    mvn clean package -DskipTests \
    -Dmaven.wagon.http.ssl.insecure=true \
    -Dmaven.wagon.http.ssl.allowall=true

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create directory for document storage
RUN mkdir -p /app/document-storage

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]