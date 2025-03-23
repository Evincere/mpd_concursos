package ar.gov.mpd.concursobackend.auth.domain.model;

import lombok.Data;
import java.time.LocalDate;

@Data
public class Experiencia {
    private String empresa;
    private String cargo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String descripcion;
    private String comentario;
}