package ar.gov.mpd.concursobackend.education.application.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for education record requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EducationRequestDto {
    
    @NotBlank(message = "El tipo de educación es obligatorio")
    @Pattern(regexp = "^(Título Terciario|Título Universitario|Especialización|Maestría|Doctorado|Diplomatura|Curso de Capacitación|Actividad Científica)$", 
             message = "Tipo de educación inválido")
    private String type;
    
    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "^(En Curso|Completado|Abandonado)$", 
             message = "Estado inválido")
    private String status;
    
    @NotBlank(message = "El título es obligatorio")
    private String title;
    
    @NotBlank(message = "La institución es obligatoria")
    private String institution;
    
    @Past(message = "La fecha de emisión debe ser en el pasado")
    private LocalDate issueDate;
    
    // Fields for higher education and undergraduate degrees
    @Positive(message = "La duración debe ser un número positivo")
    private Integer durationYears;
    
    @PositiveOrZero(message = "El promedio debe ser un número positivo o cero")
    private Double average;
    
    // Fields for postgraduate studies
    private String thesisTopic;
    
    // Fields for diplomas and training courses
    @Positive(message = "La carga horaria debe ser un número positivo")
    private Integer hourlyLoad;
    
    private Boolean hadFinalEvaluation;
    
    // Fields for scientific activities
    @Pattern(regexp = "^(Investigación|Publicación|Conferencia|Taller|Seminario|Otro)$", 
             message = "Tipo de actividad científica inválido")
    private String activityType;
    
    private String topic;
    
    @Pattern(regexp = "^(Autor|Co-autor|Expositor|Organizador|Coordinador|Participante)$", 
             message = "Rol en la actividad científica inválido")
    private String activityRole;
    
    private String expositionPlaceDate;
    
    private String comments;
} 