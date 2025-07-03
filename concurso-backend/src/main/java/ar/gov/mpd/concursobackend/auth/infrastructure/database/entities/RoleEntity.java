package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Entidad JPA para roles del sistema.
 *
 * CAMBIOS APLICADOS PARA RESOLVER PROBLEMAS DE PRODUCCIÓN:
 * - @Table(name = "roles"): Especifica nombre exacto de tabla en schema.sql
 * - @Column(columnDefinition = "BINARY(16)"): Compatibilidad UUID con MySQL
 *
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-06
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
public class RoleEntity {

    /**
     * ID único del rol.
     * Configurado como BINARY(16) para compatibilidad con schema.sql de MySQL.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "name")
    private RoleEnum name;

    public RoleEntity() {
    }

    public RoleEntity(RoleEnum name) {
        this.name = name;
    }

}
