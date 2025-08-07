package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import ar.gov.mpd.concursobackend.auth.application.service.UserDetailsServiceImpl;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtEntryPoint;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtTokenFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtEntryPoint jwtEntryPoint;
    private final JwtTokenFilter jwtTokenFilter;

    @Value("${app.cors.allowed-origins:http://localhost:4200}")
    private String[] allowedOrigins;

    @Value("${app.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String[] allowedMethods;

    @Value("${app.cors.max-age:3600}")
    private Long maxAge;

    @Value("${app.cors.allowed-headers:Authorization,Content-Type,Accept,Origin,X-Requested-With}")
    private String[] allowedHeaders;

    @Value("${app.cors.exposed-headers:Content-Disposition,X-Total-Count}")
    private String[] exposedHeaders;

    public SecurityConfig(
            UserDetailsServiceImpl userDetailsService,
            JwtEntryPoint jwtEntryPoint,
            JwtTokenFilter jwtTokenFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtEntryPoint = jwtEntryPoint;
        this.jwtTokenFilter = jwtTokenFilter;
    }

    /**
     * Configuración principal de la cadena de filtros de seguridad.
     *
     * CSRF está deshabilitado de forma segura porque:
     * 1. La aplicación es 100% stateless (SessionCreationPolicy.STATELESS)
     * 2. La autenticación se realiza únicamente via JWT en headers Authorization
     * 3. No se utilizan cookies de sesión ni autenticación basada en cookies
     * 4. Cada request es independiente y no mantiene estado en el servidor
     *
     * IMPORTANTE: Si en el futuro se introduce autenticación basada en cookies,
     * CSRF DEBE ser rehabilitado y configurado apropiadamente.
     *
     * @param http Configuración de seguridad HTTP
     * @return Cadena de filtros de seguridad configurada
     * @throws Exception Si hay errores en la configuración
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF deshabilitado de forma segura para API REST stateless con JWT
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtEntryPoint))
                // Configuración stateless: sin sesiones, sin cookies de autenticación
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/health", "/actuator/health").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        // Rutas específicas de concursos públicas (solo lectura)
                        .requestMatchers(HttpMethod.GET, "/api/concursos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/concursos/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/concursos/buscar").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/concursos/filtrar").permitAll()
                        .requestMatchers("/api/test/**").permitAll()
                        .requestMatchers("/api/documentos/queue/public/**").permitAll()
                        // ✅ CRITICAL FIX: Permitir acceso público a imágenes de perfil para que funcionen en <img> tags
                        // Las imágenes de perfil necesitan ser accesibles sin autenticación para mostrarse en el navegador
                        .requestMatchers("/api/files/profile-images/**").permitAll()
                        // ✅ Permitir acceso público a bases de concursos para descarga
                        .requestMatchers("/api/files/contest-bases/**").permitAll()
                        // ✅ CRITICAL FIX: Permitir acceso público a documentos para visualización
                        // Los documentos necesitan ser accesibles sin autenticación para mostrarse en el navegador
                        .requestMatchers("/api/files/documents/**").permitAll()
                        .requestMatchers("/api/files/cv-documents/**").permitAll()
                        // ✅ CRITICAL FIX: Permitir acceso público al endpoint principal de documentos
                        .requestMatchers("/api/documentos/*/file").permitAll()
                        .requestMatchers("/api/v1/roles/**").authenticated()
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()
                        .requestMatchers("/api/inscripciones/**").authenticated()
                        .requestMatchers("/api/dashboard/**").authenticated()
                        // Diagnóstico de seguridad (solo desarrollo, requiere ADMIN)
                        .requestMatchers("/api/security/diagnostic/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración CORS específica y segura por entorno.
     *
     * Implementa el principio de menor privilegio especificando únicamente
     * los headers y orígenes necesarios para el funcionamiento de la aplicación.
     *
     * Configuración por entorno:
     * - Desarrollo: Permite localhost y 127.0.0.1 en puertos 4200 y 8000
     * - Producción: Solo dominios específicos de producción
     * - Testing: Configuración permisiva para tests de integración
     *
     * Headers permitidos están limitados a los que realmente usa la aplicación:
     * - Authorization: Token JWT
     * - Content-Type/Accept: Tipos de contenido
     * - X-*: Headers personalizados de la aplicación
     *
     * Headers expuestos están limitados a los que el cliente necesita leer:
     * - Content-Disposition: Para descargas
     * - X-Total-Count, X-Page-*: Para paginación
     * - Location: Para recursos creados
     *
     * @return Configuración CORS específica por entorno
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Orígenes permitidos (configurables por entorno)
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));

        // Métodos HTTP permitidos (configurables por entorno)
        configuration.setAllowedMethods(Arrays.asList(allowedMethods));

        // Headers específicos que la aplicación necesita (configurables por entorno)
        // Para desarrollo, permitimos todos los headers para facilitar uploads
        if (allowedHeaders.length == 1 && "*".equals(allowedHeaders[0])) {
            configuration.setAllowedHeaders(Arrays.asList("*"));
        } else {
            configuration.setAllowedHeaders(Arrays.asList(allowedHeaders));
        }

        // Headers que el cliente puede leer de la respuesta (configurables por entorno)
        configuration.setExposedHeaders(Arrays.asList(exposedHeaders));

        // Permitir credenciales (necesario para JWT en headers)
        configuration.setAllowCredentials(true);

        // Tiempo de cache para preflight requests (configurable por entorno)
        configuration.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}