package ar.gov.mpd.concursobackend.auth.infrastructure.database.entities;

import java.util.UUID;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity(name = "ROLE_ENTITY")
@Getter
@Setter
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @NotNull
    @Enumerated(EnumType.STRING)
    private RoleEnum role;

    
    public RoleEntity() {
    }

    public RoleEntity(RoleEnum role) {
        this.role = role;
    }
    
}
