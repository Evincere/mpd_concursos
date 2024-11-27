package ar.gov.mpd.concursobackend.shared.infrastructure.config;

public final class SecurityConstants {
    
    private SecurityConstants() {
        // Constructor privado para evitar instanciación
    }

    public static final String[] PUBLIC_PATHS = {
        "/api/auth/**",
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/h2-console/**",
        "/api/contests/search/**",
        "/api/inscriptions/**"
    };

    // Podemos agregar más constantes relacionadas con seguridad aquí
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
} 