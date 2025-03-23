package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "experiencia")
public class ExperienciaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String empresa;

    @Column(nullable = false)
    private String cargo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column
    private String descripcion;

    @Column
    private String comentario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
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