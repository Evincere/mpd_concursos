package ar.gov.mpd.concursobackend.inscription.application.port.out;

import java.util.UUID;
import java.util.Optional;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;

public interface LoadInscriptionPort {
    PageResponse<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest);
    PageResponse<Inscription> findAll(PageRequest pageRequest);
    Optional<Inscription> findById(Long id);
    Optional<Inscription> findByContestIdAndUserId(Long contestId, UUID userId);
}