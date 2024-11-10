package ar.gov.mpd.concursobackend.auth.domain.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;

public class UserAlreadyExistsExceptionTest {

    private UserAlreadyExistsException exception;

    @BeforeEach
    public void setup(){
        exception = new UserAlreadyExistsException("El usuario ya existe");
    }
        
    @Test
    public void testGetMessage() {
        assertEquals("El usuario ya existe", exception.getMessage());
    }
}
    