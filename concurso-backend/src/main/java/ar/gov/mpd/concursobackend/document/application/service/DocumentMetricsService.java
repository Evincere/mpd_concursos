package ar.gov.mpd.concursobackend.document.application.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentAuditSpringRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentAuditEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio para métricas y monitoreo del sistema de documentación
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentMetricsService {

    private final IDocumentRepository documentRepository;
    private final IDocumentAuditSpringRepository auditRepository;

    // Contadores en memoria para métricas en tiempo real
    private final AtomicLong uploadsToday = new AtomicLong(0);
    private final AtomicLong deletionsToday = new AtomicLong(0);

    /**
     * Resetea contadores diarios a medianoche
     */
    @Scheduled(cron = "0 0 0 * * *") // Todos los días a medianoche
    public void resetDailyCounters() {
        log.info("📊 [DocumentMetrics] Reseteando contadores diarios");
        uploadsToday.set(0);
        deletionsToday.set(0);
    }

    /**
     * Registra un upload de documento
     */
    public void recordUpload() {
        uploadsToday.incrementAndGet();
        log.debug("📈 [DocumentMetrics] Upload registrado. Total hoy: {}", uploadsToday.get());
    }

    /**
     * Registra una eliminación de documento
     */
    public void recordDeletion() {
        deletionsToday.incrementAndGet();
        log.debug("📈 [DocumentMetrics] Eliminación registrada. Total hoy: {}", deletionsToday.get());
    }

    /**
     * Obtiene métricas generales del sistema (con cache de 5 minutos)
     */
    @Cacheable(value = "documentMetrics", key = "'general'")
    public DocumentMetrics getGeneralMetrics() {
        log.debug("📊 [DocumentMetrics] Calculando métricas generales");

        List<Document> allDocuments = documentRepository.findAll();
        
        long totalDocuments = allDocuments.size();
        long activeDocuments = allDocuments.stream()
                .filter(doc -> !doc.isArchived())
                .count();
        long archivedDocuments = allDocuments.stream()
                .filter(Document::isArchived)
                .count();

        // Métricas por estado
        Map<String, Long> statusMetrics = new HashMap<>();
        allDocuments.stream()
                .filter(doc -> !doc.isArchived())
                .forEach(doc -> {
                    String status = doc.getStatus() != null ? doc.getStatus().toString() : "UNKNOWN";
                    statusMetrics.merge(status, 1L, Long::sum);
                });

        // Métricas de auditoría (últimas 24 horas)
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        List<DocumentAuditEntity> recentAudits = auditRepository.findRecentAudits(yesterday);
        
        Map<String, Long> auditMetrics = new HashMap<>();
        recentAudits.forEach(audit -> {
            String actionType = audit.getActionType().toString();
            auditMetrics.merge(actionType, 1L, Long::sum);
        });

        return DocumentMetrics.builder()
                .totalDocuments(totalDocuments)
                .activeDocuments(activeDocuments)
                .archivedDocuments(archivedDocuments)
                .statusMetrics(statusMetrics)
                .auditMetrics(auditMetrics)
                .uploadsToday(uploadsToday.get())
                .deletionsToday(deletionsToday.get())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    /**
     * Obtiene métricas de rendimiento del sistema
     */
    public PerformanceMetrics getPerformanceMetrics() {
        log.debug("📊 [DocumentMetrics] Calculando métricas de rendimiento");

        // Métricas básicas de rendimiento
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        return PerformanceMetrics.builder()
                .totalMemoryMB(totalMemory / (1024 * 1024))
                .usedMemoryMB(usedMemory / (1024 * 1024))
                .freeMemoryMB(freeMemory / (1024 * 1024))
                .memoryUsagePercent((double) usedMemory / totalMemory * 100)
                .uploadsToday(uploadsToday.get())
                .deletionsToday(deletionsToday.get())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    /**
     * Registra métricas en logs cada hora
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // Cada hora
    public void logHourlyMetrics() {
        try {
            DocumentMetrics metrics = getGeneralMetrics();
            PerformanceMetrics performance = getPerformanceMetrics();

            log.info("📊 [DocumentMetrics] === MÉTRICAS HORARIAS ===");
            log.info("📄 Total documentos: {}", metrics.getTotalDocuments());
            log.info("✅ Documentos activos: {}", metrics.getActiveDocuments());
            log.info("📦 Documentos archivados: {}", metrics.getArchivedDocuments());
            log.info("📈 Uploads hoy: {}", metrics.getUploadsToday());
            log.info("🗑️ Eliminaciones hoy: {}", metrics.getDeletionsToday());
            log.info("💾 Memoria usada: {}MB ({}%)", 
                    performance.getUsedMemoryMB(), 
                    String.format("%.1f", performance.getMemoryUsagePercent()));

        } catch (Exception e) {
            log.error("❌ [DocumentMetrics] Error registrando métricas horarias", e);
        }
    }

    /**
     * Métricas generales del sistema
     */
    public static class DocumentMetrics {
        private final long totalDocuments;
        private final long activeDocuments;
        private final long archivedDocuments;
        private final Map<String, Long> statusMetrics;
        private final Map<String, Long> auditMetrics;
        private final long uploadsToday;
        private final long deletionsToday;
        private final LocalDateTime lastUpdated;

        private DocumentMetrics(Builder builder) {
            this.totalDocuments = builder.totalDocuments;
            this.activeDocuments = builder.activeDocuments;
            this.archivedDocuments = builder.archivedDocuments;
            this.statusMetrics = builder.statusMetrics;
            this.auditMetrics = builder.auditMetrics;
            this.uploadsToday = builder.uploadsToday;
            this.deletionsToday = builder.deletionsToday;
            this.lastUpdated = builder.lastUpdated;
        }

        public static Builder builder() { return new Builder(); }

        // Getters
        public long getTotalDocuments() { return totalDocuments; }
        public long getActiveDocuments() { return activeDocuments; }
        public long getArchivedDocuments() { return archivedDocuments; }
        public Map<String, Long> getStatusMetrics() { return statusMetrics; }
        public Map<String, Long> getAuditMetrics() { return auditMetrics; }
        public long getUploadsToday() { return uploadsToday; }
        public long getDeletionsToday() { return deletionsToday; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }

        public static class Builder {
            private long totalDocuments;
            private long activeDocuments;
            private long archivedDocuments;
            private Map<String, Long> statusMetrics = new HashMap<>();
            private Map<String, Long> auditMetrics = new HashMap<>();
            private long uploadsToday;
            private long deletionsToday;
            private LocalDateTime lastUpdated;

            public Builder totalDocuments(long totalDocuments) {
                this.totalDocuments = totalDocuments;
                return this;
            }

            public Builder activeDocuments(long activeDocuments) {
                this.activeDocuments = activeDocuments;
                return this;
            }

            public Builder archivedDocuments(long archivedDocuments) {
                this.archivedDocuments = archivedDocuments;
                return this;
            }

            public Builder statusMetrics(Map<String, Long> statusMetrics) {
                this.statusMetrics = statusMetrics;
                return this;
            }

            public Builder auditMetrics(Map<String, Long> auditMetrics) {
                this.auditMetrics = auditMetrics;
                return this;
            }

            public Builder uploadsToday(long uploadsToday) {
                this.uploadsToday = uploadsToday;
                return this;
            }

            public Builder deletionsToday(long deletionsToday) {
                this.deletionsToday = deletionsToday;
                return this;
            }

            public Builder lastUpdated(LocalDateTime lastUpdated) {
                this.lastUpdated = lastUpdated;
                return this;
            }

            public DocumentMetrics build() {
                return new DocumentMetrics(this);
            }
        }
    }

    /**
     * Métricas de rendimiento
     */
    public static class PerformanceMetrics {
        private final long totalMemoryMB;
        private final long usedMemoryMB;
        private final long freeMemoryMB;
        private final double memoryUsagePercent;
        private final long uploadsToday;
        private final long deletionsToday;
        private final LocalDateTime lastUpdated;

        private PerformanceMetrics(Builder builder) {
            this.totalMemoryMB = builder.totalMemoryMB;
            this.usedMemoryMB = builder.usedMemoryMB;
            this.freeMemoryMB = builder.freeMemoryMB;
            this.memoryUsagePercent = builder.memoryUsagePercent;
            this.uploadsToday = builder.uploadsToday;
            this.deletionsToday = builder.deletionsToday;
            this.lastUpdated = builder.lastUpdated;
        }

        public static Builder builder() { return new Builder(); }

        // Getters
        public long getTotalMemoryMB() { return totalMemoryMB; }
        public long getUsedMemoryMB() { return usedMemoryMB; }
        public long getFreeMemoryMB() { return freeMemoryMB; }
        public double getMemoryUsagePercent() { return memoryUsagePercent; }
        public long getUploadsToday() { return uploadsToday; }
        public long getDeletionsToday() { return deletionsToday; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }

        public static class Builder {
            private long totalMemoryMB;
            private long usedMemoryMB;
            private long freeMemoryMB;
            private double memoryUsagePercent;
            private long uploadsToday;
            private long deletionsToday;
            private LocalDateTime lastUpdated;

            public Builder totalMemoryMB(long totalMemoryMB) {
                this.totalMemoryMB = totalMemoryMB;
                return this;
            }

            public Builder usedMemoryMB(long usedMemoryMB) {
                this.usedMemoryMB = usedMemoryMB;
                return this;
            }

            public Builder freeMemoryMB(long freeMemoryMB) {
                this.freeMemoryMB = freeMemoryMB;
                return this;
            }

            public Builder memoryUsagePercent(double memoryUsagePercent) {
                this.memoryUsagePercent = memoryUsagePercent;
                return this;
            }

            public Builder uploadsToday(long uploadsToday) {
                this.uploadsToday = uploadsToday;
                return this;
            }

            public Builder deletionsToday(long deletionsToday) {
                this.deletionsToday = deletionsToday;
                return this;
            }

            public Builder lastUpdated(LocalDateTime lastUpdated) {
                this.lastUpdated = lastUpdated;
                return this;
            }

            public PerformanceMetrics build() {
                return new PerformanceMetrics(this);
            }
        }
    }
}
