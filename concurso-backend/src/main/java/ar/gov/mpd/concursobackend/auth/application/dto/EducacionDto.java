package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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