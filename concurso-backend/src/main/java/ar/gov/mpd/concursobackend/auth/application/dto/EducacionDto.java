package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @deprecated Este DTO es legacy del sistema auth.
 * Usar ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto
 * y EducationResponseDto para nuevas implementaciones.
 *
 * PENDIENTE DE MIGRACIÓN: Este DTO será eliminado en futuras versiones.
 * Fecha de deprecación: 2025-06-29
 */
@Deprecated(since = "2025-06-29", forRemoval = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducacionDto {
    private String institucion;
    private String titulo;
    private String descripcion;
    private String fechaInicio;
    private String fechaFin;
}