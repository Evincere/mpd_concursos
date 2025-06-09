package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import ar.gov.mpd.concursobackend.document.application.service.DocumentQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador público para health checks del sistema de cola de documentos
 */
@RestController
@RequestMapping("/api/documentos/queue/public")
@RequiredArgsConstructor
@Slf4j
public class DocumentQueueHealthController {

    private final DocumentQueueService documentQueueService;

    /**
     * Endpoint público de prueba para verificar conectividad del sistema de cola
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getQueueHealth() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            health.put("queueSize", documentQueueService.getQueueSize());
            health.put("service", "DocumentQueueService");
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Error en health check de cola de documentos", e);
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            health.put("service", "DocumentQueueService");
            return ResponseEntity.status(500).body(health);
        }
    }

    /**
     * Endpoint público para verificar conectividad básica
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Document Queue Service is running");
        return ResponseEntity.ok(response);
    }
}
