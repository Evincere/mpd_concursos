package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Servicio para limpiar documentos archivados que tienen más de 15 días
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ArchivedDocumentCleanupService {

    private final IDocumentRepository documentRepository;
    private final IDocumentStorageService documentStorageService;

    // Ejecutar cada día a las 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupArchivedDocuments() {
        log.info("🧹 [ArchivedDocumentCleanup] Iniciando limpieza de documentos archivados...");
        
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(15);
            List<Document> documentsToCleanup = findArchivedDocumentsOlderThan(cutoffDate);
            
            if (documentsToCleanup.isEmpty()) {
                log.info("✅ [ArchivedDocumentCleanup] No hay documentos archivados para limpiar");
                return;
            }
            
            log.info("📋 [ArchivedDocumentCleanup] Encontrados {} documentos archivados para eliminar", 
                    documentsToCleanup.size());
            
            AtomicInteger deletedFiles = new AtomicInteger(0);
            AtomicInteger deletedRecords = new AtomicInteger(0);
            AtomicInteger errors = new AtomicInteger(0);
            
            documentsToCleanup.forEach(document -> {
                try {
                    // Eliminar archivo físico
                    if (document.getFilePath() != null) {
                        documentStorageService.deleteFile(document.getFilePath());
                        deletedFiles.incrementAndGet();
                        log.debug("🗑️ [ArchivedDocumentCleanup] Archivo eliminado: {}", document.getFilePath());
                    }
                    
                    // Eliminar registro de base de datos
                    documentRepository.deleteById(document.getId());
                    deletedRecords.incrementAndGet();
                    log.debug("🗑️ [ArchivedDocumentCleanup] Registro eliminado: {}", document.getId().value());
                    
                } catch (Exception e) {
                    errors.incrementAndGet();
                    log.error("❌ [ArchivedDocumentCleanup] Error eliminando documento archivado: {}", 
                            document.getId().value(), e);
                }
            });
            
            log.info("✅ [ArchivedDocumentCleanup] Limpieza completada - Archivos eliminados: {}, " +
                    "Registros eliminados: {}, Errores: {}", 
                    deletedFiles.get(), deletedRecords.get(), errors.get());
                    
        } catch (Exception e) {
            log.error("❌ [ArchivedDocumentCleanup] Error durante limpieza de documentos archivados", e);
        }
    }

    /**
     * Encuentra documentos archivados más antiguos que la fecha especificada
     */
    private List<Document> findArchivedDocumentsOlderThan(LocalDateTime cutoffDate) {
        return documentRepository.findAll().stream()
                .filter(Document::isArchived)
                .filter(doc -> doc.getArchivedAt() != null && doc.getArchivedAt().isBefore(cutoffDate))
                .toList();
    }

    /**
     * Ejecuta limpieza manual para testing/admin
     */
    @Transactional
    public CleanupResult performManualCleanup() {
        log.info("🔧 [ArchivedDocumentCleanup] Ejecutando limpieza manual...");
        
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(15);
            List<Document> documentsToCleanup = findArchivedDocumentsOlderThan(cutoffDate);
            
            CleanupResult result = CleanupResult.builder()
                    .startTime(LocalDateTime.now())
                    .totalDocumentsFound(documentsToCleanup.size())
                    .build();
            
            if (documentsToCleanup.isEmpty()) {
                result.setSuccess(true);
                result.setMessage("No hay documentos archivados para limpiar");
                result.setEndTime(LocalDateTime.now());
                return result;
            }
            
            AtomicInteger deletedFiles = new AtomicInteger(0);
            AtomicInteger deletedRecords = new AtomicInteger(0);
            AtomicInteger errors = new AtomicInteger(0);
            
            documentsToCleanup.forEach(document -> {
                try {
                    if (document.getFilePath() != null) {
                        documentStorageService.deleteFile(document.getFilePath());
                        deletedFiles.incrementAndGet();
                    }
                    
                    documentRepository.deleteById(document.getId());
                    deletedRecords.incrementAndGet();
                    
                } catch (Exception e) {
                    errors.incrementAndGet();
                    log.error("Error eliminando documento archivado: {}", document.getId().value(), e);
                }
            });
            
            result.setDeletedFiles(deletedFiles.get());
            result.setDeletedRecords(deletedRecords.get());
            result.setErrors(errors.get());
            result.setSuccess(errors.get() == 0);
            result.setMessage(String.format("Limpieza completada - Archivos: %d, Registros: %d, Errores: %d",
                    deletedFiles.get(), deletedRecords.get(), errors.get()));
            result.setEndTime(LocalDateTime.now());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error durante limpieza manual", e);
            return CleanupResult.builder()
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now())
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * Resultado de operación de limpieza
     */
    public static class CleanupResult {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean success;
        private String message;
        private String errorMessage;
        private int totalDocumentsFound;
        private int deletedFiles;
        private int deletedRecords;
        private int errors;

        // Constructor privado para builder
        private CleanupResult() {}

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final CleanupResult result = new CleanupResult();

            public Builder startTime(LocalDateTime startTime) {
                result.startTime = startTime;
                return this;
            }

            public Builder endTime(LocalDateTime endTime) {
                result.endTime = endTime;
                return this;
            }

            public Builder success(boolean success) {
                result.success = success;
                return this;
            }

            public Builder message(String message) {
                result.message = message;
                return this;
            }

            public Builder errorMessage(String errorMessage) {
                result.errorMessage = errorMessage;
                return this;
            }

            public Builder totalDocumentsFound(int totalDocumentsFound) {
                result.totalDocumentsFound = totalDocumentsFound;
                return this;
            }

            public CleanupResult build() {
                return result;
            }
        }

        // Getters y setters
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

        public int getTotalDocumentsFound() { return totalDocumentsFound; }
        public void setTotalDocumentsFound(int totalDocumentsFound) { this.totalDocumentsFound = totalDocumentsFound; }

        public int getDeletedFiles() { return deletedFiles; }
        public void setDeletedFiles(int deletedFiles) { this.deletedFiles = deletedFiles; }

        public int getDeletedRecords() { return deletedRecords; }
        public void setDeletedRecords(int deletedRecords) { this.deletedRecords = deletedRecords; }

        public int getErrors() { return errors; }
        public void setErrors(int errors) { this.errors = errors; }
    }
}
