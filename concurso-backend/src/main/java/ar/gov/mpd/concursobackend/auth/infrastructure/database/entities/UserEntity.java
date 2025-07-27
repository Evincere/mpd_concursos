package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidad JPA para usuarios del sistema.
 *
 * CAMBIOS APLICADOS PARA RESOLVER PROBLEMAS DE PRODUCCIÓN:
 * - @Table(name = "user_entity"): Especifica nombre exacto de tabla en schema.sql
 * - @Column(columnDefinition = "BINARY(16)"): Compatibilidad UUID con MySQL
 *
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-06
 */
@Entity
@Table(name = "user_entity")
@Getter
@Setter
// @EntityListeners(UserRoleListener.class) // TEMPORALMENTE DESHABILITADO: Causa conflictos de concurrencia optimista
public class UserEntity {

    /**
     * ID único del usuario.
     * Configurado como BINARY(16) para compatibilidad con schema.sql de MySQL.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @NotNull
    @Column(unique = true)
    private String username;

    @NotNull
    private String password;

    @NotNull
    @Column(unique = true)
    private String email;

    @Column(unique = true)
    @NotNull
    private String dni;

    @Column(unique = true, nullable = true)
    private String cuit;

    @NotNull
    @Column(name = "first_name")
    private String firstName;

    @NotNull
    @Column(name = "last_name")
    private String lastName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "country")
    private String country;

    @Column(name = "province")
    private String province;

    @Column(name = "municipality")
    private String municipality;

    @Column(name = "legal_address")
    private String legalAddress;

    @Column(name = "residential_address")
    private String residentialAddress;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "direccion")
    private String direccion;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @NotNull
    private Set<RoleEntity> roles;

    @NotNull
    @Column(name = "created_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status;

    public UserEntity() {
        this.roles = new HashSet<>();
        this.createdAt = LocalDateTime.now();
        this.status = UserStatus.ACTIVE; // Por defecto, los usuarios son activos
    }

    public UserEntity(String username, String password, String email, String dni, String cuit, String firstName,
            String lastName) {
        this();
        this.username = username;
        this.password = password;
        this.email = email;
        this.dni = dni;
        this.cuit = cuit;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public UserEntity(String username, String password, String email, String dni, String cuit, String firstName,
            String lastName, LocalDate birthDate, String country, String province, String municipality,
            String legalAddress, String residentialAddress, String telefono, String direccion) {
        this(username, password, email, dni, cuit, firstName, lastName);
        this.birthDate = birthDate;
        this.country = country;
        this.province = province;
        this.municipality = municipality;
        this.legalAddress = legalAddress;
        this.residentialAddress = residentialAddress;
        this.telefono = telefono;
        this.direccion = direccion;
    }
}
