package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Esta clase se ha dejado de utilizar en favor de ExperienceEntity.
 * Se mantiene por compatibilidad pero ya no se mapea a ninguna tabla.
 * 
 * @deprecated usar ExperienceEntity en su lugar
 */
@Getter
@Setter
// Eliminamos el mapeo a la tabla
public class ExperienciaEntity {
    private Long id;
    private String empresa;
    private String cargo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String descripcion;
    private String comentario;
    private UserEntity user;

    public ExperienciaEntity() {
        // Constructor por defecto requerido por JPA
    }

    public ExperienciaEntity(String empresa, String cargo, LocalDate fechaInicio,
            LocalDate fechaFin, String descripcion, String comentario) {
        this.empresa = empresa;
        this.cargo = cargo;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.descripcion = descripcion;
        this.comentario = comentario;
    }
}