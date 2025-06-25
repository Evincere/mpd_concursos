package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.InterruptInscriptionUseCase;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for handling interrupted inscriptions
 */
@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
@Slf4j
public class InscriptionInterruptController {
    private final InterruptInscriptionUseCase interruptInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;
    private final SecurityUtils securityUtils;

    /**
     * Endpoint for marking an inscription as interrupted
     *
     * @param id The inscription ID
     * @return ResponseEntity with no content
     */
    @PostMapping("/{id}/interrupt")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> markAsInterrupted(@PathVariable UUID id) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            log.error("No se encontró el usuario autenticado");
            return ResponseEntity.badRequest().build();
        }

        // Verificar que la inscripción pertenece al usuario actual
        try {
            InscriptionDetailResponse inscription = findInscriptionsUseCase.findById(id);
            if (!inscription.getUserId().toString().equals(currentUserId)) {
                log.error("El usuario {} intentó marcar como interrumpida una inscripción que no le pertenece: {}",
                        currentUserId, id);
                return ResponseEntity.notFound().build();
            }

            // Marcar como interrumpida
            interruptInscriptionUseCase.markAsInterrupted(id);
            log.info("Usuario {} marcó su inscripción {} como interrumpida", currentUserId, id);

            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error de validación al marcar inscripción como interrumpida: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
