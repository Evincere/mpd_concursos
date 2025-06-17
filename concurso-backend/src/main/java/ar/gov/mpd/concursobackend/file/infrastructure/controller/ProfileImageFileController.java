package ar.gov.mpd.concursobackend.file.infrastructure.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controlador para servir archivos de imágenes de perfil
 * 
 * Proporciona endpoints para acceder a las imágenes de perfil almacenadas
 * en el sistema de archivos local.
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-06
 */
@RestController
@RequestMapping("/api/files/profile-images")
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class ProfileImageFileController {

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;
    
    private static final String PROFILE_IMAGES_DIR = "profile-images";

    /**
     * Sirve una imagen de perfil específica
     * 
     * @param userId ID del usuario propietario de la imagen
     * @param filename Nombre del archivo de imagen
     * @return Archivo de imagen como Resource
     */
    @GetMapping("/{userId}/{filename:.+}")
    public ResponseEntity<Resource> serveProfileImage(
            @PathVariable String userId,
            @PathVariable String filename) {
        
        try {
            log.debug("Sirviendo imagen de perfil: userId={}, filename={}", userId, filename);
            
            // Construir ruta del archivo
            Path filePath = Paths.get(uploadDir, PROFILE_IMAGES_DIR, userId, filename);
            
            // Verificar que el archivo existe
            if (!Files.exists(filePath)) {
                log.warn("Imagen de perfil no encontrada: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            // Verificar que es un archivo regular
            if (!Files.isRegularFile(filePath)) {
                log.warn("La ruta no corresponde a un archivo regular: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            // Crear resource
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Imagen de perfil no legible: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            // Determinar tipo de contenido
            String contentType = determineContentType(filePath);
            
            log.debug("Sirviendo imagen de perfil exitosamente: {}", filePath);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (MalformedURLException e) {
            log.error("URL malformada para imagen de perfil: userId={}, filename={}", userId, filename, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error sirviendo imagen de perfil: userId={}, filename={}", userId, filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Determina el tipo de contenido basado en la extensión del archivo
     * 
     * @param filePath Ruta del archivo
     * @return Tipo de contenido MIME
     */
    private String determineContentType(Path filePath) {
        try {
            String contentType = Files.probeContentType(filePath);
            if (contentType != null) {
                return contentType;
            }
        } catch (IOException e) {
            log.warn("No se pudo determinar el tipo de contenido para: {}", filePath);
        }
        
        // Fallback basado en extensión
        String filename = filePath.getFileName().toString().toLowerCase();
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filename.endsWith(".png")) {
            return "image/png";
        } else if (filename.endsWith(".gif")) {
            return "image/gif";
        }
        
        // Tipo por defecto
        return "application/octet-stream";
    }
}
