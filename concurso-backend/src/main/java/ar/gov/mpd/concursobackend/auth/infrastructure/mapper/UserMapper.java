package ar.gov.mpd.concursobackend.auth.infrastructure.mapper;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.*;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.ProfileImageUrl;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Set;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    private static final Logger logger = LoggerFactory.getLogger(UserMapper.class);

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

        // Asegurar que el CUIT nunca sea nulo en la entidad
        if (user.getCuit() != null) {
            entity.setCuit(user.getCuit().value());
        } else {
            // Si el CUIT es nulo, lo dejamos nulo
            logger.warn("El usuario {} no tiene CUIT asignado", user.getUsername().value());
            entity.setCuit(null);
        }

        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());

        // Mapear los nuevos campos
        if (user.getBirthDate() != null) {
            entity.setBirthDate(user.getBirthDate().getValue());
        }
        if (user.getCountry() != null) {
            entity.setCountry(user.getCountry().getValue());
        }
        if (user.getProvince() != null) {
            entity.setProvince(user.getProvince().getValue());
        }
        if (user.getMunicipality() != null) {
            entity.setMunicipality(user.getMunicipality().getValue());
        }
        if (user.getLegalAddress() != null) {
            entity.setLegalAddress(user.getLegalAddress().getValue());
        }
        if (user.getResidentialAddress() != null) {
            entity.setResidentialAddress(user.getResidentialAddress().getValue());
        }

        entity.setTelefono(user.getTelefono());
        entity.setDireccion(user.getDireccion());

        // Mapear la URL de imagen de perfil
        if (user.getProfileImageUrl() != null) {
            entity.setProfileImageUrl(user.getProfileImageUrl().getUrlOrNull());
        } else {
            entity.setProfileImageUrl(null);
        }

        // Mapear el estado del usuario
        if (user.getStatus() != null) {
            entity.setStatus(user.getStatus());
        } else {
            // Si el estado es nulo, establecer como ACTIVE por defecto
            entity.setStatus(ar.gov.mpd.concursobackend.auth.domain.model.UserStatus.ACTIVE);
        }

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            logger.info("Mapeando {} roles para el usuario {}", user.getRoles().size(), user.getUsername().value());

            try {
                Set<RoleEntity> roleEntities = user.getRoles().stream()
                        .map(rol -> {
                            logger.debug("Buscando rol {} en la base de datos", rol.getRole());
                            return roleSpringRepository.findByName(rol.getRole())
                                    .orElseThrow(() -> {
                                        logger.error("Rol {} no encontrado en la base de datos", rol.getRole());
                                        return new RuntimeException("Error: Rol no encontrado: " + rol.getRole());
                                    });
                        })
                        .collect(Collectors.toSet());

                logger.info("Se encontraron {} roles en la base de datos para asignar al usuario {}",
                        roleEntities.size(), user.getUsername().value());

                entity.setRoles(roleEntities);
            } catch (Exception e) {
                logger.error("Error al mapear roles para el usuario {}: {}",
                        user.getUsername().value(), e.getMessage(), e);
                throw e;
            }
        } else {
            logger.warn("El usuario {} no tiene roles asignados", user.getUsername().value());
            entity.setRoles(Set.of());
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
            try {
                user.setCuit(new UserCuit(entity.getCuit()));
            } catch (Exception e) {
                logger.warn("Error al validar CUIT {}: {}. El CUIT se mantendrá como nulo.",
                        entity.getCuit(), e.getMessage());
                // No asignamos un CUIT por defecto, lo dejamos nulo
            }
        } else {
            logger.info("El usuario {} no tiene CUIT asignado.", entity.getUsername());
        }

        user.setFirstName(entity.getFirstName());
        user.setLastName(entity.getLastName());

        // Mapear los nuevos campos
        if (entity.getBirthDate() != null) {
            user.setBirthDate(new UserBirthDate(entity.getBirthDate()));
        }
        if (entity.getCountry() != null) {
            user.setCountry(new UserCountry(entity.getCountry()));
        }
        if (entity.getProvince() != null) {
            user.setProvince(new UserProvince(entity.getProvince()));
        }
        if (entity.getMunicipality() != null) {
            user.setMunicipality(new UserMunicipality(entity.getMunicipality()));
        }
        if (entity.getLegalAddress() != null) {
            user.setLegalAddress(new UserLegalAddress(entity.getLegalAddress()));
        }
        if (entity.getResidentialAddress() != null) {
            user.setResidentialAddress(new UserResidentialAddress(entity.getResidentialAddress()));
        }

        user.setTelefono(entity.getTelefono());
        user.setDireccion(entity.getDireccion());

        // Mapear la URL de imagen de perfil
        if (entity.getProfileImageUrl() != null && !entity.getProfileImageUrl().trim().isEmpty()) {
            user.setProfileImageUrl(ProfileImageUrl.of(entity.getProfileImageUrl()));
        } else {
            user.setProfileImageUrl(ProfileImageUrl.empty());
        }

        // Ya no recuperamos experiencias de la tabla antigua
        // Ahora se obtienen desde el servicio de experiencias
        user.setExperiencias(new ArrayList<>());

        if (entity.getRoles() != null) {
            Set<Rol> roles = entity.getRoles().stream()
                    .map(roleEntity -> {
                        Rol rol = new Rol();
                        rol.setId(roleEntity.getId());
                        rol.setRole(roleEntity.getName());
                        return rol;
                    })
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        // Mapear el estado del usuario
        if (entity.getStatus() != null) {
            user.setStatus(entity.getStatus());
        } else {
            // Si el estado es nulo, establecer como ACTIVE por defecto
            user.setStatus(ar.gov.mpd.concursobackend.auth.domain.model.UserStatus.ACTIVE);
        }

        return user;
    }
}