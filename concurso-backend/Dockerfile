# Usar la imagen oficial de Java 21
FROM eclipse-temurin:21-jdk-jammy

# Directorio de trabajo
WORKDIR /app

# Copiar el archivo JAR construido
COPY target/mpd-concursos-app-backend-0.0.1.jar app_concursos.jar

# Puerto expuesto
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app_concursos.jar"]