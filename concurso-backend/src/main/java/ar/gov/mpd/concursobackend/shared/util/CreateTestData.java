package ar.gov.mpd.concursobackend.shared.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.service.CreateInscriptionService;

import java.util.UUID;

@Component
public class CreateTestData implements CommandLineRunner {

    @Autowired
    private RolService rolService;
    @Autowired
    private UserService userService;
    @Autowired
    private CreateInscriptionService createInscriptionService;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Crear roles si no existen
            createRoles();

            // Crear usuarios si no existen
            createUsers();

            // Crear inscripciones de prueba
            createInscriptions();

        } catch (Exception e) {
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

    @SuppressWarnings("unused")
    private void createUsers() {
        // Crear usuario semper (admin)
        User semper = createUserIfNotExists("semper", "spereyra@gmail.com", "123456", "26598410", "20265984100");

        // Crear usuarios de prueba
        User usuario1 = createUserIfNotExists("usuario1", "usuario1@example.com", "123456", "12345678", "20123456780");
        User usuario2 = createUserIfNotExists("usuario2", "usuario2@example.com", "123456", "23456789", "20234567890");
        User usuario3 = createUserIfNotExists("usuario3", "usuario3@example.com", "123456", "34567890", "20345678900");
        User usuario4 = createUserIfNotExists("usuario4", "usuario4@example.com", "123456", "45678901", "20456789010");
        User usuario5 = createUserIfNotExists("usuario5", "usuario5@example.com", "123456", "56789012", "20567890120");
    }

    private User createUserIfNotExists(String username, String email, String password, String dni, String cuit) {
        if (!userService.existsByUsername(new UserUsername(username))) {
            UserCreateDto user = new UserCreateDto();
            user.setEmail(email);
            user.setUsername(username);
            user.setPassword(password);
            user.setDni(dni);
            user.setCuit(cuit);
            return userService.createUser(user);
        }
        return userService.getByUsername(new UserUsername(username)).orElse(null);
    }

    private void createInscriptions() {
        // Obtener IDs de usuarios
        UUID usuario1Id = getUserId("usuario1");
        UUID usuario2Id = getUserId("usuario2");
        UUID usuario3Id = getUserId("usuario3");
        UUID usuario4Id = getUserId("usuario4");
        UUID usuario5Id = getUserId("usuario5");

        if (usuario1Id != null) {
            // Inscripciones para concursos activos
            createInscription(1L, usuario1Id); // PENDING
            createInscription(1L, usuario2Id); // ACCEPTED
            createInscription(1L, usuario3Id); // REJECTED
            createInscription(2L, usuario1Id); // PENDING
            createInscription(2L, usuario4Id); // ACCEPTED
            createInscription(3L, usuario2Id); // PENDING

            // Inscripciones para concursos en progreso
            createInscription(4L, usuario5Id); // ACCEPTED
            createInscription(4L, usuario1Id); // REJECTED
            createInscription(5L, usuario2Id); // ACCEPTED
            createInscription(5L, usuario3Id); // PENDING
        }
    }

    private UUID getUserId(String username) {
        return userService.getByUsername(new UserUsername(username))
                .map(user -> user.getId().value())
                .orElse(null);
    }

    private void createInscription(Long contestId, UUID userId) {
        try {
            InscriptionRequest request = InscriptionRequest.builder()
                    .contestId(contestId)
                    .userId(userId)
                    .build();
            createInscriptionService.createInscription(request);
        } catch (Exception e) {
            // Si la inscripción ya existe, ignoramos el error
            System.out.println("Warning: No se pudo crear la inscripción para contestId=" + contestId + ", userId=" + userId);
        }
    }
}
