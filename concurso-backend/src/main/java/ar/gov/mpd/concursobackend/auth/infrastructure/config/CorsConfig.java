package ar.gov.mpd.concursobackend.auth.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Permitir peticiones desde el frontend y h2-console
        config.addAllowedOrigin("http://localhost:4200");
        config.addAllowedOrigin("http://localhost:8080");
        
        // Permitir credenciales
        config.setAllowCredentials(true);
        
        // Permitir métodos HTTP
        config.addAllowedMethod("*");  
        
        // Permitir headers
        config.addAllowedHeader("*");  
        
        // Exponer headers necesarios
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Access-Control-Allow-Origin");
        config.addExposedHeader("Access-Control-Allow-Credentials");
        
        // Tiempo máximo de cache para las respuestas OPTIONS
        config.setMaxAge(3600L);
        
        source.registerCorsConfiguration("/**", config);
        source.registerCorsConfiguration("/h2-console/**", config);
        return new CorsFilter(source);
    }
} 