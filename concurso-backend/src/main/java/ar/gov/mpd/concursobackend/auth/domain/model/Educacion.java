package ar.gov.mpd.concursobackend.auth.domain.model;

import lombok.Data;

import java.time.LocalDate;

/**
 * @deprecated Este modelo es legacy del sistema auth.
 * Usar ar.gov.mpd.concursobackend.education.domain.model.Education
 * para nuevas implementaciones.
 *
 * PENDIENTE DE MIGRACIÓN: Este modelo será eliminado en futuras versiones.
 * Fecha de deprecación: 2025-06-29
 */
@Deprecated(since = "2025-06-29", forRemoval = true)
@Data
public class Educacion {
    private String institucion;
    private String titulo;
    private String descripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}