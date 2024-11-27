package ar.gov.mpd.concursobackend.inscription.application.port.out;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;

public interface SaveInscriptionPort {
    Inscription save(Inscription inscription);
}
