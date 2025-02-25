package ar.gov.mpd.concursobackend.auth.infrastructure.mapper;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.*;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    @Autowired
    private IRoleSpringRepository roleSpringRepository;

    public UserEntity toEntity(User user) {
        if (user == null) {
            return null;
        }

        UserEntity entity = new UserEntity();

        if (user.getId() != null) {
            entity.setId(user.getId().value());
        }
        if (user.getUsername() != null) {
            entity.setUsername(user.getUsername().value());
        }
        if (user.getEmail() != null) {
            entity.setEmail(user.getEmail().value());
        }
        if (user.getPassword() != null) {
            entity.setPassword(user.getPassword().value());
        }
        if (user.getCreatedAt() != null) {
            entity.setCreatedAt(user.getCreatedAt().value());
        }
        if (user.getDni() != null) {
            entity.setDni(user.getDni().value());
        }
        if (user.getCuit() != null) {
            entity.setCuit(user.getCuit().value());
        }
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        if (user.getRoles() != null) {
            entity.setRoles(user.getRoles().stream()
                    .map(rol -> roleSpringRepository.findByRole(rol.getRole())
                            .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado: " + rol.getRole())))
                    .collect(Collectors.toSet()));
        }

        return entity;
    }

    public User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        User user = new User();

        if (entity.getId() != null) {
            user.setId(new UserId(entity.getId()));
        }
        if (entity.getUsername() != null) {
            user.setUsername(new UserUsername(entity.getUsername()));
        }
        if (entity.getPassword() != null) {
            user.setPassword(new UserPassword(entity.getPassword()));
        }
        if (entity.getEmail() != null) {
            user.setEmail(new UserEmail(entity.getEmail()));
        }
        if (entity.getCreatedAt() != null) {
            user.setCreatedAt(new UserCreatedAt(entity.getCreatedAt()));
        }
        if (entity.getDni() != null) {
            user.setDni(new UserDni(entity.getDni()));
        }
        if (entity.getCuit() != null) {
            user.setCuit(new UserCuit(entity.getCuit()));
        }
        user.setFirstName(entity.getFirstName());
        user.setLastName(entity.getLastName());
        if (entity.getRoles() != null) {
            Set<Rol> roles = entity.getRoles().stream()
                    .map(roleEntity -> {
                        Rol rol = new Rol();
                        rol.setId(roleEntity.getId());
                        rol.setRole(roleEntity.getRole());
                        return rol;
                    })
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        return user;
    }
}