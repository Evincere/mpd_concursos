package ar.gov.mpd.concursobackend.dashboard.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Entidad de dominio que representa un vencimiento del usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeadline {
    
    private String id;
    private Long userId;
    private DeadlineType type;
    private String title;
    private String description;
    private LocalDateTime deadline;
    private DeadlinePriority priority;
    private String contestId;
    private String actionRequired;
    private String route;
    private DeadlineStatus status;
    
    // Información adicional
    private String contestTitle;
    private String contestDepartment;
    private String documentType;
    private String examType;
    
    /**
     * Calcula los días restantes hasta el vencimiento
     */
    public Integer getDaysRemaining() {
        if (deadline == null) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(deadline)) {
            return 0; // Vencido
        }
        
        return (int) ChronoUnit.DAYS.between(now, deadline);
    }
    
    /**
     * Calcula las horas restantes hasta el vencimiento
     */
    public Integer getHoursRemaining() {
        if (deadline == null) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(deadline)) {
            return 0; // Vencido
        }
        
        return (int) ChronoUnit.HOURS.between(now, deadline);
    }
    
    /**
     * Determina si el vencimiento es urgente (menos de 3 días)
     */
    public Boolean isUrgent() {
        Integer daysRemaining = getDaysRemaining();
        return daysRemaining != null && daysRemaining <= 3;
    }
    
    /**
     * Determina si el vencimiento está vencido
     */
    public Boolean isExpired() {
        if (deadline == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(deadline);
    }
    
    /**
     * Calcula la prioridad automáticamente basada en días restantes
     */
    public DeadlinePriority calculatePriority() {
        Integer daysRemaining = getDaysRemaining();
        if (daysRemaining == null) {
            return DeadlinePriority.LOW;
        }
        
        if (daysRemaining <= 1) {
            return DeadlinePriority.HIGH;
        } else if (daysRemaining <= 7) {
            return DeadlinePriority.MEDIUM;
        } else {
            return DeadlinePriority.LOW;
        }
    }
    
    public enum DeadlineType {
        INSCRIPTION("INSCRIPTION"),
        DOCUMENTS("DOCUMENTS"),
        EXAM("EXAM"),
        RESULT("RESULT");
        
        private final String value;
        
        DeadlineType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    public enum DeadlinePriority {
        HIGH("HIGH"),
        MEDIUM("MEDIUM"),
        LOW("LOW");
        
        private final String value;
        
        DeadlinePriority(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    public enum DeadlineStatus {
        ACTIVE("ACTIVE"),
        EXPIRED("EXPIRED"),
        COMPLETED("COMPLETED");
        
        private final String value;
        
        DeadlineStatus(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
}
