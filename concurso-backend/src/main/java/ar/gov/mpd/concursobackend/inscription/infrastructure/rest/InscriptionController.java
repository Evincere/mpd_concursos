package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class InscriptionController {
    private final CreateInscriptionUseCase createInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;

    @PostMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> createInscription(@RequestBody InscriptionRequest request) {
        return ResponseEntity.ok(createInscriptionUseCase.createInscription(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<PageResponse<InscriptionDetailResponse>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        return ResponseEntity.ok(findInscriptionsUseCase.findAll(
                new PageRequest(page, size, sortBy, sortDirection)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(findInscriptionsUseCase.findById(id));
    }

    @GetMapping("/estado/{concursoId}/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionStatus> getInscriptionStatus(
            @PathVariable Long concursoId,
            @PathVariable String userId) {
        try {
            InscriptionStatus status = findInscriptionsUseCase.findInscriptionStatus(concursoId, userId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}