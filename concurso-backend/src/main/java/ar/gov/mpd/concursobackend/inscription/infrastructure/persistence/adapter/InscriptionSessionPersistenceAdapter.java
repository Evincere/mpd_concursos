package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.adapter;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionSessionRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionSessionEntityMapper;
// import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository.InscriptionSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Adaptador de persistencia para sesiones de inscripción
 * TEMPORALMENTE DESHABILITADO PARA DEBUGGING
 */
// @Component
@RequiredArgsConstructor
public class InscriptionSessionPersistenceAdapter implements InscriptionSessionRepository {
    // private final InscriptionSessionJpaRepository repository;
    // private final InscriptionSessionEntityMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(InscriptionSessionPersistenceAdapter.class);



    @Override
    public InscriptionSession save(InscriptionSession session) {
        // TEMPORALMENTE DESHABILITADO
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public Optional<InscriptionSession> findById(InscriptionSessionId id) {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public Optional<InscriptionSession> findByInscriptionId(InscriptionId inscriptionId) {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public List<InscriptionSession> findByUserId(UserId userId) {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public Optional<InscriptionSession> findByUserIdAndContestId(UserId userId, ContestId contestId) {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public void deleteById(InscriptionSessionId id) {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }

    @Override
    public int deleteExpiredSessions() {
        throw new UnsupportedOperationException("Método temporalmente deshabilitado");
    }
}
