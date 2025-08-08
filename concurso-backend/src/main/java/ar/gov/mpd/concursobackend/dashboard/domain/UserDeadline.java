package ar.gov.mpd.concursobackend.dashboard.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
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
     * ✅ CORREGIDO: Cálculo mejorado para manejar correctamente los días inclusive
     */
    public Integer getDaysRemaining() {
        if (deadline == null) {
            return null;
        }
        
        LocalDate now = LocalDate.now();
        LocalDate deadlineDate = deadline.toLocalDate();
        
        // Si ya pasó la fecha, es 0 días (vencido)
        if (now.isAfter(deadlineDate)) {
            return 0;
        }
        
        // Si es hoy, verificar la hora
        if (now.isEqual(deadlineDate)) {
            // Si aún no pasó la hora del deadline, cuenta como "hoy" (0 días)
            if (LocalDateTime.now().isBefore(deadline)) {
                return 0;
            } else {
                return 0; // Ya vencido hoy
            }
        }
        
        // Para fechas futuras, calcular días inclusive
        // Si hoy es 7/8 y deadline es 8/8, devuelve 1 día
        return (int) ChronoUnit.DAYS.between(now, deadlineDate);
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
     * ✅ CORREGIDO: Alineado con frontend (≤1 día = urgente)
     */
    public Boolean isUrgent() {
        Integer daysRemaining = getDaysRemaining();
        return daysRemaining != null && daysRemaining <= 1;
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
     * ✅ CORREGIDO: Alineado con lógica del frontend
     */
    public DeadlinePriority calculatePriority() {
        Integer daysRemaining = getDaysRemaining();
        if (daysRemaining == null) {
            return DeadlinePriority.LOW;
        }
        
        if (daysRemaining <= 1) {
            return DeadlinePriority.HIGH;    // ≤1 día = URGENTE (HIGH)
        } else if (daysRemaining <= 7) {
            return DeadlinePriority.MEDIUM;  // 2-7 días = ATENCIÓN (MEDIUM)
        } else {
            return DeadlinePriority.LOW;     // >7 días = NORMAL (LOW)
        }
    }
    
    /**
     * ✅ NUEVO: Obtiene texto descriptivo para los días restantes
     */
    public String getDaysRemainingText() {
        Integer days = getDaysRemaining();
        if (days == null) {
            return "Sin fecha";
        }
        
        if (days < 0) {
            return "Vencido";
        }
        
        if (days == 0) {
            // Verificar si vence hoy o ya venció
            if (LocalDateTime.now().isBefore(deadline)) {
                return "Vence hoy";
            } else {
                return "Vencido hoy";
            }
        }
        
        if (days == 1) {
            return "1 día";
        }
        
        return days + " días";
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
