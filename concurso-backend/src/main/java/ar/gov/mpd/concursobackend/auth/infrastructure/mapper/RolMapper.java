package ar.gov.mpd.concursobackend.auth.infrastructure.mapper;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;

@Component
public class RolMapper {

    public Rol toDomain(RoleEntity entity) {
        Rol rol = new Rol(
            entity.getName()
        );
        rol.setId(entity.getId());
        rol.setRole(entity.getName());
        return rol;
    }

    public RoleEntity toEntity(Rol rol) {
        RoleEntity entity = new RoleEntity(rol.getRole());
        return entity;
    }
}
