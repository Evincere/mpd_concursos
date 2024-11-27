package ar.gov.mpd.concursobackend.shared.infrastructure.config;

public final class SecurityConstants {
    
    private SecurityConstants() {
        // Constructor privado para evitar instanciación
    }

    public static final String[] PUBLIC_PATHS = {
        "/auth/login",
        "/auth/register",
        "/h2-console/**",
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/api/contests/search/**"
    };

    // Podemos agregar más constantes relacionadas con seguridad aquí
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
} 