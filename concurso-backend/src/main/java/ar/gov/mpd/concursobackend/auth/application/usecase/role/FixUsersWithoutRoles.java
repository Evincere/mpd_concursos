package ar.gov.mpd.concursobackend.auth.application.usecase.role;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

/**
 * Caso de uso para detectar y reparar usuarios que no tienen roles asignados.
 */
@Component
public class FixUsersWithoutRoles {

    private static final Logger logger = LoggerFactory.getLogger(FixUsersWithoutRoles.class);

    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;

    public FixUsersWithoutRoles(IUserRepository userRepository, IRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Ejecuta el diagnóstico y reparación de usuarios sin roles.
     * 
     * @return Número de usuarios reparados
     */
    @Transactional
    public int run() {
        logger.info("Iniciando diagnóstico de roles de usuarios...");

        List<User> users = userRepository.findAll();
        logger.info("Verificando roles para {} usuarios", users.size());

        Optional<Rol> userRole = roleRepository.findByRole(RoleEnum.ROLE_USER);

        if (userRole.isEmpty()) {
            logger.error(
                    "No se encontró el rol ROLE_USER en la base de datos. No se pueden asignar roles automáticamente.");
            return 0;
        }

        int fixedCount = 0;

        for (User user : users) {
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                logger.warn("Usuario {} no tiene roles asignados. Asignando ROLE_USER...",
                        user.getUsername().value());

                if (user.getRoles() == null) {
                    user.setRoles(new HashSet<>());
                }

                user.getRoles().add(userRole.get());
                userRepository.create(user);

                logger.info("Rol ROLE_USER asignado al usuario {}", user.getUsername().value());
                fixedCount++;
            }
        }

        logger.info("Diagnóstico completado: {} usuarios reparados con rol ROLE_USER", fixedCount);
        return fixedCount;
    }
}