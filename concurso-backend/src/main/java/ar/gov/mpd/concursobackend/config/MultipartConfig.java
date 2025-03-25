package ar.gov.mpd.concursobackend.config;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

@Configuration
public class MultipartConfig {

    /**
     * Configura el elemento Multipart para manejar subida de archivos
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();

        // Establecer tamaño máximo de archivo a 20MB
        factory.setMaxFileSize(DataSize.ofMegabytes(20));

        // Establecer tamaño máximo de solicitud a 20MB
        factory.setMaxRequestSize(DataSize.ofMegabytes(20));

        // Establecer umbral de tamaño de archivo para escribir a disco (512KB)
        factory.setFileSizeThreshold(DataSize.ofKilobytes(512));

        return factory.createMultipartConfig();
    }

    /**
     * Resolver estándar para solicitudes multipart
     */
    @Bean
    public StandardServletMultipartResolver multipartResolver() {
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        resolver.setResolveLazily(true); // Permitir resolución tardía
        return resolver;
    }
}