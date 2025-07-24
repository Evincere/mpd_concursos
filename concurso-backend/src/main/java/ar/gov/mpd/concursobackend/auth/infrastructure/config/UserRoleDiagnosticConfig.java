package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import ar.gov.mpd.concursobackend.auth.application.usecase.role.FixUsersWithoutRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

/**
 * Configuración para ejecutar el diagnóstico y reparación de usuarios sin roles
 * durante el arranque de la aplicación.
 * HABILITADO: Para reparar usuarios sin roles automáticamente
 */
@Configuration // HABILITADO: Para reparar usuarios sin roles
public class UserRoleDiagnosticConfig {

    private static final Logger logger = LoggerFactory.getLogger(UserRoleDiagnosticConfig.class);

    @Bean
    @Order(50) // Se ejecuta DESPUÉS de la inicialización de roles (Order 10) y usuarios esenciales
    public CommandLineRunner runUserRoleDiagnostic(FixUsersWithoutRoles fixUsersWithoutRoles) {
        return args -> {
            logger.info("Ejecutando diagnóstico de roles de usuarios...");
            int fixedCount = fixUsersWithoutRoles.run();
            logger.info("Diagnóstico completado: {} usuarios reparados", fixedCount);
        };
    }
}