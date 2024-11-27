package ar.gov.mpd.concursobackend.auth.domain.jwt;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class JwtEntryPointTest {

    @InjectMocks
    JwtEntryPoint jwtEntryPoint;

    @Test
    void testCommence() throws Exception {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthenticationException authException = mock(AuthenticationException.class);

        // Act
        jwtEntryPoint.commence(request, response, authException);

        // Assert
        ObjectMapper mapper = new ObjectMapper();
        var responseBody = mapper.readTree(response.getContentAsString());
        assertEquals("** No autorizado **", responseBody.get("message").asText());
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
        assertEquals("application/json", response.getContentType());
    }
}