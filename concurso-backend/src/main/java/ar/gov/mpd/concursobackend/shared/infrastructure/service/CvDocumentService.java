package ar.gov.mpd.concursobackend.shared.infrastructure.service;

import ar.gov.mpd.concursobackend.shared.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para gestión de documentos del CV
 *
 * Actualizado para usar el sistema de almacenamiento unificado
 * a través de StorageConfig.
 *
 * @author MPD Development Team
 * @version 2.0
 * @since 2025-07
 */
@Service
@RequiredArgsConstructor
public class CvDocumentService {

    private static final Logger logger = LoggerFactory.getLogger(CvDocumentService.class);

    private final StorageConfig storageConfig;

    @Value("${app.cv.document.max-size:10MB}")
    private String maxFileSize;

    @Value("${app.cv.document.allowed-types:application/pdf,image/jpeg,image/png,image/jpg}")
    private String allowedTypes;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".pdf", ".jpg", ".jpeg", ".png");

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    /**
     * Almacena un documento de experiencia laboral
     */
    public String storeExperienceDocument(UUID userId, UUID experienceId, MultipartFile file) {
        logger.info("Storing experience document for user: {} and experience: {}", userId, experienceId);

        validateFile(file);

        try {
            Path userExperiencePath = createUserExperienceDirectory(userId);
            String fileName = generateFileName(experienceId, "experience", file.getOriginalFilename());
            Path targetPath = userExperiencePath.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = getRelativePath(targetPath);
            logger.info("Experience document stored successfully at: {}", relativePath);

            return relativePath;

        } catch (IOException e) {
            logger.error("Error storing experience document for user: {} and experience: {}", userId, experienceId, e);
            throw new RuntimeException("Error al almacenar documento de experiencia: " + e.getMessage(), e);
        }
    }

    /**
     * Almacena un documento de experiencia laboral desde InputStream
     */
    public String storeExperienceDocumentFromStream(UUID userId, UUID experienceId, InputStream inputStream,
            String filename) {
        logger.info("Storing experience document from stream for user: {} and experience: {}", userId, experienceId);

        validateFilename(filename);

        try {
            Path userExperiencePath = createUserExperienceDirectory(userId);
            String fileName = generateFileName(experienceId, "experience", filename);
            Path targetPath = userExperiencePath.resolve(fileName);

            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = getRelativePath(targetPath);
            logger.info("Experience document stored successfully at: {}", relativePath);

            return relativePath;

        } catch (IOException e) {
            logger.error("Error storing experience document from stream for user: {} and experience: {}", userId,
                    experienceId, e);
            throw new RuntimeException("Error al almacenar documento de experiencia: " + e.getMessage(), e);
        }
    }

    /**
     * Almacena un documento de educación
     */
    public String storeEducationDocument(UUID userId, UUID educationId, MultipartFile file) {
        logger.info("Storing education document for user: {} and education: {}", userId, educationId);

        validateFile(file);

        try {
            Path userEducationPath = createUserEducationDirectory(userId);
            String fileName = generateFileName(educationId, "education", file.getOriginalFilename());
            Path targetPath = userEducationPath.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = getRelativePath(targetPath);
            logger.info("Education document stored successfully at: {}", relativePath);

            return relativePath;

        } catch (IOException e) {
            logger.error("Error storing education document for user: {} and education: {}", userId, educationId, e);
            throw new RuntimeException("Error al almacenar documento de educación: " + e.getMessage(), e);
        }
    }

    /**
     * Almacena un documento de educación desde InputStream
     */
    public String storeEducationDocumentFromStream(UUID userId, UUID educationId, InputStream inputStream,
            String filename) {
        logger.info("Storing education document from stream for user: {} and education: {}", userId, educationId);

        validateFilename(filename);

        try {
            // Verificar que el directorio base existe
            Path baseDir = storageConfig.getCvDocumentsPath();
            if (!Files.exists(baseDir)) {
                logger.info("Creating base CV document directory: {}", baseDir);
                Files.createDirectories(baseDir);
            }

            Path userEducationPath = createUserEducationDirectory(userId);
            String fileName = generateFileName(educationId, "education", filename);
            Path targetPath = userEducationPath.resolve(fileName);

            // Verificar que el InputStream no esté vacío
            if (inputStream.available() == 0) {
                logger.error("InputStream is empty for education document");
                throw new RuntimeException("El archivo está vacío");
            }

            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Verificar que el archivo se creó correctamente
            if (!Files.exists(targetPath)) {
                logger.error("File was not created at: {}", targetPath);
                throw new RuntimeException("No se pudo crear el archivo");
            }

            long fileSize = Files.size(targetPath);
            if (fileSize == 0) {
                logger.error("File was created but is empty at: {}", targetPath);
                throw new RuntimeException("El archivo se creó pero está vacío");
            }

            String relativePath = getRelativePath(targetPath);
            logger.info("Education document stored successfully at: {} (size: {} bytes)", relativePath, fileSize);

            return relativePath;

        } catch (IOException e) {
            logger.error("IOException storing education document from stream for user: {} and education: {}", userId,
                    educationId, e);
            logger.error("Error details: {}", e.getMessage());
            throw new RuntimeException("Error de E/S al almacenar documento de educación: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error storing education document from stream for user: {} and education: {}", userId,
                    educationId, e);
            logger.error("Error details: {}", e.getMessage());
            throw new RuntimeException("Error inesperado al almacenar documento de educación: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina un documento del CV
     */
    public boolean deleteDocument(String documentPath) {
        if (documentPath == null || documentPath.trim().isEmpty()) {
            return false;
        }

        try {
            Path fullPath = Paths.get(documentPath);
            if (Files.exists(fullPath)) {
                Files.delete(fullPath);
                logger.info("Document deleted successfully: {}", documentPath);
                return true;
            } else {
                logger.warn("Document not found for deletion: {}", documentPath);
                return false;
            }
        } catch (IOException e) {
            logger.error("Error deleting document: {}", documentPath, e);
            return false;
        }
    }

    /**
     * Verifica si un documento existe
     */
    public boolean documentExists(String documentPath) {
        if (documentPath == null || documentPath.trim().isEmpty()) {
            return false;
        }

        Path fullPath = Paths.get(documentPath);
        return Files.exists(fullPath);
    }

    /**
     * Obtiene el tamaño de un documento
     */
    public long getDocumentSize(String documentPath) {
        if (!documentExists(documentPath)) {
            return 0;
        }

        try {
            Path fullPath = Paths.get(documentPath);
            return Files.size(fullPath);
        } catch (IOException e) {
            logger.error("Error getting document size: {}", documentPath, e);
            return 0;
        }
    }

    /**
     * Obtiene la ruta completa de un documento
     */
    public Path getDocumentPath(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            throw new IllegalArgumentException("La ruta relativa no puede estar vacía");
        }

        // Si la ruta ya es absoluta, usarla directamente
        Path path = Paths.get(relativePath);
        if (path.isAbsolute()) {
            return path;
        }

        // Si es relativa, combinarla con el directorio base
        return storageConfig.getCvDocumentsPath().resolve(relativePath);
    }

    /**
     * Limpia archivos temporales antiguos
     */
    public void cleanupTempFiles() {
        try {
            Path tempPath = storageConfig.getTempPath();
            if (!Files.exists(tempPath)) {
                return;
            }

            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);

            Files.walk(tempPath)
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toInstant()
                                    .isBefore(cutoffTime.atZone(java.time.ZoneId.systemDefault()).toInstant());
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            logger.debug("Deleted temp file: {}", path);
                        } catch (IOException e) {
                            logger.warn("Could not delete temp file: {}", path, e);
                        }
                    });

        } catch (IOException e) {
            logger.error("Error during temp files cleanup", e);
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    /**
     * Valida el archivo subido
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }

        // Validar tamaño
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de " + maxFileSize);
        }

        // Validar extensión
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("El nombre del archivo no puede estar vacío");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Tipo de archivo no permitido. Tipos permitidos: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        // Validar tipo MIME
        String contentType = file.getContentType();
        if (contentType != null) {
            List<String> allowedMimeTypes = Arrays.asList(allowedTypes.split(","));
            if (!allowedMimeTypes.contains(contentType)) {
                logger.warn("Content type {} not in allowed list, but extension {} is valid", contentType, extension);
            }
        }
    }

    /**
     * Valida el nombre del archivo
     */
    private void validateFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del archivo no puede estar vacío");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Tipo de archivo no permitido. Tipos permitidos: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    /**
     * Crea el directorio de experiencias del usuario
     */
    private Path createUserExperienceDirectory(UUID userId) throws IOException {
        Path userPath = storageConfig.getCvDocumentsPath().resolve(userId.toString()).resolve("experiences");
        Files.createDirectories(userPath);
        return userPath;
    }

    /**
     * Crea el directorio de educación del usuario
     */
    private Path createUserEducationDirectory(UUID userId) throws IOException {
        Path userPath = storageConfig.getCvDocumentsPath().resolve(userId.toString()).resolve("education");

        logger.debug("Creating user education directory: {}", userPath);

        try {
            Files.createDirectories(userPath);

            // Verificar que el directorio se creó correctamente
            if (!Files.exists(userPath)) {
                throw new IOException("No se pudo crear el directorio: " + userPath);
            }

            if (!Files.isDirectory(userPath)) {
                throw new IOException("La ruta existe pero no es un directorio: " + userPath);
            }

            if (!Files.isWritable(userPath)) {
                throw new IOException("El directorio no tiene permisos de escritura: " + userPath);
            }

            logger.debug("User education directory created successfully: {}", userPath);
            return userPath;

        } catch (IOException e) {
            logger.error("Error creating user education directory: {}", userPath, e);
            throw new IOException("Error al crear directorio de educación para usuario " + userId + ": " + e.getMessage(), e);
        }
    }

    /**
     * Genera un nombre único para el archivo
     */
    private String generateFileName(UUID itemId, String type, String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("%s_%s_%s%s", itemId.toString(), type, timestamp, extension);
    }

    /**
     * Obtiene la extensión del archivo
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
    }

    /**
     * Obtiene la ruta relativa del archivo desde el directorio base de CV documents
     */
    private String getRelativePath(Path fullPath) {
        Path basePath = storageConfig.getCvDocumentsPath();
        return basePath.relativize(fullPath).toString().replace("\\", "/");
    }

    /**
     * Obtiene estadísticas de almacenamiento para un usuario
     */
    public CvDocumentStats getUserDocumentStats(UUID userId) {
        try {
            Path userPath = storageConfig.getCvDocumentsPath().resolve(userId.toString());
            if (!Files.exists(userPath)) {
                return new CvDocumentStats(0, 0, 0L);
            }

            long[] stats = Files.walk(userPath)
                    .filter(Files::isRegularFile)
                    .mapToLong(path -> {
                        try {
                            return Files.size(path);
                        } catch (IOException e) {
                            return 0L;
                        }
                    })
                    .collect(
                            () -> new long[] { 0, 0 }, // [count, totalSize]
                            (acc, size) -> {
                                acc[0]++; // count
                                acc[1] += size; // totalSize
                            },
                            (acc1, acc2) -> {
                                acc1[0] += acc2[0];
                                acc1[1] += acc2[1];
                            });

            return new CvDocumentStats((int) stats[0], (int) stats[0], stats[1]);

        } catch (IOException e) {
            logger.error("Error getting document stats for user: {}", userId, e);
            return new CvDocumentStats(0, 0, 0L);
        }
    }

    /**
     * Clase para estadísticas de documentos
     */
    public static class CvDocumentStats {
        private final int totalDocuments;
        private final int experienceDocuments;
        private final long totalSizeBytes;

        public CvDocumentStats(int totalDocuments, int experienceDocuments, long totalSizeBytes) {
            this.totalDocuments = totalDocuments;
            this.experienceDocuments = experienceDocuments;
            this.totalSizeBytes = totalSizeBytes;
        }

        public int getTotalDocuments() {
            return totalDocuments;
        }

        public int getExperienceDocuments() {
            return experienceDocuments;
        }

        public long getTotalSizeBytes() {
            return totalSizeBytes;
        }

        public double getTotalSizeMB() {
            return totalSizeBytes / (1024.0 * 1024.0);
        }
    }
}
