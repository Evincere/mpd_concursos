package ar.gov.mpd.concursobackend.dashboard.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entidad de dominio que representa las estadísticas del dashboard del usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDashboardStats {
    
    private Long userId;
    private ProfileStats profileStats;
    private InscriptionStats inscriptionStats;
    private DocumentStats documentStats;
    private ExamStats examStats;
    private ActivityStats activityStats;
    private LocalDateTime lastUpdated;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileStats {
        private Integer completionPercentage;
        private Integer totalFields;
        private Integer completedFields;
        private Integer pendingFields;
        private Boolean hasProfileImage;
        private Boolean hasBasicInfo;
        private Boolean hasContactInfo;
        private Boolean hasEducation;
        private Boolean hasExperience;
        private LocalDateTime lastUpdated;
        
        /**
         * Calcula el porcentaje de completitud del perfil
         */
        public Integer calculateCompletionPercentage() {
            if (totalFields == null || totalFields == 0) {
                return 0;
            }
            return Math.round((completedFields.floatValue() / totalFields.floatValue()) * 100);
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InscriptionStats {
        private Integer totalInscriptions;
        private Integer activeInscriptions;
        private Integer completedInscriptions;
        private Integer pendingInscriptions;
        private Integer cancelledInscriptions;
        private Integer frozenInscriptions;
        private Map<String, Integer> byStatus;
        private Map<String, Integer> byContest;
        
        /**
         * Calcula el porcentaje de inscripciones exitosas
         */
        public Double getSuccessRate() {
            if (totalInscriptions == null || totalInscriptions == 0) {
                return 0.0;
            }
            return (completedInscriptions.doubleValue() / totalInscriptions.doubleValue()) * 100;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentStats {
        private Integer totalDocuments;
        private Integer pendingDocuments;
        private Integer approvedDocuments;
        private Integer rejectedDocuments;
        private Integer expiredDocuments;
        private Map<String, Integer> byType;
        private Map<String, Integer> byStatus;
        
        /**
         * Calcula el porcentaje de documentos aprobados
         */
        public Double getApprovalRate() {
            if (totalDocuments == null || totalDocuments == 0) {
                return 0.0;
            }
            return (approvedDocuments.doubleValue() / totalDocuments.doubleValue()) * 100;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamStats {
        private Integer availableExams;
        private Integer completedExams;
        private Integer pendingExams;
        private Integer passedExams;
        private Integer failedExams;
        private Double averageScore;
        private Map<String, Integer> byStatus;
        
        /**
         * Calcula el porcentaje de exámenes aprobados
         */
        public Double getPassRate() {
            if (completedExams == null || completedExams == 0) {
                return 0.0;
            }
            return (passedExams.doubleValue() / completedExams.doubleValue()) * 100;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityStats {
        private Integer totalLogins;
        private LocalDateTime lastLogin;
        private Integer documentsUploaded;
        private Integer profileUpdates;
        private Integer contestsViewed;
        private LocalDateTime accountCreated;
        private Integer daysActive;
        
        /**
         * Calcula los días desde la última actividad
         */
        public Integer getDaysSinceLastLogin() {
            if (lastLogin == null) {
                return null;
            }
            return (int) java.time.temporal.ChronoUnit.DAYS.between(lastLogin, LocalDateTime.now());
        }
        
        /**
         * Calcula los días desde la creación de la cuenta
         */
        public Integer getDaysSinceAccountCreated() {
            if (accountCreated == null) {
                return null;
            }
            return (int) java.time.temporal.ChronoUnit.DAYS.between(accountCreated, LocalDateTime.now());
        }
    }
}
