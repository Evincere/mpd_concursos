package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDateCreateRequest {
    
    @NotBlank(message = "La etiqueta es obligatoria")
    private String label;
    
    @NotBlank(message = "El tipo es obligatorio")
    private String type;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;
    
    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate endDate;
}
