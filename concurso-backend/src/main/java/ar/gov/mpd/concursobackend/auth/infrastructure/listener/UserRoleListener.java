package ar.gov.mpd.concursobackend.auth.infrastructure.listener;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.HashSet;

/**
 * Listener de entidades JPA que asegura que cada usuario tenga al menos el rol
 * ROLE_USER
 * antes de ser guardado o actualizado en la base de datos.
 */
@Component
public class UserRoleListener {

    private static final Logger logger = LoggerFactory.getLogger(UserRoleListener.class);

    private static IRoleSpringRepository roleRepository;

    @Autowired
    @Lazy
    public void setRoleRepository(IRoleSpringRepository roleRepository) {
        UserRoleListener.roleRepository = roleRepository;
    }

    @PrePersist
    @PreUpdate
    public void prePersist(UserEntity user) {
        if (roleRepository == null) {
            logger.warn("No se puede asignar rol automáticamente: roleRepository es null");
            return;
        }

        // Si el usuario no tiene roles o tiene un conjunto vacío, asignamos ROLE_USER
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }

        if (user.getRoles().isEmpty()) {
            logger.info("El usuario {} no tiene roles asignados. Asignando ROLE_USER automáticamente.",
                    user.getUsername());

            roleRepository.findByRole(RoleEnum.ROLE_USER).ifPresentOrElse(
                    roleEntity -> {
                        user.getRoles().add(roleEntity);
                        logger.info("Rol ROLE_USER asignado automáticamente al usuario {}", user.getUsername());
                    },
                    () -> logger.error("No se pudo encontrar el rol ROLE_USER en la base de datos"));
        } else {
            logger.debug("El usuario {} ya tiene {} roles asignados", user.getUsername(), user.getRoles().size());
        }
    }
}