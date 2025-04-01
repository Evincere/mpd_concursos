package ar.gov.mpd.concursobackend.inscription.infrastructure.controller;

import ar.gov.mpd.concursobackend.inscription.application.dto.UpdateInscriptionStepRequest;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStepUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
@Slf4j
public class InscriptionStepController {

    private final UpdateInscriptionStepUseCase updateInscriptionStepUseCase;

    @PutMapping("/{inscriptionId}/step")
    public ResponseEntity<Inscription> updateStep(
            @PathVariable UUID inscriptionId,
            @RequestBody UpdateInscriptionStepRequest request) {
        log.debug("Recibida solicitud para actualizar paso de inscripción: {} con datos: {}", 
                inscriptionId, request);

        var updatedInscription = updateInscriptionStepUseCase.updateStep(inscriptionId, request);
        
        log.debug("Paso de inscripción actualizado exitosamente: {}", updatedInscription);
        return ResponseEntity.ok(updatedInscription);
    }
} 