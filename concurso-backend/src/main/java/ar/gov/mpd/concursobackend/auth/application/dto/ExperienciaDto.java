package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienciaDto {
    private String empresa;
    private String cargo;
    private String fechaInicio;
    private String fechaFin;
    private String descripcion;
}