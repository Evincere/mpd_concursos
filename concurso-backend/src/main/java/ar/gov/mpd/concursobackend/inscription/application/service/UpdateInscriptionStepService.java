package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.UpdateInscriptionStepRequest;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStepUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UpdateInscriptionStepService implements UpdateInscriptionStepUseCase {
    
    private final InscriptionRepository inscriptionRepository;

    @Override
    public Inscription updateStep(UUID inscriptionId, UpdateInscriptionStepRequest request) {
        log.debug("Actualizando paso de inscripción {} con datos: {}", inscriptionId, request);

        var inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));

        // Actualizar el paso actual
        inscription.updateStep(request.getStep());

        // Crear y actualizar preferencias si se proporcionaron datos
        if (hasPreferencesData(request)) {
            var preferences = InscriptionPreferences.builder()
                    .selectedCircunscripciones(request.getSelectedCircunscripciones())
                    .acceptedTerms(Boolean.TRUE.equals(request.getAcceptedTerms()))
                    .confirmedPersonalData(Boolean.TRUE.equals(request.getConfirmedPersonalData()))
                    .termsAcceptanceDate(request.getAcceptedTerms() ? LocalDateTime.now() : null)
                    .dataConfirmationDate(request.getConfirmedPersonalData() ? LocalDateTime.now() : null)
                    .build();

            inscription.updatePreferences(preferences);
        }

        log.debug("Guardando inscripción actualizada: {}", inscription);
        return inscriptionRepository.save(inscription);
    }

    private boolean hasPreferencesData(UpdateInscriptionStepRequest request) {
        return request.getSelectedCircunscripciones() != null ||
               request.getAcceptedTerms() != null ||
               request.getConfirmedPersonalData() != null;
    }
} 