package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class InscriptionController {
    private final CreateInscriptionUseCase createInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;
    private final CancelInscriptionUseCase cancelInscriptionUseCase;
    private static final Logger log = LoggerFactory.getLogger(InscriptionController.class);

    @PostMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> createInscription(@RequestBody InscriptionRequest request) {
        // Log de la petición recibida
        System.out.println("[InscriptionController] Recibida petición de inscripción: " + request);
        System.out.println("[InscriptionController] Detalles de la petición:");
        System.out.println("  - Contest ID: " + request.getContestId());
        System.out.println("  - Request completo: " + request.toString());

        // Procesar la inscripción
        try {
            InscriptionDetailResponse response = createInscriptionUseCase.createInscription(request);
            System.out.println("[InscriptionController] Inscripción creada exitosamente: " + response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[InscriptionController] Error al crear inscripción: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> findById(@PathVariable UUID id) {
        log.debug("Buscando inscripción con ID: {}", id);
        return ResponseEntity.ok(findInscriptionsUseCase.findById(id));
    }

    @GetMapping("/estado/{concursoId}/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Boolean> getInscriptionStatus(
            @PathVariable Long concursoId,
            @PathVariable String userId) {
        log.debug("Verificando estado de inscripción para concurso {} y usuario {}", concursoId, userId);
        try {
            Boolean inscripto = findInscriptionsUseCase.findInscriptionStatus(concursoId, userId);
            log.debug("Resultado de verificación de inscripción: {}", inscripto);
            return ResponseEntity.ok(inscripto);
        } catch (IllegalArgumentException e) {
            log.error("Error de validación al verificar inscripción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error al verificar inscripción: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/verificar/{concursoId}/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Boolean> verificarInscripcion(
            @PathVariable Long concursoId,
            @PathVariable String userId) {
        log.debug("Verificando inscripción para concurso {} y usuario {}", concursoId, userId);
        try {
            Boolean inscripto = findInscriptionsUseCase.findInscriptionStatus(concursoId, userId);
            log.debug("Resultado de verificación de inscripción: {}", inscripto);
            return ResponseEntity.ok(inscripto);
        } catch (IllegalArgumentException e) {
            log.error("Error de validación al verificar inscripción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error al verificar inscripción: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> cancelInscription(@PathVariable UUID id) {
        log.debug("Cancelando inscripción con ID: {}", id);
        cancelInscriptionUseCase.cancel(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<InscriptionResponse>> getInscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam String userId) {
        var pageRequest = org.springframework.data.domain.PageRequest.of(
                page,
                size,
                Sort.Direction.valueOf(direction),
                sort);
        UUID userUUID = UUID.fromString(userId);
        return ResponseEntity.ok(findInscriptionsUseCase.findAllPaged(pageRequest, userUUID));
    }
}