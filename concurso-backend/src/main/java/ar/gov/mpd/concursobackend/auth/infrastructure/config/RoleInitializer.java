package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
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

    // @Bean // DESHABILITADO: Funcionalidad duplicada con DataInitializationService
    @Order(10) // Prioridad más baja para asegurar que Hibernate termine primero
    public CommandLineRunner initRoles(IRoleSpringRepository roleRepository) {
        return args -> {
            logger.info("Verificando roles básicos del sistema...");

            // Esperar un poco para asegurar que las tablas estén completamente creadas
            try {
                Thread.sleep(1000); // 1 segundo de espera
                createRoleIfNotExists(roleRepository, RoleEnum.ROLE_USER);
                createRoleIfNotExists(roleRepository, RoleEnum.ROLE_ADMIN);
                logger.info("Verificación de roles básicos completada.");
            } catch (Exception e) {
                logger.error("Error durante la inicialización de roles: {}", e.getMessage());
                // No lanzar la excepción para evitar que falle el startup
                logger.warn("La inicialización de roles se omitirá. Los roles se pueden crear manualmente.");
            }
        };
    }

    @Transactional
    private void createRoleIfNotExists(IRoleSpringRepository roleRepository, RoleEnum roleName) {
        int maxRetries = 3;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                if (!roleRepository.existsByName(roleName)) {
                    logger.info("Creando rol: {}", roleName);
                    RoleEntity role = new RoleEntity(roleName);
                    roleRepository.save(role);
                    logger.info("Rol {} creado con éxito", roleName);
                } else {
                    logger.debug("El rol {} ya existe, no es necesario crearlo", roleName);
                }
                return; // Éxito, salir del método
            } catch (Exception e) {
                retryCount++;
                logger.warn("Intento {} fallido para crear rol {}: {}", retryCount, roleName, e.getMessage());

                if (retryCount < maxRetries) {
                    try {
                        Thread.sleep(2000); // Esperar 2 segundos antes del siguiente intento
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrumpido durante la espera", ie);
                    }
                } else {
                    logger.error("No se pudo crear el rol {} después de {} intentos", roleName, maxRetries);
                    throw new RuntimeException("Fallo en la creación del rol después de múltiples intentos", e);
                }
            }
        }
    }
}