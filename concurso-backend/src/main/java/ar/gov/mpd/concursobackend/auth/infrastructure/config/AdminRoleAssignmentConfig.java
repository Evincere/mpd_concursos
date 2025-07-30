package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.Optional;

/**
 * Configuración para asegurar que el usuario admin tenga el rol ROLE_ADMIN
 * Se ejecuta después de la inicialización de datos para corregir roles faltantes
 */
@Configuration
public class AdminRoleAssignmentConfig {

    private static final Logger logger = LoggerFactory.getLogger(AdminRoleAssignmentConfig.class);

    @Bean
    @Order(60) // Se ejecuta DESPUÉS del diagnóstico de roles (Order 50)
    public CommandLineRunner ensureAdminRole(RolService rolService, IUserRepository userRepository) {
        return args -> {
            logger.info("🔍 [AdminRoleAssignmentConfig] Verificando rol de administrador...");
            
            try {
                // Buscar el usuario admin
                Optional<User> adminUser = userRepository.getByUsername(new UserUsername("admin"));
                
                if (adminUser.isEmpty()) {
                    logger.info("⏭️ [AdminRoleAssignmentConfig] Usuario admin no encontrado, omitiendo verificación de rol");
                    return;
                }
                
                User admin = adminUser.get();
                boolean hasAdminRole = admin.getRoles().stream()
                        .anyMatch(role -> role.getRole() == RoleEnum.ROLE_ADMIN);
                
                if (hasAdminRole) {
                    logger.info("✅ [AdminRoleAssignmentConfig] Usuario admin ya tiene rol ROLE_ADMIN");
                    return;
                }
                
                // Asignar rol ROLE_ADMIN si no lo tiene
                logger.info("🔑 [AdminRoleAssignmentConfig] Asignando rol ROLE_ADMIN al usuario admin...");
                rolService.assignRoleToUser("admin", RoleEnum.ROLE_ADMIN);
                logger.info("✅ [AdminRoleAssignmentConfig] Rol ROLE_ADMIN asignado exitosamente al usuario admin");
                
            } catch (Exception e) {
                logger.error("❌ [AdminRoleAssignmentConfig] Error al verificar/asignar rol de administrador: {}", 
                           e.getMessage(), e);
                logger.warn("⚠️ [AdminRoleAssignmentConfig] El usuario admin podría no tener permisos de administrador");
            }
        };
    }
}
