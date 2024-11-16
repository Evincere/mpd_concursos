package ar.gov.mpd.concursobackend.auth.infrastructure.mapper;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.*;

import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserEntity toEntity(User user) {
        if (user == null) {
            return null;
        }

        UserEntity entity = new UserEntity();
        entity.setId(user.getId().value());
        entity.setUsername(user.getUsername().value());
        entity.setEmail(user.getEmail().value());
        entity.setPassword(user.getPassword().getValue());
        entity.setCreatedAt(user.getCreatedAt().value());

        if (user.getRoles() != null) {
            entity.setRoles(user.getRoles().stream()
                    .map(rol -> {
                        RoleEntity roleEntity = new RoleEntity();
                        roleEntity.setId(rol.getId());
                        roleEntity.setRole(rol.getRole());
                        return roleEntity;
                    })
                    .collect(Collectors.toSet()));
        }

        return entity;
    }

    public User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        User user = new User();

        // Convertir los valores primitivos a objetos de valor
        if (entity.getUsername() != null) {
            user.setUsername(new UserUsername(entity.getUsername()));
        }
        if (entity.getPassword() != null) {
            user.setPassword(new UserPassword(entity.getPassword()));
        }
        if (entity.getEmail() != null) {
            user.setEmail(new UserEmail(entity.getEmail()));
        }
        if (entity.getId() != null) {
            user.setId(new UserId(entity.getId()));
        }
        if (entity.getCreatedAt() != null) {
            user.setCreatedAt(new UserCreatedAt(entity.getCreatedAt()));
        }

        // Convertir los roles
        Set<Rol> roles = entity.getRoles().stream().map(roleEntity -> {
            Rol rol = new Rol();
            rol.setRole(roleEntity.getRole());
            return rol;
        }).collect(Collectors.toSet());

        user.setRoles(roles);

        return user;
    }
}