package ar.gov.mpd.concursobackend.dashboard.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO para representar las estadísticas específicas del usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {
    
    // Estadísticas de perfil
    private ProfileStats profileStats;
    
    // Estadísticas de inscripciones
    private InscriptionStats inscriptionStats;
    
    // Estadísticas de documentos
    private DocumentStats documentStats;
    
    // Estadísticas de exámenes
    private ExamStats examStats;
    
    // Métricas de actividad
    private ActivityStats activityStats;
    
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
        private String lastUpdated;
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
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityStats {
        private Integer totalLogins;
        private String lastLogin;
        private Integer documentsUploaded;
        private Integer profileUpdates;
        private Integer contestsViewed;
        private String accountCreated;
        private Integer daysActive;
    }
}
