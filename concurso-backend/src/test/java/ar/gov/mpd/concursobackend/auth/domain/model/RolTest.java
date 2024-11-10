package ar.gov.mpd.concursobackend.auth.domain.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;

public class RolTest {

    private Rol rol;
    private UUID id;
    private RoleEnum role;

    @BeforeEach
    public void setUp() {
        id = UUID.randomUUID();
        role = RoleEnum.ROLE_USER; 
        rol = new Rol();
        rol.setId(id);
        rol.setRole(role);
    }

    @Test
    public void testGetId() {
        assertNotNull(rol.getId());
        assertEquals(id, rol.getId());
    }

    @Test
    public void testGetRole() {
        assertEquals(role, rol.getRole());
    }

    @Test
    public void testSetRole() {
        RoleEnum newRole = RoleEnum.ROLE_ADMIN;
        rol.setRole(newRole);
        assertEquals(newRole, rol.getRole());
    }
}
