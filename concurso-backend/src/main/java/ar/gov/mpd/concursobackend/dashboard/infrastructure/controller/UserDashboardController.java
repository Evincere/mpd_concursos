package ar.gov.mpd.concursobackend.dashboard.infrastructure.controller;

import ar.gov.mpd.concursobackend.dashboard.application.dto.UserDeadlineResponse;
import ar.gov.mpd.concursobackend.dashboard.application.dto.UserStatsResponse;
import ar.gov.mpd.concursobackend.dashboard.application.port.in.GetUserDeadlinesUseCase;
import ar.gov.mpd.concursobackend.dashboard.application.port.in.GetUserStatsUseCase;
import ar.gov.mpd.concursobackend.shared.application.service.SecurityService;
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

import java.util.List;
import java.util.UUID;

/**
 * Controlador REST para el dashboard del usuario
 * Proporciona endpoints para obtener vencimientos y estadísticas personalizadas
 */
@RestController
@RequestMapping("/api/dashboard/user")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
@Slf4j
@Tag(name = "User Dashboard", description = "API para el dashboard del usuario común")
public class UserDashboardController {
    
    private final GetUserDeadlinesUseCase getUserDeadlinesUseCase;
    private final GetUserStatsUseCase getUserStatsUseCase;
    private final SecurityService securityService;
    
    @GetMapping("/deadlines")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene los vencimientos próximos del usuario",
        description = "Retorna una lista de vencimientos ordenados por fecha, incluyendo inscripciones, documentos y exámenes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vencimientos obtenidos exitosamente"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<List<UserDeadlineResponse>> getUserDeadlines(
            @Parameter(description = "Número de días hacia adelante para buscar vencimientos", example = "30")
            @RequestParam(defaultValue = "30") Integer daysAhead) {
        
        try {
            Long userId = getCurrentUserId();
            log.info("Obteniendo vencimientos para usuario {} con {} días de anticipación", userId, daysAhead);
            
            List<UserDeadlineResponse> deadlines = getUserDeadlinesUseCase.getUserDeadlines(userId, daysAhead);
            
            log.info("Se encontraron {} vencimientos para el usuario {}", deadlines.size(), userId);
            return ResponseEntity.ok(deadlines);
            
        } catch (Exception e) {
            log.error("Error obteniendo vencimientos del usuario: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/deadlines/urgent")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene los vencimientos urgentes del usuario",
        description = "Retorna solo los vencimientos que están próximos a vencer (7 días o menos)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vencimientos urgentes obtenidos exitosamente"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<List<UserDeadlineResponse>> getUrgentDeadlines() {
        
        try {
            Long userId = getCurrentUserId();
            log.info("Obteniendo vencimientos urgentes para usuario {}", userId);
            
            List<UserDeadlineResponse> urgentDeadlines = getUserDeadlinesUseCase.getUrgentDeadlines(userId);
            
            log.info("Se encontraron {} vencimientos urgentes para el usuario {}", urgentDeadlines.size(), userId);
            return ResponseEntity.ok(urgentDeadlines);
            
        } catch (Exception e) {
            log.error("Error obteniendo vencimientos urgentes del usuario: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/deadlines/type/{type}")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene vencimientos por tipo específico",
        description = "Retorna vencimientos filtrados por tipo: INSCRIPTION, DOCUMENTS, EXAM, RESULT"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vencimientos por tipo obtenidos exitosamente"),
        @ApiResponse(responseCode = "400", description = "Tipo de vencimiento inválido"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<List<UserDeadlineResponse>> getDeadlinesByType(
            @Parameter(description = "Tipo de vencimiento", example = "DOCUMENTS")
            @PathVariable String type) {
        
        try {
            // Validar tipo
            if (!isValidDeadlineType(type)) {
                log.warn("Tipo de vencimiento inválido: {}", type);
                return ResponseEntity.badRequest().build();
            }
            
            Long userId = getCurrentUserId();
            log.info("Obteniendo vencimientos del tipo {} para usuario {}", type, userId);
            
            List<UserDeadlineResponse> deadlines = getUserDeadlinesUseCase.getDeadlinesByType(userId, type);
            
            log.info("Se encontraron {} vencimientos del tipo {} para el usuario {}", deadlines.size(), type, userId);
            return ResponseEntity.ok(deadlines);
            
        } catch (Exception e) {
            log.error("Error obteniendo vencimientos del tipo {} para el usuario: {}", type, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene las estadísticas completas del usuario",
        description = "Retorna estadísticas detalladas del perfil, inscripciones, documentos, exámenes y actividad"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadísticas obtenidas exitosamente"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<UserStatsResponse> getUserStats() {
        
        try {
            Long userId = getCurrentUserId();
            log.info("Obteniendo estadísticas completas para usuario {}", userId);
            
            UserStatsResponse stats = getUserStatsUseCase.getUserStats(userId);
            
            log.info("Estadísticas obtenidas exitosamente para usuario {}", userId);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Error obteniendo estadísticas del usuario: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats/profile")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene solo las estadísticas del perfil del usuario",
        description = "Retorna estadísticas específicas del perfil como completitud y campos pendientes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadísticas del perfil obtenidas exitosamente"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<UserStatsResponse.ProfileStats> getProfileStats() {
        
        try {
            Long userId = getCurrentUserId();
            log.info("Obteniendo estadísticas del perfil para usuario {}", userId);
            
            UserStatsResponse.ProfileStats profileStats = getUserStatsUseCase.getProfileStats(userId);
            
            log.info("Estadísticas del perfil obtenidas exitosamente para usuario {}", userId);
            return ResponseEntity.ok(profileStats);
            
        } catch (Exception e) {
            log.error("Error obteniendo estadísticas del perfil del usuario: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats/inscriptions")
    @PreAuthorize("hasRole('ROLE_USER')")
    @Operation(
        summary = "Obtiene solo las estadísticas de inscripciones del usuario",
        description = "Retorna estadísticas específicas de inscripciones como totales, activas, completadas, etc."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadísticas de inscripciones obtenidas exitosamente"),
        @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario no autorizado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<UserStatsResponse.InscriptionStats> getInscriptionStats() {
        
        try {
            Long userId = getCurrentUserId();
            log.info("Obteniendo estadísticas de inscripciones para usuario {}", userId);
            
            UserStatsResponse.InscriptionStats inscriptionStats = getUserStatsUseCase.getInscriptionStats(userId);
            
            log.info("Estadísticas de inscripciones obtenidas exitosamente para usuario {}", userId);
            return ResponseEntity.ok(inscriptionStats);
            
        } catch (Exception e) {
            log.error("Error obteniendo estadísticas de inscripciones del usuario: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Obtiene el ID del usuario actual desde el contexto de seguridad
     */
    private Long getCurrentUserId() {
        try {
            UUID userId = securityService.getCurrentUserId();
            // Convertir UUID a Long para compatibilidad
            // En una implementación real, deberíamos usar UUID directamente
            return userId.hashCode() & 0x7fffffffL; // Convertir a Long positivo
        } catch (Exception e) {
            log.error("Error obteniendo ID del usuario actual: {}", e.getMessage());
            throw new RuntimeException("Usuario no autenticado", e);
        }
    }
    
    /**
     * Valida si el tipo de vencimiento es válido
     */
    private boolean isValidDeadlineType(String type) {
        try {
            String upperType = type.toUpperCase();
            return upperType.equals("INSCRIPTION") || 
                   upperType.equals("DOCUMENTS") || 
                   upperType.equals("EXAM") || 
                   upperType.equals("RESULT");
        } catch (Exception e) {
            return false;
        }
    }
}
