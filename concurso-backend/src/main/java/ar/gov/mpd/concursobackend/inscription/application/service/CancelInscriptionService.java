package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CancelInscriptionService implements CancelInscriptionUseCase {
    private final LoadInscriptionPort loadInscriptionPort;
    private final SaveInscriptionPort saveInscriptionPort;

    @Override
    @Transactional
    public void cancel(Long inscriptionId) {
        Inscription inscription = loadInscriptionPort.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscripción no encontrada"));

        inscription.cancel();
        saveInscriptionPort.save(inscription);
    }
}
