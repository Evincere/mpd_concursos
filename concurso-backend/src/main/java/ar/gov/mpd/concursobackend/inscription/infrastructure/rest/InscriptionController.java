package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
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
    private final SecurityUtils securityUtils;
    private static final Logger log = LoggerFactory.getLogger(InscriptionController.class);

    @PostMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> createInscription(@RequestBody InscriptionRequest request) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }

        request.setUserId(UUID.fromString(currentUserId));
        log.debug("Creando inscripción para usuario {} en concurso {}", currentUserId, request.getContestId());

        InscriptionDetailResponse response = createInscriptionUseCase.createInscription(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Page<InscriptionResponse>> getMyInscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }

        var pageRequest = org.springframework.data.domain.PageRequest.of(
                page,
                size,
                Sort.Direction.valueOf(direction),
                sort);

        return ResponseEntity.ok(findInscriptionsUseCase.findAllPaged(pageRequest, UUID.fromString(currentUserId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> findById(@PathVariable UUID id) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }

        InscriptionDetailResponse inscription = findInscriptionsUseCase.findById(id);

        // Verificar que la inscripción pertenece al usuario actual
        if (!inscription.getUserId().toString().equals(currentUserId)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(inscription);
    }

    @GetMapping("/estado/{concursoId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Boolean> getInscriptionStatus(@PathVariable Long concursoId) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }

        try {
            Boolean inscripto = findInscriptionsUseCase.findInscriptionStatus(concursoId, currentUserId);
            return ResponseEntity.ok(inscripto);
        } catch (IllegalArgumentException e) {
            log.error("Error de validación al verificar inscripción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> cancelInscription(@PathVariable UUID id) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }

        // Verificar que la inscripción pertenece al usuario actual
        InscriptionDetailResponse inscription = findInscriptionsUseCase.findById(id);
        if (!inscription.getUserId().toString().equals(currentUserId)) {
            return ResponseEntity.notFound().build();
        }

        cancelInscriptionUseCase.cancel(id);
        return ResponseEntity.ok().build();
    }
}