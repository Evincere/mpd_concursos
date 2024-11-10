package ar.gov.mpd.concursobackend.auth.domain.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

public class UserTest {
@Test
    void deberiaCrearUsuarioCorrectamente() {
        // Arrange
        UserUsername username = new UserUsername("testUser");
        UserPassword password = new UserPassword("password123");
        UserEmail email = new UserEmail("test@example.com");

        // Act
        User user = new User(username, password, email);

        // Assert
        assertNotNull(user);
        assertEquals(username, user.getUsername());
        assertEquals(password, user.getPassword());
        assertEquals(email, user.getEmail());
    }

    @Test
    void deberiaAsignarRolesCorrectamente() {
        // Arrange
        User user = new User(
            new UserUsername("testUser"),
            new UserPassword("password123"),
            new UserEmail("test@example.com")
        );
        Set<Rol> roles = new HashSet<>();
        roles.add(new Rol()); 

        // Act
        user.setRoles(roles);

        // Assert
        assertNotNull(user.getRoles());
        assertEquals(roles, user.getRoles());
    }
}
