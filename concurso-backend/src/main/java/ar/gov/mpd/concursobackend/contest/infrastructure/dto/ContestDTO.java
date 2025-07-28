package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO para la respuesta de concursos con mapeo correcto de campos
 * Este DTO asegura que los campos position y contestClass se mapeen correctamente
 * para el frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDTO {
    private Long id;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String district;
    private String type;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate inscriptionStartDate;
    private LocalDate inscriptionEndDate;
    private LocalDate examDate;
    private LocalDate resultsDate;
    private String basesUrl;
    private String descriptionUrl;
    private String category;
    private String dependency;
    private String department;
    
    // Campos específicos para el frontend
    private String position;        // Cargo del concurso
    private String class_;          // Clase del concurso (ej: "03")
    private String functions;       // Funciones del cargo
    
    // Campos de estado
    private Boolean active;
    private Boolean cancelled;
    private Boolean finished;
    private String currentStatus;
    private Boolean inscriptionOpen;
    
    // Campos de auditoría
    private String createdBy;
    private String updatedBy;
    
    // Listas relacionadas
    private List<Object> documents;
    private List<Object> positions;
    private List<Object> dates;
}
