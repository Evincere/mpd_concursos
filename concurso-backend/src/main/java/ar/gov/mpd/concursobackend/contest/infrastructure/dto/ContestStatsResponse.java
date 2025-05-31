package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Estadísticas de concursos")
public class ContestStatsResponse {

    @Schema(description = "Total de concursos", example = "150")
    private Long total;

    @Schema(description = "Concursos activos", example = "25")
    private Long active;

    @Schema(description = "Concursos en borrador", example = "10")
    private Long draft;

    @Schema(description = "Concursos cerrados", example = "100")
    private Long closed;

    @Schema(description = "Concursos en proceso", example = "15")
    private Long inProgress;

    @Schema(description = "Concursos cancelados", example = "5")
    private Long cancelled;

    @Schema(description = "Distribución por departamento")
    private Map<String, Long> byDepartment;

    @Schema(description = "Distribución por categoría")
    private Map<String, Long> byCategory;

    @Schema(description = "Distribución por estado")
    private Map<String, Long> byStatus;

    @Schema(description = "Concursos creados este mes", example = "8")
    private Long createdThisMonth;

    @Schema(description = "Concursos que finalizan este mes", example = "12")
    private Long endingThisMonth;

    @Schema(description = "Promedio de inscripciones por concurso", example = "45.5")
    private Double averageInscriptions;
}
