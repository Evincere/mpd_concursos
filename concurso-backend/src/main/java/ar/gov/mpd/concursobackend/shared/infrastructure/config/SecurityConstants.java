package ar.gov.mpd.concursobackend.shared.infrastructure.config;

public final class SecurityConstants {
    
    private SecurityConstants() {
        // Constructor privado para evitar instanciación
    }

    // Rutas que usan AntPathRequestMatcher
    public static final String[] ANT_MATCHER_PATHS = {
        "/h2-console/**",
        "/favicon.ico"
    };

    // Rutas que usan MvcRequestMatcher
    public static final String[] MVC_MATCHER_PATHS = {
        "/api/auth/login",
        "/api/auth/register",
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/api/concursos/**",
        "/api/contests/inscripciones/**",
        "/api/contests/inscripciones"
    };

    // Constantes de autenticación
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
}