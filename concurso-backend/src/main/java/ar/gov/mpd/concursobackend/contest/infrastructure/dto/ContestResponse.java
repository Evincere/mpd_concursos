package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response con información de un concurso")
public class ContestResponse {

    @Schema(description = "ID único del concurso", example = "1")
    private Long id;

    @Schema(description = "Título del concurso", example = "Concurso para Desarrollador Senior")
    private String title;

    @Schema(description = "Descripción detallada del concurso")
    private String description;

    @Schema(description = "Cargo a concursar", example = "Desarrollador Senior")
    private String position;

    @Schema(description = "Categoría del cargo", example = "PROFESIONAL")
    private String category;

    @Schema(description = "Clase del cargo", example = "A")
    private String contestClass;

    @Schema(description = "Descripción de las funciones del cargo")
    private String functions;

    @Schema(description = "Departamento", example = "INFORMATICA")
    private String department;

    @Schema(description = "Dependencia específica", example = "Dirección de Sistemas")
    private String dependencia;

    @Schema(description = "Estado del concurso", example = "ACTIVE")
    private String status;

    @Schema(description = "Fecha de inicio del concurso")
    private LocalDate startDate;

    @Schema(description = "Fecha de fin del concurso")
    private LocalDate endDate;

    @Schema(description = "URL de términos y condiciones")
    private String termsUrl;

    @Schema(description = "URL del perfil del cargo")
    private String profileUrl;

    @Schema(description = "Fecha de creación del concurso")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha de última actualización del concurso")
    private LocalDateTime updatedAt;

    @Schema(description = "Usuario que creó el concurso")
    private String createdBy;

    @Schema(description = "Usuario que actualizó el concurso por última vez")
    private String updatedBy;

    @Schema(description = "Número total de inscripciones")
    private Integer totalInscriptions;

    @Schema(description = "Indica si el concurso está activo")
    private Boolean isActive;

    @Schema(description = "Indica si el concurso permite inscripciones")
    private Boolean allowsInscriptions;
}
