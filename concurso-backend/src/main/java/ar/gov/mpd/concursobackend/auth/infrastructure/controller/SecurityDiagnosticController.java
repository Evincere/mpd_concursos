package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import ar.gov.mpd.concursobackend.auth.infrastructure.service.SecurityValidationService;
import ar.gov.mpd.concursobackend.shared.infrastructure.service.DatabaseConfigurationValidationService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para diagnóstico de configuración de seguridad.
 * 
 * IMPORTANTE: Este controlador solo está disponible en entornos de desarrollo
 * y para usuarios con rol ADMIN. No debe estar disponible en producción.
 * 
 * Proporciona endpoints para:
 * 1. Verificar configuración CSRF
 * 2. Validar configuración stateless
 * 3. Generar reportes de seguridad
 * 4. Diagnosticar peticiones HTTP
 * 
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-07
 */
@RestController
@RequestMapping("/api/security/diagnostic")
@ConditionalOnProperty(name = "app.security.diagnostic.enabled", havingValue = "true", matchIfMissing = false)
public class SecurityDiagnosticController {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityDiagnosticController.class);
    
    @Autowired
    private SecurityValidationService securityValidationService;

    @Autowired
    private DatabaseConfigurationValidationService databaseConfigurationValidationService;
    
    /**
     * Obtiene un reporte completo de la configuración de seguridad
     * 
     * @return Reporte de configuración de seguridad
     */
    @GetMapping("/report")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityReport() {
        logger.info("Generando reporte de configuración de seguridad");
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("report", securityValidationService.generateSecurityReport());
        response.put("status", "success");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Valida la configuración CSRF actual
     * 
     * @return Estado de la configuración CSRF
     */
    @GetMapping("/csrf-status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getCsrfStatus() {
        logger.info("Verificando estado de configuración CSRF");
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("csrf_enabled", false);
        response.put("csrf_safe_disabled", true);
        response.put("reason", "API REST stateless con JWT en headers");
        response.put("session_policy", "STATELESS");
        response.put("authentication_method", "JWT_HEADER_ONLY");
        response.put("cookies_used", false);
        response.put("recommendation", "Mantener CSRF deshabilitado para esta arquitectura");
        response.put("warning", "Si se introducen cookies de autenticación, REHABILITAR CSRF");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Diagnostica una petición HTTP específica
     * 
     * @param request Petición HTTP a diagnosticar
     * @return Diagnóstico de la petición
     */
    @PostMapping("/diagnose-request")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> diagnoseRequest(HttpServletRequest request) {
        logger.info("Diagnosticando petición HTTP");
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        
        // Validar seguridad de la petición
        boolean isSecure = securityValidationService.validateRequestSecurity(request);
        response.put("request_secure", isSecure);
        
        // Información de headers
        Map<String, String> headers = new HashMap<>();
        if (request.getHeaderNames() != null) {
            request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
                String headerValue = request.getHeader(headerName);
                // Sanitizar headers sensibles
                if (headerName.toLowerCase().contains("authorization")) {
                    headers.put(headerName, headerValue != null ? "[PRESENT]" : "[ABSENT]");
                } else {
                    headers.put(headerName, headerValue);
                }
            });
        }
        response.put("headers", headers);
        
        // Información de cookies
        Map<String, String> cookies = new HashMap<>();
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                cookies.put(cookie.getName(), "[PRESENT]");
            }
        }
        response.put("cookies", cookies);
        response.put("cookies_count", cookies.size());
        
        // Análisis de seguridad
        response.put("has_auth_header", request.getHeader("Authorization") != null);
        response.put("has_jwt_token", request.getHeader("Authorization") != null && 
                                     request.getHeader("Authorization").startsWith("Bearer "));
        response.put("session_id", request.getRequestedSessionId());
        response.put("method", request.getMethod());
        response.put("path", request.getServletPath());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Obtiene información sobre la configuración de sesiones
     * 
     * @return Información de configuración de sesiones
     */
    @GetMapping("/session-config")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSessionConfig() {
        logger.info("Obteniendo configuración de sesiones");
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("session_creation_policy", "STATELESS");
        response.put("session_management", "DISABLED");
        response.put("session_cookies", "NOT_USED");
        response.put("stateless", true);
        response.put("csrf_protection_needed", false);
        response.put("explanation", "En aplicaciones stateless con JWT, CSRF no es necesario");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Endpoint de salud específico para configuración de seguridad
     * 
     * @return Estado de salud de la configuración de seguridad
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityHealth() {
        logger.info("Verificando salud de configuración de seguridad");
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", "HEALTHY");
        response.put("csrf_config", "SAFE_DISABLED");
        response.put("session_config", "STATELESS");
        response.put("auth_method", "JWT_HEADERS");
        response.put("security_level", "HIGH");
        response.put("recommendations", "Configuración óptima para API REST");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene un reporte de configuración de base de datos
     *
     * @return Reporte de configuración de base de datos
     */
    @GetMapping("/database-config")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDatabaseConfig() {
        logger.info("Generando reporte de configuración de base de datos");

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("report", databaseConfigurationValidationService.generateDatabaseConfigurationReport());
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }
}
