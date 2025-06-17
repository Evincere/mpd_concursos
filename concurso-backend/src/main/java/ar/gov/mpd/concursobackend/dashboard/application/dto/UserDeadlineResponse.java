package ar.gov.mpd.concursobackend.dashboard.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para representar un vencimiento específico del usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeadlineResponse {
    
    private String id;
    private String type; // INSCRIPTION, DOCUMENTS, EXAM, RESULT
    private String title;
    private String description;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline;
    
    private Integer daysRemaining;
    private String priority; // HIGH, MEDIUM, LOW
    private String contestId;
    private String actionRequired;
    private String route;
    private Boolean isUrgent;
    private String status; // ACTIVE, EXPIRED, COMPLETED
    
    // Información adicional del concurso
    private String contestTitle;
    private String contestDepartment;
    
    // Información específica según el tipo
    private String documentType; // Para vencimientos de documentos
    private String examType; // Para vencimientos de exámenes
    private Integer hoursRemaining; // Para mayor precisión en vencimientos críticos
}
