package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;

import ar.gov.mpd.concursobackend.auth.infrastructure.listener.UserRoleListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@EntityListeners(UserRoleListener.class)
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @Column
    private String telefono;

    @Column
    private String direccion;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @NotNull
    private Set<RoleEntity> roles;
    @NotNull
    @Column(name = "created_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    public UserEntity() {
        this.roles = new HashSet<>();
        this.createdAt = LocalDateTime.now();
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
}
