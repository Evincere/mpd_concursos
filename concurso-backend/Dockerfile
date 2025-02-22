# Usar la imagen oficial de Java 21
FROM eclipse-temurin:21-jdk-jammy

# Información sobre el mantenedor
LABEL maintainer="MPD Concursos <concursos@mpd.gov.ar>"

# Directorio de trabajo
WORKDIR /app

# Copiar el archivo JAR construido
COPY target/mpd-concursos-app-backend-0.0.1.jar app_concursos.jar

# Copiar el directorio de datos H2 si existe
COPY data/ /app/data/

# Puerto expuesto
EXPOSE 8080

# Volumen para persistir la base de datos H2
VOLUME /app/data

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app_concursos.jar"]

