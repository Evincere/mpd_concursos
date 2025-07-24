package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para verificar el estado de salud del sistema de documentos
 */
@RestController
@RequestMapping("/api/documentos/health")
@RequiredArgsConstructor
@Slf4j
public class DocumentHealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Verificar que Apache Tika funcione correctamente
            Tika tika = new Tika();
            String testMimeType = tika.detect("test.pdf");
            
            health.put("status", "UP");
            health.put("tika_status", "WORKING");
            health.put("tika_version", getTikaVersion());
            health.put("test_mime_detection", testMimeType);
            
            log.debug("Document system health check passed");
            return ResponseEntity.ok(health);
            
        } catch (NoSuchFieldError e) {
            log.error("Apache Tika compatibility error", e);
            health.put("status", "DEGRADED");
            health.put("tika_status", "COMPATIBILITY_ERROR");
            health.put("error", "Apache Tika version incompatibility: " + e.getMessage());
            health.put("fallback_mode", "ENABLED");
            
            return ResponseEntity.status(503).body(health);
            
        } catch (Exception e) {
            log.error("Document system health check failed", e);
            health.put("status", "DOWN");
            health.put("tika_status", "ERROR");
            health.put("error", e.getMessage());
            
            return ResponseEntity.status(503).body(health);
        }
    }
    
    private String getTikaVersion() {
        try {
            return org.apache.tika.Tika.class.getPackage().getImplementationVersion();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
