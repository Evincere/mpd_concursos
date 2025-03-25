package ar.gov.mpd.concursobackend.document.infrastructure.storage;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
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
            // Eliminar espacios en blanco al inicio y al final
            storageLocation = storageLocation.trim();
            log.info("Using document storage location: '{}'", storageLocation);

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
        log.info("==== INICIO storeFile ====");
        log.info("Almacenando archivo: {}, ID Documento: {}, ID Usuario: {}", fileName, documentId, userId);
        log.info("Thread actual: {}", Thread.currentThread().getName());
        validateFileName(fileName);

        // Verificar si el InputStream es nulo
        boolean isInputStreamEmpty = false;
        try {
            if (fileContent == null) {
                log.error("ERROR CRÍTICO: InputStream es NULL");
                isInputStreamEmpty = true;
            } else {
                int available = fileContent.available();
                log.info("InputStream disponible: {} bytes", available);
                isInputStreamEmpty = available == 0;
                if (isInputStreamEmpty) {
                    log.warn("InputStream está vacío (0 bytes disponibles)");
                }
            }
        } catch (IOException e) {
            log.error("Error al verificar InputStream: {}", e.getMessage(), e);
            isInputStreamEmpty = true;
        }

        String sanitizedFileName = sanitizeFileName(fileName);
        String userDir = userId.toString();
        String relativePath = String.format("%s/%s_%s", userDir, documentId.toString(), sanitizedFileName);
        Path targetLocation = Paths.get(storageLocation).resolve(relativePath);

        log.info("Directorio de almacenamiento configurado: {}", storageLocation);
        log.info("Ruta de destino del archivo: {}", targetLocation.toAbsolutePath());

        try {
            // Verificar si existe el directorio base
            Path baseDir = Paths.get(storageLocation);
            if (!Files.exists(baseDir)) {
                log.info("Creando directorio base de almacenamiento: {}", baseDir);
                Files.createDirectories(baseDir);
                // Establecer permisos amplios para pruebas
                try {
                    baseDir.toFile().setReadable(true, false);
                    baseDir.toFile().setWritable(true, false);
                    baseDir.toFile().setExecutable(true, false);
                    log.info("Permisos establecidos para el directorio base: rwxrwxrwx");
                } catch (Exception e) {
                    log.warn("No se pudieron establecer permisos en el directorio base: {}", e.getMessage());
                }
            }

            // Asegurar que el directorio padre existe
            Path parentDir = targetLocation.getParent();
            log.info("Creando directorio para el usuario: {}", parentDir);
            
            if (!Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
                try {
                    parentDir.toFile().setReadable(true, false);
                    parentDir.toFile().setWritable(true, false);
                    parentDir.toFile().setExecutable(true, false);
                    log.info("Permisos establecidos para el directorio del usuario: rwxrwxrwx");
                } catch (Exception e) {
                    log.warn("No se pudieron establecer permisos en el directorio del usuario: {}", e.getMessage());
                }
            }
            
            // Si ya existe un archivo con el mismo nombre, lo eliminamos
            if (Files.exists(targetLocation)) {
                log.info("Ya existe un archivo con el mismo nombre, eliminándolo: {}", targetLocation);
                Files.delete(targetLocation);
            }

            // Copiar el contenido del InputStream al archivo destino usando buffer para mejor rendimiento
            log.info("Copiando contenido del archivo usando buffer...");
            byte[] buffer = new byte[8192]; // Buffer de 8KB
            int bytesRead;
            long totalBytesWritten = 0;
            
            try (InputStream bufferedInput = new BufferedInputStream(fileContent);
                 BufferedOutputStream bufferedOutput = new BufferedOutputStream(new FileOutputStream(targetLocation.toFile()))) {
                
                while ((bytesRead = bufferedInput.read(buffer)) != -1) {
                    bufferedOutput.write(buffer, 0, bytesRead);
                    totalBytesWritten += bytesRead;
                }
                
                // Forzar que los datos se escriban en disco
                bufferedOutput.flush();
                
                log.info("Total de bytes escritos en el archivo: {}", totalBytesWritten);
            } catch (IOException e) {
                log.error("Error durante la escritura del archivo: {}", e.getMessage(), e);
                if (Files.exists(targetLocation)) {
                    try {
                        Files.delete(targetLocation);
                        log.info("Se eliminó el archivo parcial después del error");
                    } catch (Exception ex) {
                        log.error("No se pudo eliminar el archivo parcial: {}", ex.getMessage());
                    }
                }
                throw e;
            }

            // Verificar que el archivo se creó correctamente
            if (Files.exists(targetLocation)) {
                long fileSize = Files.size(targetLocation);
                log.info("Verificación de archivo creado: {} (existe: {}, tamaño: {} bytes)",
                        targetLocation, Files.exists(targetLocation), fileSize);

                if (fileSize == 0) {
                    log.error("Advertencia: El archivo se creó pero tiene tamaño cero");
                }
            } else {
                log.error("Error crítico: El archivo no se creó correctamente en: {}", targetLocation);
                throw new DocumentException("No se pudo crear el archivo en el destino");
            }

            log.info("==== FIN storeFile (éxito) ====");
            return relativePath;
        } catch (IOException e) {
            log.error("Error al guardar el archivo: {} - Mensaje: {}", fileName, e.getMessage(), e);
            log.info("==== FIN storeFile (error) ====");
            throw new DocumentException("No se pudo guardar el archivo: " + e.getMessage(), e);
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