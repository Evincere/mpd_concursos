package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CancelInscriptionService implements CancelInscriptionUseCase {
    private final InscriptionRepository inscriptionRepository;

    @Override
    public void cancel(UUID id) {
        log.debug("Intentando cancelar inscripción con ID: {}", id);

        var inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("No se encontró la inscripción con ID: {}. Entity null", id);
                    return new IllegalArgumentException("Inscripción no encontrada");
                });

        log.debug("Inscripción encontrada: {}", inscription);

        try {
            inscription.cancel();
            inscriptionRepository.save(inscription);
            log.debug("Inscripción cancelada exitosamente: {}", id);
        } catch (Exception e) {
            log.error("Error al cancelar la inscripción: {}", e.getMessage(), e);
            throw new RuntimeException("Error al cancelar la inscripción: " + e.getMessage());
        }
    }
}
