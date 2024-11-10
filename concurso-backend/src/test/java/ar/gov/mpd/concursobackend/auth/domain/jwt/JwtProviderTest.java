package ar.gov.mpd.concursobackend.auth.domain.jwt;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

public class JwtProviderTest {

    @SuppressWarnings("unused")
    private JwtProvider jwtProvider;

    @BeforeEach
    public void setup(){
        this.jwtProvider = new JwtProvider();
    }
        
    @Test
    public void testGenerateToken() {
        // Aquí deberías agregar la lógica de tu test
    }
}
    