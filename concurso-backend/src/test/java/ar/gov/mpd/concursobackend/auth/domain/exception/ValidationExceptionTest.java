package ar.gov.mpd.concursobackend.auth.domain.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;

public class ValidationExceptionTest {

    private ValidationException exception;

    @BeforeEach
    public void setup(){
        exception = new ValidationException("Error de validación");
    }
        
    @Test
    public void testGetMessage() {
        assertEquals("Error de validación", exception.getMessage());
    }
}