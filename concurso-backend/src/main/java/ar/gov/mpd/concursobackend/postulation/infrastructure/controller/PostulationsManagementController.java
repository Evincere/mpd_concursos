package ar.gov.mpd.concursobackend.postulation.infrastructure.controller;

import ar.gov.mpd.concursobackend.postulation.application.PostulationsManagementService;
import ar.gov.mpd.concursobackend.postulation.infrastructure.dto.PostulationManagementResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
}
