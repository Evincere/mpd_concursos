package ar.gov.mpd.concursobackend.file.infrastructure.web;

import ar.gov.mpd.concursobackend.shared.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Controlador temporal para servir archivos de documentos y CV documents
 * mediante rutas estáticas hasta que se corrija el frontend
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class DocumentFileController {

    private final StorageConfig storageConfig;

    /**
     * Sirve archivos de documents por DNI
     */
    @GetMapping("/documents/{dni}/{filename:.+}")
    public ResponseEntity<Resource> serveDocumentFile(
            @PathVariable String dni,
            @PathVariable String filename) {
        
        try {
            log.debug("Sirviendo documento: dni={}, filename={}", dni, filename);
            
            // Construir ruta del archivo
            Path filePath = storageConfig.getDocumentsPath().resolve(dni).resolve(filename);
            
            if (!Files.exists(filePath)) {
                log.warn("Documento no encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Documento no legible: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            String contentType = determineContentType(filename);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (MalformedURLException e) {
            log.error("Error al servir documento: dni={}, filename={}", dni, filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Sirve archivos de CV documents por UUID
     */
    @GetMapping("/cv-documents/{uuid}/{filename:.+}")
    public ResponseEntity<Resource> serveCvDocumentFile(
            @PathVariable String uuid,
            @PathVariable String filename) {
        
        try {
            log.debug("Sirviendo CV documento: uuid={}, filename={}", uuid, filename);
            
            // Construir ruta del archivo
            Path filePath = storageConfig.getCvDocumentsPath().resolve(uuid).resolve(filename);
            
            if (!Files.exists(filePath)) {
                log.warn("CV documento no encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("CV documento no legible: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            String contentType = determineContentType(filename);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (MalformedURLException e) {
            log.error("Error al servir CV documento: uuid={}, filename={}", uuid, filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Sirve archivos de documents directamente por ID (para compatibilidad)
     */
    @GetMapping("/documents/{documentId:.+}")
    public ResponseEntity<Resource> serveDocumentById(@PathVariable String documentId) {
        try {
            log.debug("Sirviendo documento por ID: {}", documentId);
            
            // Buscar el archivo en todos los directorios de usuarios
            Path documentsBase = storageConfig.getDocumentsPath();
            
            if (!Files.exists(documentsBase)) {
                return ResponseEntity.notFound().build();
            }
            
            // Buscar el archivo en todos los subdirectorios
            Path foundFile = Files.walk(documentsBase)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith(documentId))
                    .findFirst()
                    .orElse(null);
            
            if (foundFile == null) {
                log.warn("Documento no encontrado por ID: {}", documentId);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(foundFile.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Documento no legible: {}", foundFile);
                return ResponseEntity.notFound().build();
            }
            
            String filename = foundFile.getFileName().toString();
            String contentType = determineContentType(filename);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Error al servir documento por ID: {}", documentId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Sirve archivos de CV documents directamente por ID (para compatibilidad)
     */
    @GetMapping("/cv-documents/{documentId:.+}")
    public ResponseEntity<Resource> serveCvDocumentById(@PathVariable String documentId) {
        try {
            log.debug("Sirviendo CV documento por ID: {}", documentId);
            
            // Primero buscar en documents/ (donde están actualmente)
            Path documentsBase = storageConfig.getDocumentsPath();
            
            if (Files.exists(documentsBase)) {
                Path foundFile = Files.walk(documentsBase)
                        .filter(Files::isRegularFile)
                        .filter(path -> path.getFileName().toString().startsWith(documentId))
                        .findFirst()
                        .orElse(null);
                
                if (foundFile != null) {
                    Resource resource = new UrlResource(foundFile.toUri());
                    
                    if (resource.exists() && resource.isReadable()) {
                        String filename = foundFile.getFileName().toString();
                        String contentType = determineContentType(filename);
                        
                        log.info("CV documento encontrado en documents/: {}", foundFile);
                        
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                                .body(resource);
                    }
                }
            }
            
            // Si no se encuentra en documents/, buscar en cv-documents/
            Path cvDocumentsBase = storageConfig.getCvDocumentsPath();
            
            if (Files.exists(cvDocumentsBase)) {
                Path foundFile = Files.walk(cvDocumentsBase)
                        .filter(Files::isRegularFile)
                        .filter(path -> path.getFileName().toString().startsWith(documentId))
                        .findFirst()
                        .orElse(null);
                
                if (foundFile != null) {
                    Resource resource = new UrlResource(foundFile.toUri());
                    
                    if (resource.exists() && resource.isReadable()) {
                        String filename = foundFile.getFileName().toString();
                        String contentType = determineContentType(filename);
                        
                        log.info("CV documento encontrado en cv-documents/: {}", foundFile);
                        
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                                .body(resource);
                    }
                }
            }
            
            log.warn("CV documento no encontrado por ID: {}", documentId);
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            log.error("Error al servir CV documento por ID: {}", documentId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Determina el tipo de contenido basado en la extensión del archivo
     */
    private String determineContentType(String filename) {
        String lowerFilename = filename.toLowerCase();
        
        if (lowerFilename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerFilename.endsWith(".png")) {
            return "image/png";
        } else if (lowerFilename.endsWith(".gif")) {
            return "image/gif";
        }
        
        return "application/octet-stream";
    }
}