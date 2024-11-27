package ar.gov.mpd.concursobackend.inscription.application.port.out;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;

public interface FindInscriptionsPort {
    PageResponse<Inscription> findAll(PageRequest pageRequest);
} 