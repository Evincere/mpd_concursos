package ar.gov.mpd.concursobackend.inscription.domain.port;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

public interface InscriptionRepository {
    Inscription save(Inscription inscription);
    Optional<Inscription> findById(UUID id);
    List<Inscription> findByUserId(UUID userId);
    boolean existsByUserIdAndContestId(UUID userId, Long contestId);
    List<Inscription> findByContestId(Long contestId);
} 