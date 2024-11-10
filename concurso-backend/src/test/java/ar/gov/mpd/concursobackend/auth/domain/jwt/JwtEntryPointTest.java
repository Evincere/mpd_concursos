package ar.gov.mpd.concursobackend.auth.domain.jwt;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.core.AuthenticationException;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class JwtEntryPointTest {

    private JwtEntryPoint jwtEntryPoint;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    public void setup(){
        jwtEntryPoint = new JwtEntryPoint();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }
        
    @Test
    public void testCommence() throws Exception {
        AuthenticationException authException = new AuthenticationException("Autenticación fallida") {};
        jwtEntryPoint.commence(request, response, authException);
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
        assertEquals("** No autorizado **", response.getErrorMessage());
    }
}