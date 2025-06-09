package ar.gov.mpd.concursobackend.inscription.application.port.out;

import java.util.UUID;
import java.util.Optional;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface LoadInscriptionPort {
    Page<Inscription> findAll(PageRequest pageRequest);

    Page<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest);

    Optional<Inscription> findById(UUID id);

    Optional<Inscription> findByContestIdAndUserId(Long contestId, UUID userId);

    /**
     * Finds an inscription by contest ID and user ID, including cancelled inscriptions
     * This method is used when we need to check for any existing inscription regardless of status
     */
    Optional<Inscription> findByContestIdAndUserIdIncludingCancelled(Long contestId, UUID userId);
}