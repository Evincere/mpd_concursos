package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestRequirementUpdateRequest {
    
    @NotNull(message = "El ID es obligatorio")
    private Long id;
    
    @NotBlank(message = "La descripción es obligatoria")
    private String description;
    
    @NotBlank(message = "La categoría es obligatoria")
    private String category;
    
    @NotNull(message = "El campo 'required' es obligatorio")
    private Boolean required;
    
    @NotNull(message = "La prioridad es obligatoria")
    @Min(value = 1, message = "La prioridad debe ser mayor a 0")
    @Max(value = 10, message = "La prioridad debe ser menor o igual a 10")
    private Integer priority;
    
    private String documentType;
}
