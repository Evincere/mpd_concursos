package ar.gov.mpd.concursobackend.shared.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuración centralizada para el sistema de almacenamiento de archivos
 * 
 * Proporciona una configuración unificada para todas las rutas de almacenamiento
 * del sistema, incluyendo documentos, imágenes de perfil, bases de concursos
 * y documentos de CV.
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-07
 */
@Component
@ConfigurationProperties(prefix = "app.storage")
@Data
@Slf4j
public class StorageConfig {

    /**
     * Directorio base para todo el almacenamiento
     * Desarrollo: ./storage
     * Producción: /app/storage
     */
    private String baseDir = "./storage";

    /**
     * Subdirectorio para documentos MPD (DNI, CUIL, certificados)
     */
    private String documentsDir = "documents";

    /**
     * Subdirectorio para bases de concursos (PDFs)
     */
    private String contestBasesDir = "contest-bases";

    /**
     * Subdirectorio para documentos de CV (experiencia laboral, educación)
     */
    private String cvDocumentsDir = "cv-documents";

    /**
     * Subdirectorio para imágenes de perfil de usuarios
     */
    private String profileImagesDir = "profile-images";

    /**
     * Subdirectorio para archivos temporales
     */
    private String tempDir = "temp";

    /**
     * Inicialización de directorios al arrancar la aplicación
     */
    @PostConstruct
    public void init() {
        try {
            log.info("Inicializando sistema de almacenamiento con directorio base: {}", baseDir);
            
            // Crear todos los directorios necesarios
            createDirectoryIfNotExists(getBasePath());
            createDirectoryIfNotExists(getDocumentsPath());
            createDirectoryIfNotExists(getContestBasesPath());
            createDirectoryIfNotExists(getCvDocumentsPath());
            createDirectoryIfNotExists(getProfileImagesPath());
            createDirectoryIfNotExists(getTempPath());
            
            log.info("Sistema de almacenamiento inicializado correctamente");
            
        } catch (IOException e) {
            log.error("Error al inicializar sistema de almacenamiento", e);
            throw new RuntimeException("No se pudo inicializar el sistema de almacenamiento", e);
        }
    }

    /**
     * Obtiene la ruta base del almacenamiento
     */
    public Path getBasePath() {
        return Paths.get(baseDir);
    }

    /**
     * Obtiene la ruta para documentos MPD
     */
    public Path getDocumentsPath() {
        return Paths.get(baseDir, documentsDir);
    }

    /**
     * Obtiene la ruta para bases de concursos
     */
    public Path getContestBasesPath() {
        return Paths.get(baseDir, contestBasesDir);
    }

    /**
     * Obtiene la ruta para documentos de CV
     */
    public Path getCvDocumentsPath() {
        return Paths.get(baseDir, cvDocumentsDir);
    }

    /**
     * Obtiene la ruta para imágenes de perfil
     */
    public Path getProfileImagesPath() {
        return Paths.get(baseDir, profileImagesDir);
    }

    /**
     * Obtiene la ruta para archivos temporales
     */
    public Path getTempPath() {
        return Paths.get(baseDir, tempDir);
    }

    /**
     * Obtiene la ruta completa para un archivo en el directorio de documentos
     */
    public Path getDocumentFilePath(String filename) {
        return getDocumentsPath().resolve(filename);
    }

    /**
     * Obtiene la ruta completa para un archivo en el directorio de bases de concursos
     */
    public Path getContestBasesFilePath(String filename) {
        return getContestBasesPath().resolve(filename);
    }

    /**
     * Obtiene la ruta completa para un archivo en el directorio de documentos CV
     */
    public Path getCvDocumentFilePath(String filename) {
        return getCvDocumentsPath().resolve(filename);
    }

    /**
     * Obtiene la ruta completa para un archivo en el directorio de imágenes de perfil
     */
    public Path getProfileImageFilePath(String filename) {
        return getProfileImagesPath().resolve(filename);
    }

    /**
     * Obtiene la ruta completa para un archivo temporal
     */
    public Path getTempFilePath(String filename) {
        return getTempPath().resolve(filename);
    }

    /**
     * Verifica si un archivo existe en el directorio de documentos
     */
    public boolean documentExists(String filename) {
        return Files.exists(getDocumentFilePath(filename));
    }

    /**
     * Verifica si un archivo existe en el directorio de bases de concursos
     */
    public boolean contestBasesFileExists(String filename) {
        return Files.exists(getContestBasesFilePath(filename));
    }

    /**
     * Verifica si un archivo existe en el directorio de documentos CV
     */
    public boolean cvDocumentExists(String filename) {
        return Files.exists(getCvDocumentFilePath(filename));
    }

    /**
     * Verifica si un archivo existe en el directorio de imágenes de perfil
     */
    public boolean profileImageExists(String filename) {
        return Files.exists(getProfileImageFilePath(filename));
    }

    /**
     * Crea un directorio si no existe
     */
    private void createDirectoryIfNotExists(Path path) throws IOException {
        if (!Files.exists(path)) {
            Files.createDirectories(path);
            log.debug("Directorio creado: {}", path);
        } else {
            log.debug("Directorio ya existe: {}", path);
        }
    }

    /**
     * Obtiene información de configuración para logging
     */
    public String getConfigInfo() {
        return String.format(
            "StorageConfig{baseDir='%s', documentsDir='%s', contestBasesDir='%s', " +
            "cvDocumentsDir='%s', profileImagesDir='%s', tempDir='%s'}",
            baseDir, documentsDir, contestBasesDir, cvDocumentsDir, profileImagesDir, tempDir
        );
    }
}
