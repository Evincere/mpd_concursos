package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request para crear un nuevo concurso")
public class ContestCreateRequest {

    @NotBlank(message = "El título es requerido")
    @Size(max = 255, message = "El título no puede exceder 255 caracteres")
    @Schema(description = "Título del concurso", example = "Concurso para Desarrollador Senior")
    private String title;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    @Schema(description = "Descripción detallada del concurso")
    private String description;

    @NotBlank(message = "El cargo es requerido")
    @Size(max = 255, message = "El cargo no puede exceder 255 caracteres")
    @Schema(description = "Cargo a concursar", example = "Desarrollador Senior")
    private String position;

    @NotBlank(message = "La categoría es requerida")
    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    @Schema(description = "Categoría del cargo", example = "PROFESIONAL")
    private String category;

    @Size(max = 100, message = "La clase no puede exceder 100 caracteres")
    @Schema(description = "Clase del cargo", example = "A")
    private String contestClass;

    @Size(max = 1000, message = "Las funciones no pueden exceder 1000 caracteres")
    @Schema(description = "Descripción de las funciones del cargo")
    private String functions;

    @NotBlank(message = "El departamento es requerido")
    @Size(max = 255, message = "El departamento no puede exceder 255 caracteres")
    @Schema(description = "Departamento", example = "INFORMATICA")
    private String department;

    @NotBlank(message = "La dependencia es requerida")
    @Size(max = 255, message = "La dependencia no puede exceder 255 caracteres")
    @Schema(description = "Dependencia específica", example = "Dirección de Sistemas")
    private String dependencia;

    @NotBlank(message = "El estado es requerido")
    @Schema(description = "Estado del concurso", example = "DRAFT")
    private String status;

    @NotNull(message = "La fecha de inicio es requerida")
    @Schema(description = "Fecha de inicio del concurso")
    private LocalDate startDate;

    @NotNull(message = "La fecha de fin es requerida")
    @Schema(description = "Fecha de fin del concurso")
    private LocalDate endDate;

    @Size(max = 500, message = "La URL de términos no puede exceder 500 caracteres")
    @Schema(description = "URL de términos y condiciones")
    private String termsUrl;

    @Size(max = 500, message = "La URL del perfil no puede exceder 500 caracteres")
    @Schema(description = "URL del perfil del cargo")
    private String profileUrl;
}
