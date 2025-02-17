package ar.gov.mpd.concursobackend.auth.domain.model;

import lombok.Data;
import java.time.LocalDate;

@Data
public class Educacion {
    private String institucion;
    private String titulo;
    private String descripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}