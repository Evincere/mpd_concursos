package ar.gov.mpd.concursobackend.postulation.infrastructure.controller;

import ar.gov.mpd.concursobackend.postulation.application.PostulationsManagementService;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Set;
import ar.gov.mpd.concursobackend.postulation.infrastructure.dto.PostulationManagementResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ar.gov.mpd.concursobackend.postulation.infrastructure.dto.PostulationDTO;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/postulations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Postulations Management", description = "Endpoints para la gestión del dashboard de postulaciones")
public class PostulationsManagementController {

    private final PostulationsManagementService postulationsManagementService;

    @GetMapping("/management")
    @Operation(summary = "Obtiene todas las postulaciones para el dashboard de gestión")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PostulationManagementResponseDTO> getPostulationsManagement() {
        try {
            log.debug("🎯 [PostulationsManagementController] Iniciando obtención de postulaciones para dashboard");
            
            PostulationManagementResponseDTO response = postulationsManagementService.getAllPostulations();
            
            log.debug("✅ [PostulationsManagementController] Postulaciones obtenidas exitosamente. Success: {}, Total: {}",
                     response.isSuccess(), 
                     response.getPostulations() != null ? response.getPostulations().size() : 0);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                log.error("❌ [PostulationsManagementController] Error en servicio: {}", response.getMessage());
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("💥 [PostulationsManagementController] Error inesperado: {}", e.getMessage(), e);
            
            PostulationManagementResponseDTO errorResponse = new PostulationManagementResponseDTO(
                    false,
                    null,
                    null,
                    "Error inesperado al obtener postulaciones: " + e.getMessage()
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    @GetMapping("/next-postulation")
    @Operation(summary = "Obtiene la próxima postulación disponible para validación")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getNextPostulation(
            @RequestParam(required = false) String currentDni,
            @RequestParam(defaultValue = "APPROVED,REJECTED") String excludeStates) {
        try {
            log.debug("🔄 [PostulationsManagementController] Obteniendo próxima postulación - currentDni: {}, excludeStates: {}", 
                     currentDni, excludeStates);
            
            // Obtener todas las postulaciones
            PostulationManagementResponseDTO allPostulations = postulationsManagementService.getAllPostulations();
            
            if (!allPostulations.isSuccess() || allPostulations.getPostulations() == null) {
                log.error("❌ [PostulationsManagementController] Error al obtener postulaciones: {}", 
                         allPostulations.getMessage());
                return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", allPostulations.getMessage()));
            }
            
            // Filtrar postulaciones válidas para validación
            Set<String> excludeStateSet = Set.of(excludeStates.split(","));
            log.debug("📋 [PostulationsManagementController] Estados excluidos: {}", excludeStateSet);
            
            List<PostulationDTO> validPostulations = allPostulations.getPostulations().stream()
                .filter(p -> {
                    boolean hasValidInfo = p.getUser() != null && 
                                         p.getUser().getDni() != null && 
                                         !p.getUser().getDni().trim().isEmpty() &&
                                         p.getUser().getFullName() != null && 
                                         !p.getUser().getFullName().trim().isEmpty();
                    
                    boolean isNotCurrent = currentDni == null || !currentDni.equals(p.getUser().getDni());
                    
                    boolean needsValidation = p.getInscription() != null &&
                                            (p.getInscription().getState().equals("COMPLETED_WITH_DOCS") ||
                                             p.getInscription().getState().equals("PENDING")) &&
                                            !excludeStateSet.contains(p.getInscription().getState());
                    
                    log.debug("📝 [PostulationsManagementController] Evaluando postulante {}: hasValidInfo={}, isNotCurrent={}, needsValidation={}, state={}", 
                             p.getUser() != null ? p.getUser().getFullName() : "null", 
                             hasValidInfo, isNotCurrent, needsValidation,
                             p.getInscription() != null ? p.getInscription().getState() : "null");
                    
                    return hasValidInfo && isNotCurrent && needsValidation;
                })
                .sorted((a, b) -> {
                    String nameA = a.getUser().getFullName().toLowerCase();
                    String nameB = b.getUser().getFullName().toLowerCase();
                    return nameA.compareTo(nameB);
                })
                .collect(Collectors.toList());
            
            log.debug("🔍 [PostulationsManagementController] Postulaciones válidas encontradas: {}", validPostulations.size());
            
            if (validPostulations.isEmpty()) {
                log.debug("🎉 [PostulationsManagementController] No hay más postulaciones pendientes");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", (Object) null,
                    "message", "No hay más postulaciones pendientes de validación"
                ));
            }
            
            // Retornar la primera postulación disponible
            PostulationDTO nextPostulation = validPostulations.get(0);
            
            log.debug("✅ [PostulationsManagementController] Próxima postulación: {} ({})", 
                     nextPostulation.getUser().getFullName(), nextPostulation.getUser().getDni());
            
            Map<String, Object> responseData = Map.of(
                "dni", nextPostulation.getUser().getDni(),
                "fullName", nextPostulation.getUser().getFullName(),
                "state", nextPostulation.getInscription().getState(),
                "totalPending", validPostulations.size()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", responseData
            ));
            
        } catch (Exception e) {
            log.error("💥 [PostulationsManagementController] Error inesperado en next-postulation: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "error", "Error al obtener próxima postulación: " + e.getMessage()));
        }
    }
}
