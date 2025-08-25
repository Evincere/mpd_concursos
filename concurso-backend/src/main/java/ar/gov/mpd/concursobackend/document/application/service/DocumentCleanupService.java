package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Servicio para limpieza automática de archivos huérfanos y mantenimiento del sistema
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentCleanupService {

    private final IDocumentRepository documentRepository;
    private final DocumentAuditService auditService;
    
    // Configuración
    private static final String DOCUMENT_STORAGE_PATH = "document-storage";
    private static final int CLEANUP_BATCH_SIZE = 100;
    private static final int ORPHAN_FILE_AGE_HOURS = 24; // Archivos huérfanos más antiguos que 24h

    /**
     * Job programado que se ejecuta cada 6 horas para limpiar archivos huérfanos
     */
    // @Scheduled(fixedRate = 6 * 60 * 60 * 1000) // DESHABILITADO POR SEGURIDAD - NO ACTIVAR SIN REVISIÓN DEL EQUIPO // 6 horas en milisegundos
    @Async
    public void cleanupOrphanFiles() {
        log.info("🚨 PROCESO DE LIMPIEZA DESHABILITADO - DocumentCleanupService.cleanupOrphanFiles() NO DEBE EJECUTARSE");
        log.error("🚨 Este método fue deshabilitado por eliminación no autorizada de documentos");
        log.error("🚨 Contactar al equipo de desarrollo antes de reactivar");
        return; // Salir inmediatamente sin ejecutar limpieza
        //         
        //         log.info("🧹 [DocumentCleanup] Iniciando limpieza programada de archivos huérfanos");
        //         
        //         try {
        //             CleanupResult result = performCleanup();
        //             
        //             log.info("✅ [DocumentCleanup] Limpieza completada: {} archivos eliminados, {} errores", 
        //                     result.getFilesDeleted(), result.getErrors());
        //                     
        //         } catch (Exception e) {
        //             log.error("❌ [DocumentCleanup] Error durante limpieza programada", e);
        //         }
    }

    /**
     * Ejecuta limpieza manual de archivos huérfanos
     */
    @Transactional
    public CompletableFuture<CleanupResult> performManualCleanup() {
        log.info("🧹 [DocumentCleanup] Iniciando limpieza manual de archivos huérfanos");
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                return performCleanup();
            } catch (Exception e) {
                log.error("❌ [DocumentCleanup] Error durante limpieza manual", e);
                return CleanupResult.builder()
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build();
            }
        });
    }

    /**
     * Realiza la limpieza de archivos huérfanos
     */
    private CleanupResult performCleanup() {
        CleanupResult.Builder resultBuilder = CleanupResult.builder()
                .startTime(LocalDateTime.now())
                .success(true);

        try {
            // 1. Obtener todos los archivos físicos
            Set<String> physicalFiles = getPhysicalFiles();
            log.debug("📁 [DocumentCleanup] Encontrados {} archivos físicos", physicalFiles.size());

            // 2. Obtener todos los archivos referenciados en BD
            Set<String> referencedFiles = getReferencedFiles();
            log.debug("🗄️ [DocumentCleanup] Encontrados {} archivos referenciados en BD", referencedFiles.size());

            // 3. Identificar archivos huérfanos
            Set<String> orphanFiles = physicalFiles.stream()
                    .filter(file -> !referencedFiles.contains(file))
                    .filter(this::isOldEnough)
                    .collect(Collectors.toSet());

            log.info("🔍 [DocumentCleanup] Identificados {} archivos huérfanos para eliminación", orphanFiles.size());

            // 4. Eliminar archivos huérfanos en lotes
            int deletedCount = 0;
            int errorCount = 0;

            for (String orphanFile : orphanFiles) {
                try {
                    if (deletePhysicalFile(orphanFile)) {
                        deletedCount++;
                        log.debug("🗑️ [DocumentCleanup] Archivo eliminado: {}", orphanFile);
                    }
                } catch (Exception e) {
                    errorCount++;
                    log.warn("⚠️ [DocumentCleanup] Error eliminando archivo: {}", orphanFile, e);
                }

                // Procesar en lotes para evitar sobrecarga
                if ((deletedCount + errorCount) % CLEANUP_BATCH_SIZE == 0) {
                    log.debug("📊 [DocumentCleanup] Progreso: {} eliminados, {} errores", deletedCount, errorCount);
                }
            }

            return resultBuilder
                    .filesDeleted(deletedCount)
                    .errors(errorCount)
                    .endTime(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("❌ [DocumentCleanup] Error durante proceso de limpieza", e);
            return resultBuilder
                    .success(false)
                    .errorMessage(e.getMessage())
                    .endTime(LocalDateTime.now())
                    .build();
        }
    }

    /**
     * Obtiene todos los archivos físicos del sistema de almacenamiento
     */
    private Set<String> getPhysicalFiles() throws IOException {
        Path storagePath = Paths.get(DOCUMENT_STORAGE_PATH);
        
        if (!Files.exists(storagePath)) {
            log.warn("⚠️ [DocumentCleanup] Directorio de almacenamiento no existe: {}", DOCUMENT_STORAGE_PATH);
            return Set.of();
        }

        try (Stream<Path> paths = Files.walk(storagePath)) {
            return paths
                    .filter(Files::isRegularFile)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
        }
    }

    /**
     * Obtiene todos los archivos referenciados en la base de datos
     */
    private Set<String> getReferencedFiles() {
        List<Document> allDocuments = documentRepository.findAll();
        
        return allDocuments.stream()
                .map(Document::getFilePath)
                .filter(filePath -> filePath != null && !filePath.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * Verifica si un archivo es lo suficientemente antiguo para ser eliminado
     */
    private boolean isOldEnough(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                return false;
            }

            LocalDateTime fileTime = LocalDateTime.ofInstant(
                    Files.getLastModifiedTime(path).toInstant(),
                    java.time.ZoneId.systemDefault()
            );

            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(ORPHAN_FILE_AGE_HOURS);
            return fileTime.isBefore(cutoffTime);

        } catch (IOException e) {
            log.warn("⚠️ [DocumentCleanup] Error verificando edad del archivo: {}", filePath, e);
            return false;
        }
    }

    /**
     * Elimina un archivo físico del sistema
     */
    private boolean deletePhysicalFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        
        if (Files.exists(path)) {
            Files.delete(path);
            return true;
        }
        
        return false;
    }

    /**
     * Resultado del proceso de limpieza
     */
    public static class CleanupResult {
        private final boolean success;
        private final int filesDeleted;
        private final int errors;
        private final LocalDateTime startTime;
        private final LocalDateTime endTime;
        private final String errorMessage;

        private CleanupResult(Builder builder) {
            this.success = builder.success;
            this.filesDeleted = builder.filesDeleted;
            this.errors = builder.errors;
            this.startTime = builder.startTime;
            this.endTime = builder.endTime;
            this.errorMessage = builder.errorMessage;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public boolean isSuccess() { return success; }
        public int getFilesDeleted() { return filesDeleted; }
        public int getErrors() { return errors; }
        public LocalDateTime getStartTime() { return startTime; }
        public LocalDateTime getEndTime() { return endTime; }
        public String getErrorMessage() { return errorMessage; }

        public long getDurationMinutes() {
            if (startTime != null && endTime != null) {
                return java.time.Duration.between(startTime, endTime).toMinutes();
            }
            return 0;
        }

        public static class Builder {
            private boolean success = false;
            private int filesDeleted = 0;
            private int errors = 0;
            private LocalDateTime startTime;
            private LocalDateTime endTime;
            private String errorMessage;

            public Builder success(boolean success) {
                this.success = success;
                return this;
            }

            public Builder filesDeleted(int filesDeleted) {
                this.filesDeleted = filesDeleted;
                return this;
            }

            public Builder errors(int errors) {
                this.errors = errors;
                return this;
            }

            public Builder startTime(LocalDateTime startTime) {
                this.startTime = startTime;
                return this;
            }

            public Builder endTime(LocalDateTime endTime) {
                this.endTime = endTime;
                return this;
            }

            public Builder errorMessage(String errorMessage) {
                this.errorMessage = errorMessage;
                return this;
            }

            public CleanupResult build() {
                return new CleanupResult(this);
            }
        }
    }
}
