package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import java.util.UUID;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

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
    private RoleEnum role;

    public RoleEntity() {
    }

    public RoleEntity(RoleEnum role) {
        this.role = role;
    }

}
