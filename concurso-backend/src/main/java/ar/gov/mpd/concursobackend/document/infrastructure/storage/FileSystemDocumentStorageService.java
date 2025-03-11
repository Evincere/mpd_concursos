package ar.gov.mpd.concursobackend.document.infrastructure.storage;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FileSystemDocumentStorageService implements IDocumentStorageService {

    @Value("${app.document.storage.location:./document-storage}")
    private String storageLocation;

    @Value("${app.document.temp.cleanup.interval:3600}")
    private long cleanupIntervalSeconds;

    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

    @PostConstruct
    public void init() {
        try {
            Path storagePath = Paths.get(storageLocation);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
                log.info("Created document storage directory: {}", storageLocation);
            }

            // Iniciar tarea de limpieza programada
            startCleanupTask();
        } catch (IOException e) {
            log.error("Could not initialize document storage", e);
            throw new DocumentException("Could not initialize document storage", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        cleanupExecutor.shutdown();
        try {
            if (!cleanupExecutor.awaitTermination(60, TimeUnit.SECONDS)) {
                cleanupExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private void startCleanupTask() {
        cleanupExecutor.scheduleAtFixedRate(() -> {
            try {
                cleanupTempFiles();
            } catch (Exception e) {
                log.error("Error during temp files cleanup", e);
            }
        }, cleanupIntervalSeconds, cleanupIntervalSeconds, TimeUnit.SECONDS);
    }

    private void cleanupTempFiles() {
        Path tempDir = Paths.get(storageLocation, "temp");
        if (!Files.exists(tempDir)) {
            return;
        }

        try {
            Files.walk(tempDir)
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis() < System.currentTimeMillis()
                                    - TimeUnit.HOURS.toMillis(24);
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.debug("Deleted temp file: {}", path);
                        } catch (IOException e) {
                            log.warn("Could not delete temp file: {}", path, e);
                        }
                    });
        } catch (IOException e) {
            log.error("Error cleaning up temp files", e);
        }
    }

    @Override
    public String storeFile(InputStream fileContent, String fileName, UUID userId, UUID documentId) {
        validateFileName(fileName);

        String sanitizedFileName = sanitizeFileName(fileName);
        String userDir = userId.toString();
        String relativePath = String.format("%s/%s_%s", userDir, documentId.toString(), sanitizedFileName);
        Path targetLocation = Paths.get(storageLocation).resolve(relativePath);

        try {
            Files.createDirectories(targetLocation.getParent());

            try (FileOutputStream fos = new FileOutputStream(targetLocation.toFile())) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytes = 0;
                while ((bytesRead = fileContent.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                    totalBytes += bytesRead;

                    // Verificar tamaño máximo (50MB)
                    if (totalBytes > 50 * 1024 * 1024) {
                        throw new DocumentException("File size exceeds maximum limit of 50MB");
                    }
                }
            }

            log.debug("Stored file: {} at location: {}", fileName, targetLocation);
            return relativePath;
        } catch (IOException e) {
            log.error("Could not store file: {}", fileName, e);
            throw new DocumentException("Could not store file", e);
        }
    }

    @Override
    public InputStream getFile(String filePath) {
        try {
            Path file = Paths.get(storageLocation).resolve(filePath);
            if (!Files.exists(file)) {
                throw new DocumentException("File not found: " + filePath);
            }

            // Verificar que el archivo está dentro del directorio de almacenamiento
            if (!file.normalize().startsWith(Paths.get(storageLocation).normalize())) {
                throw new DocumentException("Invalid file path");
            }

            return new FileInputStream(file.toFile());
        } catch (IOException e) {
            log.error("Could not read file: {}", filePath, e);
            throw new DocumentException("Could not read file", e);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path file = Paths.get(storageLocation).resolve(filePath);

            // Verificar que el archivo está dentro del directorio de almacenamiento
            if (!file.normalize().startsWith(Paths.get(storageLocation).normalize())) {
                throw new DocumentException("Invalid file path");
            }

            if (!Files.deleteIfExists(file)) {
                log.warn("File not found for deletion: {}", filePath);
            } else {
                log.debug("Deleted file: {}", filePath);

                // Intentar eliminar el directorio padre si está vacío
                Path parent = file.getParent();
                if (Files.exists(parent) && Files.isDirectory(parent)) {
                    if (Files.list(parent).findFirst().isEmpty()) {
                        Files.delete(parent);
                        log.debug("Deleted empty directory: {}", parent);
                    }
                }
            }
        } catch (IOException e) {
            log.error("Could not delete file: {}", filePath, e);
            throw new DocumentException("Could not delete file", e);
        }
    }

    private void validateFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new DocumentException("File name cannot be empty");
        }

        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new DocumentException("File name contains invalid characters");
        }
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9.-]", "_");
    }
}