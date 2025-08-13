package ar.gov.mpd.concursobackend.inscription.infrastructure.controller;

import ar.gov.mpd.concursobackend.inscription.application.dto.CompletenessValidationResult;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionCompletenessValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controlador REST para validaciones de inscripciones
 * Implementa endpoints de validación requeridos por el frontend
 */
@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
@Slf4j
@Tag(name = "Inscription Validation", description = "Endpoints para validación de inscripciones")
public class InscriptionValidationController {
    
    private final InscriptionCompletenessValidationService completenessValidationService;
    
    /**
     * Valida la completitud de una inscripción
     * Endpoint crítico requerido por FinalStepValidationComponent
     * 
     * @param inscriptionId ID de la inscripción a validar
     * @return Resultado de validación con detalles de completitud
     */
    @GetMapping("/validation/{inscriptionId}/completeness")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Valida la completitud de una inscripción",
        description = "Verifica si una inscripción tiene todos los datos requeridos (centro de vida, circunscripciones, términos aceptados, datos confirmados) y documentación necesaria para ser finalizada"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Validación completada exitosamente"),
        @ApiResponse(responseCode = "404", description = "Inscripción no encontrada"),
        @ApiResponse(responseCode = "403", description = "No tiene permisos para validar esta inscripción"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<CompletenessValidationResult> validateCompleteness(
            @Parameter(description = "ID único de la inscripción", required = true)
            @PathVariable UUID inscriptionId) {
        
        log.debug("🔍 [ValidationController] Recibida solicitud de validación de completitud para inscripción: {}", inscriptionId);
        
        try {
            CompletenessValidationResult result = completenessValidationService.validateCompleteness(inscriptionId);
            
            // Determinar código de respuesta HTTP basado en el resultado
            if ("NOT_FOUND".equals(result.getStatusCode())) {
                log.warn("❌ [ValidationController] Inscripción no encontrada: {}", inscriptionId);
                return ResponseEntity.notFound().build();
            }
            
            if ("FORBIDDEN".equals(result.getStatusCode())) {
                log.warn("🚫 [ValidationController] Acceso denegado para inscripción: {}", inscriptionId);
                return ResponseEntity.status(403).body(result);
            }
            
            if ("INTERNAL_ERROR".equals(result.getStatusCode())) {
                log.error("💥 [ValidationController] Error interno validando inscripción: {}", inscriptionId);
                return ResponseEntity.status(500).body(result);
            }
            
            // Respuesta exitosa
            log.info("✅ [ValidationController] Validación completada para inscripción {}: complete={}", 
                inscriptionId, result.isComplete());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("💥 [ValidationController] Error inesperado validando inscripción {}: {}", 
                inscriptionId, e.getMessage(), e);
            
            CompletenessValidationResult errorResult = CompletenessValidationResult.builder()
                .complete(false)
                .message("Error interno del sistema")
                .statusCode("INTERNAL_ERROR")
                .build();
            
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    
    /**
     * Endpoint de salud para verificar que el servicio de validación está funcionando
     */
    @GetMapping("/validation/health")
    @Operation(
        summary = "Verifica el estado del servicio de validación",
        description = "Endpoint de salud para monitoreo del servicio de validación de inscripciones"
    )
    public ResponseEntity<String> healthCheck() {
        log.debug("🏥 [ValidationController] Health check solicitado");
        return ResponseEntity.ok("Inscription validation service is healthy");
    }
}
