package ar.gov.mpd.concursobackend.inscription.application.port.out;

import java.util.UUID;
import java.util.Optional;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface LoadInscriptionPort {
    Page<Inscription> findAll(PageRequest pageRequest);
    Page<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest);
    Optional<Inscription> findById(Long id);
    Optional<Inscription> findByContestIdAndUserId(Long contestId, UUID userId);
}