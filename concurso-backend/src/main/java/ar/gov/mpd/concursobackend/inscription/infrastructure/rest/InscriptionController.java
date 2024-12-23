package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class InscriptionController {
    private final CreateInscriptionUseCase createInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;
    private final CancelInscriptionUseCase cancelInscriptionUseCase;

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
    public ResponseEntity<Boolean> getInscriptionStatus(
            @PathVariable Long concursoId,
            @PathVariable String userId) {
        try {
            Boolean inscripto = findInscriptionsUseCase.findInscriptionStatus(concursoId, userId);
            return ResponseEntity.ok(inscripto);
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/verificar/{concursoId}/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Boolean> verificarInscripcion(
            @PathVariable Long concursoId,
            @PathVariable String userId) {
        try {
            Boolean inscripto = findInscriptionsUseCase.findInscriptionStatus(concursoId, userId) != null;
            return ResponseEntity.ok(inscripto);
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> cancelInscription(@PathVariable Long id) {
        try {
            cancelInscriptionUseCase.cancel(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}