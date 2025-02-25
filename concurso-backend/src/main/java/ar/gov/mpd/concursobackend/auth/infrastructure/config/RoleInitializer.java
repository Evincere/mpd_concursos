package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;

/**
 * Configuración que inicializa los roles básicos en la base de datos
 * al iniciar la aplicación, si no existen.
 */
@Configuration
public class RoleInitializer {

    private static final Logger logger = LoggerFactory.getLogger(RoleInitializer.class);

    @Bean
    @Order(1) // Prioridad alta para asegurar que se ejecute antes que otros CommandLineRunner
    public CommandLineRunner initRoles(IRoleSpringRepository roleRepository) {
        return args -> {
            logger.info("Verificando roles básicos del sistema...");
            createRoleIfNotExists(roleRepository, RoleEnum.ROLE_USER);
            createRoleIfNotExists(roleRepository, RoleEnum.ROLE_ADMIN);
            logger.info("Verificación de roles básicos completada.");
        };
    }

    @Transactional
    private void createRoleIfNotExists(IRoleSpringRepository roleRepository, RoleEnum roleName) {
        if (!roleRepository.existsByRole(roleName)) {
            logger.info("Creando rol: {}", roleName);
            RoleEntity role = new RoleEntity(roleName);
            roleRepository.save(role);
            logger.info("Rol {} creado con éxito", roleName);
        } else {
            logger.debug("El rol {} ya existe, no es necesario crearlo", roleName);
        }
    }
}