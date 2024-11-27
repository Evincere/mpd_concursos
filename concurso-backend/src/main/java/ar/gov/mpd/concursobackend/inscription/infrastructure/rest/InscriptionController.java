package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
public class InscriptionController {
    private final CreateInscriptionUseCase createInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;

    @PostMapping
    public ResponseEntity<InscriptionResponse> createInscription(@RequestBody InscriptionRequest request) {
        return ResponseEntity.ok(createInscriptionUseCase.createInscription(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<InscriptionResponse>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        var pageRequest = PageRequest.of(page, size, sortBy, sortDirection);
        var response = findInscriptionsUseCase.findAll(pageRequest);
        return ResponseEntity.ok(response);
    }
} 