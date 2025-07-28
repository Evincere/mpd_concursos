package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Servicio para verificación de consistencia entre base de datos y archivos físicos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentConsistencyService {

    private final IDocumentRepository documentRepository;
    
    private static final String DOCUMENT_STORAGE_PATH = "document-storage";

    /**
     * Verificación programada de consistencia cada 12 horas
     */
    @Scheduled(fixedRate = 12 * 60 * 60 * 1000) // 12 horas
    @Async
    public void scheduledConsistencyCheck() {
        log.info("🔍 [DocumentConsistency] Iniciando verificación programada de consistencia");
        
        try {
            ConsistencyReport report = performConsistencyCheck();
            logConsistencyReport(report);
            
            if (!report.isConsistent()) {
                log.warn("⚠️ [DocumentConsistency] Inconsistencias detectadas en el sistema");
            }
            
        } catch (Exception e) {
            log.error("❌ [DocumentConsistency] Error durante verificación programada", e);
        }
    }

    /**
     * Ejecuta verificación manual de consistencia
     */
    @Async
    public CompletableFuture<ConsistencyReport> performManualConsistencyCheck() {
        log.info("🔍 [DocumentConsistency] Iniciando verificación manual de consistencia");
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                return performConsistencyCheck();
            } catch (Exception e) {
                log.error("❌ [DocumentConsistency] Error durante verificación manual", e);
                return ConsistencyReport.builder()
                        .consistent(false)
                        .errorMessage(e.getMessage())
                        .checkTime(LocalDateTime.now())
                        .build();
            }
        });
    }

    /**
     * Realiza la verificación de consistencia
     */
    private ConsistencyReport performConsistencyCheck() {
        ConsistencyReport.Builder reportBuilder = ConsistencyReport.builder()
                .checkTime(LocalDateTime.now())
                .consistent(true);

        try {
            // 1. Obtener documentos de la BD
            List<Document> dbDocuments = documentRepository.findAll();
            log.debug("📊 [DocumentConsistency] Documentos en BD: {}", dbDocuments.size());

            // 2. Verificar archivos faltantes
            List<String> missingFiles = findMissingFiles(dbDocuments);
            reportBuilder.missingFiles(missingFiles);

            // 3. Verificar archivos huérfanos
            List<String> orphanFiles = findOrphanFiles(dbDocuments);
            reportBuilder.orphanFiles(orphanFiles);

            // 4. Verificar documentos con rutas inválidas
            List<String> invalidPaths = findInvalidPaths(dbDocuments);
            reportBuilder.invalidPaths(invalidPaths);

            // 5. Verificar duplicados en BD
            List<String> duplicateEntries = findDuplicateEntries(dbDocuments);
            reportBuilder.duplicateEntries(duplicateEntries);

            // 6. Calcular estadísticas
            reportBuilder
                    .totalDocuments(dbDocuments.size())
                    .activeDocuments((int) dbDocuments.stream().filter(doc -> !doc.isArchived()).count())
                    .archivedDocuments((int) dbDocuments.stream().filter(Document::isArchived).count());

            // 7. Determinar si el sistema es consistente
            boolean isConsistent = missingFiles.isEmpty() && 
                                 orphanFiles.isEmpty() && 
                                 invalidPaths.isEmpty() && 
                                 duplicateEntries.isEmpty();
            
            reportBuilder.consistent(isConsistent);

            ConsistencyReport report = reportBuilder.build();
            log.info("📋 [DocumentConsistency] Verificación completada: {}", 
                    isConsistent ? "CONSISTENTE" : "INCONSISTENTE");

            return report;

        } catch (Exception e) {
            log.error("❌ [DocumentConsistency] Error durante verificación", e);
            return reportBuilder
                    .consistent(false)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * Encuentra archivos referenciados en BD pero que no existen físicamente
     */
    private List<String> findMissingFiles(List<Document> documents) {
        List<String> missingFiles = new ArrayList<>();

        for (Document doc : documents) {
            String filePath = doc.getFilePath();
            if (filePath != null && !filePath.isEmpty()) {
                Path path = Paths.get(filePath);
                if (!Files.exists(path)) {
                    missingFiles.add(filePath);
                    log.debug("📄 [DocumentConsistency] Archivo faltante: {}", filePath);
                }
            }
        }

        return missingFiles;
    }

    /**
     * Encuentra archivos físicos que no están referenciados en BD
     */
    private List<String> findOrphanFiles(List<Document> documents) throws IOException {
        Set<String> referencedFiles = documents.stream()
                .map(Document::getFilePath)
                .filter(path -> path != null && !path.isEmpty())
                .collect(Collectors.toSet());

        Path storagePath = Paths.get(DOCUMENT_STORAGE_PATH);
        if (!Files.exists(storagePath)) {
            return List.of();
        }

        return Files.walk(storagePath)
                .filter(Files::isRegularFile)
                .map(Path::toString)
                .filter(path -> !referencedFiles.contains(path))
                .collect(Collectors.toList());
    }

    /**
     * Encuentra documentos con rutas de archivo inválidas
     */
    private List<String> findInvalidPaths(List<Document> documents) {
        List<String> invalidPaths = new ArrayList<>();

        for (Document doc : documents) {
            String filePath = doc.getFilePath();
            if (filePath != null && !filePath.isEmpty()) {
                // Verificar formato de ruta
                if (!filePath.startsWith(DOCUMENT_STORAGE_PATH) || 
                    !filePath.toLowerCase().endsWith(".pdf")) {
                    invalidPaths.add(String.format("Document ID: %s, Path: %s", 
                            doc.getId().value(), filePath));
                }
            } else if (!doc.isArchived()) {
                // Documentos activos deben tener ruta de archivo
                invalidPaths.add(String.format("Document ID: %s (missing file path)", 
                        doc.getId().value()));
            }
        }

        return invalidPaths;
    }

    /**
     * Encuentra entradas duplicadas en BD (mismo usuario y tipo de documento activo)
     */
    private List<String> findDuplicateEntries(List<Document> documents) {
        List<String> duplicates = new ArrayList<>();
        
        // Agrupar por usuario y tipo de documento (solo activos)
        var activeDocuments = documents.stream()
                .filter(doc -> !doc.isArchived())
                .collect(Collectors.groupingBy(doc -> 
                    doc.getUserId() + ":" + doc.getDocumentType().getId().value()));

        // Encontrar grupos con más de un documento
        activeDocuments.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .forEach(entry -> {
                    String key = entry.getKey();
                    List<Document> docs = entry.getValue();
                    duplicates.add(String.format("User-Type: %s, Documents: %s", 
                            key, docs.stream()
                                    .map(d -> d.getId().value().toString())
                                    .collect(Collectors.joining(", "))));
                });

        return duplicates;
    }

    /**
     * Registra el reporte de consistencia en los logs
     */
    private void logConsistencyReport(ConsistencyReport report) {
        log.info("📋 [DocumentConsistency] === REPORTE DE CONSISTENCIA ===");
        log.info("🕐 Fecha: {}", report.getCheckTime());
        log.info("📊 Total documentos: {}", report.getTotalDocuments());
        log.info("✅ Documentos activos: {}", report.getActiveDocuments());
        log.info("📦 Documentos archivados: {}", report.getArchivedDocuments());
        log.info("❌ Archivos faltantes: {}", report.getMissingFiles().size());
        log.info("🗑️ Archivos huérfanos: {}", report.getOrphanFiles().size());
        log.info("⚠️ Rutas inválidas: {}", report.getInvalidPaths().size());
        log.info("🔄 Duplicados en BD: {}", report.getDuplicateEntries().size());
        log.info("🎯 Estado: {}", report.isConsistent() ? "CONSISTENTE" : "INCONSISTENTE");
        
        if (!report.isConsistent()) {
            log.warn("⚠️ [DocumentConsistency] Detalles de inconsistencias:");
            report.getMissingFiles().forEach(file -> 
                log.warn("  📄 Archivo faltante: {}", file));
            report.getInvalidPaths().forEach(path -> 
                log.warn("  ⚠️ Ruta inválida: {}", path));
            report.getDuplicateEntries().forEach(dup -> 
                log.warn("  🔄 Duplicado: {}", dup));
        }
    }

    /**
     * Reporte de consistencia del sistema
     */
    public static class ConsistencyReport {
        private final boolean consistent;
        private final LocalDateTime checkTime;
        private final int totalDocuments;
        private final int activeDocuments;
        private final int archivedDocuments;
        private final List<String> missingFiles;
        private final List<String> orphanFiles;
        private final List<String> invalidPaths;
        private final List<String> duplicateEntries;
        private final String errorMessage;

        private ConsistencyReport(Builder builder) {
            this.consistent = builder.consistent;
            this.checkTime = builder.checkTime;
            this.totalDocuments = builder.totalDocuments;
            this.activeDocuments = builder.activeDocuments;
            this.archivedDocuments = builder.archivedDocuments;
            this.missingFiles = builder.missingFiles != null ? builder.missingFiles : List.of();
            this.orphanFiles = builder.orphanFiles != null ? builder.orphanFiles : List.of();
            this.invalidPaths = builder.invalidPaths != null ? builder.invalidPaths : List.of();
            this.duplicateEntries = builder.duplicateEntries != null ? builder.duplicateEntries : List.of();
            this.errorMessage = builder.errorMessage;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public boolean isConsistent() { return consistent; }
        public LocalDateTime getCheckTime() { return checkTime; }
        public int getTotalDocuments() { return totalDocuments; }
        public int getActiveDocuments() { return activeDocuments; }
        public int getArchivedDocuments() { return archivedDocuments; }
        public List<String> getMissingFiles() { return missingFiles; }
        public List<String> getOrphanFiles() { return orphanFiles; }
        public List<String> getInvalidPaths() { return invalidPaths; }
        public List<String> getDuplicateEntries() { return duplicateEntries; }
        public String getErrorMessage() { return errorMessage; }

        public static class Builder {
            private boolean consistent = false;
            private LocalDateTime checkTime;
            private int totalDocuments = 0;
            private int activeDocuments = 0;
            private int archivedDocuments = 0;
            private List<String> missingFiles;
            private List<String> orphanFiles;
            private List<String> invalidPaths;
            private List<String> duplicateEntries;
            private String errorMessage;

            public Builder consistent(boolean consistent) {
                this.consistent = consistent;
                return this;
            }

            public Builder checkTime(LocalDateTime checkTime) {
                this.checkTime = checkTime;
                return this;
            }

            public Builder totalDocuments(int totalDocuments) {
                this.totalDocuments = totalDocuments;
                return this;
            }

            public Builder activeDocuments(int activeDocuments) {
                this.activeDocuments = activeDocuments;
                return this;
            }

            public Builder archivedDocuments(int archivedDocuments) {
                this.archivedDocuments = archivedDocuments;
                return this;
            }

            public Builder missingFiles(List<String> missingFiles) {
                this.missingFiles = missingFiles;
                return this;
            }

            public Builder orphanFiles(List<String> orphanFiles) {
                this.orphanFiles = orphanFiles;
                return this;
            }

            public Builder invalidPaths(List<String> invalidPaths) {
                this.invalidPaths = invalidPaths;
                return this;
            }

            public Builder duplicateEntries(List<String> duplicateEntries) {
                this.duplicateEntries = duplicateEntries;
                return this;
            }

            public Builder errorMessage(String errorMessage) {
                this.errorMessage = errorMessage;
                return this;
            }

            public ConsistencyReport build() {
                return new ConsistencyReport(this);
            }
        }
    }
}
