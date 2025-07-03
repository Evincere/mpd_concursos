package ar.gov.mpd.concursobackend.shared.infrastructure.controller;

import ar.gov.mpd.concursobackend.shared.infrastructure.service.CvDocumentService;
import ar.gov.mpd.concursobackend.shared.infrastructure.service.CvDocumentService.CvDocumentStats;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controlador REST para gestión de documentos CV
 * 
 * @description Endpoints para estadísticas y gestión de documentos del CV
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/cv/documentos")
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
public class CvDocumentController {

    private static final Logger logger = LoggerFactory.getLogger(CvDocumentController.class);

    @Autowired
    private CvDocumentService cvDocumentService;

    /**
     * Obtiene estadísticas de documentos para un usuario
     */
    @GetMapping("/estadisticas/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> getUserDocumentStats(@PathVariable UUID userId) {
        logger.info("Obteniendo estadísticas de documentos para usuario: {}", userId);
        
        try {
            CvDocumentStats stats = cvDocumentService.getUserDocumentStats(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalDocuments", stats.getTotalDocuments());
            response.put("experienceDocuments", stats.getExperienceDocuments());
            response.put("educationDocuments", stats.getTotalDocuments() - stats.getExperienceDocuments());
            response.put("totalSizeBytes", stats.getTotalSizeBytes());
            response.put("totalSizeMB", Math.round(stats.getTotalSizeMB() * 100.0) / 100.0);
            
            logger.info("Estadísticas obtenidas para usuario {}: {} documentos, {:.2f} MB", 
                       userId, stats.getTotalDocuments(), stats.getTotalSizeMB());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error obteniendo estadísticas de documentos para usuario: {}", userId, e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al obtener estadísticas de documentos"));
        }
    }

    /**
     * Verifica si un documento existe
     */
    @GetMapping("/verificar")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> verifyDocument(@RequestParam String documentPath) {
        logger.info("Verificando existencia de documento: {}", documentPath);
        
        try {
            boolean exists = cvDocumentService.documentExists(documentPath);
            long size = exists ? cvDocumentService.getDocumentSize(documentPath) : 0;
            
            Map<String, Object> response = new HashMap<>();
            response.put("exists", exists);
            response.put("size", size);
            response.put("path", documentPath);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error verificando documento: {}", documentPath, e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al verificar documento"));
        }
    }

    /**
     * Elimina un documento específico
     */
    @DeleteMapping("/eliminar")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> deleteDocument(@RequestParam String documentPath) {
        logger.info("Eliminando documento: {}", documentPath);
        
        try {
            boolean deleted = cvDocumentService.deleteDocument(documentPath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("deleted", deleted);
            response.put("path", documentPath);
            
            if (deleted) {
                logger.info("Documento eliminado exitosamente: {}", documentPath);
                response.put("message", "Documento eliminado exitosamente");
            } else {
                logger.warn("No se pudo eliminar el documento: {}", documentPath);
                response.put("message", "No se pudo eliminar el documento");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error eliminando documento: {}", documentPath, e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al eliminar documento"));
        }
    }

    /**
     * Ejecuta limpieza manual de archivos temporales
     */
    @PostMapping("/limpiar-temporales")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupTempFiles() {
        logger.info("Ejecutando limpieza manual de archivos temporales");
        
        try {
            cvDocumentService.cleanupTempFiles();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Limpieza de archivos temporales completada");
            
            logger.info("Limpieza manual de archivos temporales completada exitosamente");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error durante la limpieza manual de archivos temporales", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error durante la limpieza de archivos temporales"));
        }
    }

    /**
     * Descarga un documento de CV por su ruta relativa
     */
    @GetMapping("/file")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Resource> downloadDocumentByPath(@RequestParam String path) {
        logger.info("Descargando documento de CV por ruta: {}", path);

        try {
            // Obtener el archivo usando el servicio
            Path filePath = cvDocumentService.getDocumentPath(path);

            if (!Files.exists(filePath)) {
                logger.warn("Archivo no encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                logger.warn("Archivo no legible: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            // Determinar el tipo de contenido
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/pdf"; // Default para documentos CV
            }

            String filename = filePath.getFileName().toString();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            logger.error("Error descargando documento de CV: {}", path, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtiene información de configuración del sistema de documentos
     */
    @GetMapping("/configuracion")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDocumentConfiguration() {
        logger.info("Obteniendo configuración del sistema de documentos CV");
        
        try {
            Map<String, Object> config = new HashMap<>();
            config.put("maxFileSize", "10MB");
            config.put("allowedTypes", new String[]{"application/pdf", "image/jpeg", "image/png", "image/jpg"});
            config.put("allowedExtensions", new String[]{".pdf", ".jpg", ".jpeg", ".png"});
            config.put("storageLocation", "uploads/cv-documents");
            config.put("tempDirectory", "uploads/cv-documents/temp");
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            logger.error("Error obteniendo configuración del sistema de documentos", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al obtener configuración"));
        }
    }

    /**
     * Endpoint de salud para el sistema de documentos CV
     */
    @GetMapping("/salud")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        logger.debug("Verificando salud del sistema de documentos CV");
        
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("service", "CvDocumentService");
            health.put("timestamp", System.currentTimeMillis());
            
            // Verificar que las carpetas principales existan
            boolean storageHealthy = cvDocumentService.documentExists("uploads/cv-documents") || 
                                   cvDocumentService.documentExists("./uploads/cv-documents");
            
            health.put("storageHealthy", storageHealthy);
            
            if (storageHealthy) {
                health.put("message", "Sistema de documentos CV funcionando correctamente");
                return ResponseEntity.ok(health);
            } else {
                health.put("status", "DEGRADED");
                health.put("message", "Problemas con el almacenamiento de documentos CV");
                return ResponseEntity.status(503).body(health);
            }
            
        } catch (Exception e) {
            logger.error("Error durante verificación de salud del sistema de documentos", e);
            
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("service", "CvDocumentService");
            health.put("error", e.getMessage());
            health.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(503).body(health);
        }
    }
}
