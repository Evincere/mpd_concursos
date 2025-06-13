package ar.gov.mpd.concursobackend.shared.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

/**
 * CLASE HABILITADA: Crea usuarios esenciales para el sistema
 *
 * Esta clase crea automáticamente al iniciar el backend:
 * - Usuario administrador: admin/admin123
 * - Usuario común: user_test/user123
 *
 * HABILITADA PARA CREAR USUARIOS ESENCIALES
 */
@Component
public class CreateTestData implements CommandLineRunner {

    @Autowired
    private RolService rolService;
    @Autowired
    private UserService userService;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("=== INICIANDO CREACIÓN DE USUARIOS ESENCIALES ===");

            // Crear roles si no existen
            createRoles();

            // Crear usuarios esenciales
            createUsers();

            System.out.println("=== CREACIÓN DE USUARIOS ESENCIALES COMPLETADA ===");

        } catch (Exception e) {
            System.err.println("Error creando usuarios esenciales: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createRoles() {
        if (!rolService.existsByRole(RoleEnum.ROLE_ADMIN)) {
            Rol rolAdmin = new Rol(RoleEnum.ROLE_ADMIN);
            rolService.create(rolAdmin);
        }

        if (!rolService.existsByRole(RoleEnum.ROLE_USER)) {
            Rol rolUser = new Rol(RoleEnum.ROLE_USER);
            rolService.create(rolUser);
        }
    }

    private void createUsers() {
        System.out.println("=== CREANDO USUARIOS ESENCIALES ===");

        // 1. Crear usuario administrador
        String adminDni = "12345678";
        User admin = createSuperAdmin("admin", "admin@mpd.gov.ar", "admin123", adminDni,
                null, "Admin", "MPD");
        if (admin != null) {
            System.out.println("✅ Usuario administrador 'admin' creado exitosamente");
        }

        // 2. Crear usuario común de prueba
        String userTestDni = "87654321";
        User userTest = createUserIfNotExists("user_test", "user_test@example.com", "user123", userTestDni,
                null, "Usuario", "Test");
        if (userTest != null) {
            System.out.println("✅ Usuario común 'user_test' creado exitosamente");
        }

        System.out.println("=== USUARIOS ESENCIALES COMPLETADOS ===");
    }



    private User createUserIfNotExists(String username, String email, String password, String dni, String cuit,
            String firstName, String lastName) {
        if (!userService.existsByUsername(new UserUsername(username))) {
            UserCreateDto user = new UserCreateDto();
            user.setEmail(email);
            user.setUsername(username);
            user.setPassword(password);
            user.setDni(dni);
            // Solo asignar CUIT si no es null
            if (cuit != null) {
                user.setCuit(cuit);
            }
            user.setNombre(firstName);
            user.setApellido(lastName);
            user.setConfirmPassword(password); // Required for validation
            return userService.createUser(user);
        }
        return userService.getByUsername(new UserUsername(username)).orElse(null);
    }

    private User createSuperAdmin(String username, String email, String password, String dni, String cuit,
            String firstName, String lastName) {
        if (!userService.existsByUsername(new UserUsername(username))) {
            UserCreateDto user = new UserCreateDto();
            user.setEmail(email);
            user.setUsername(username);
            user.setPassword(password);
            user.setDni(dni);
            // Solo asignar CUIT si no es null
            if (cuit != null) {
                user.setCuit(cuit);
            }
            user.setNombre(firstName);
            user.setApellido(lastName);
            user.setConfirmPassword(password);

            User createdUser = userService.createUser(user);

            // Asignar rol de admin
            rolService.assignRoleToUser(username, RoleEnum.ROLE_ADMIN);

            return createdUser;
        }
        return userService.getByUsername(new UserUsername(username)).orElse(null);
    }


}
