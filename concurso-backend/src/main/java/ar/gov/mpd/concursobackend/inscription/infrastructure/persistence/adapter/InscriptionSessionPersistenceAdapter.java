package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.adapter;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionSessionRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionSessionEntityMapper;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository.InscriptionSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adaptador de persistencia para sesiones de inscripción
 */
@Component
@RequiredArgsConstructor
public class InscriptionSessionPersistenceAdapter implements InscriptionSessionRepository {
    private final InscriptionSessionJpaRepository repository;
    private final InscriptionSessionEntityMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(InscriptionSessionPersistenceAdapter.class);

    /**
     * Convierte un UUID a un array de bytes
     * @param uuid UUID a convertir
     * @return Array de bytes
     */
    private byte[] uuidToBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    @Override
    public InscriptionSession save(InscriptionSession session) {
        log.debug("Guardando sesión de inscripción con ID: {}", session.getId().getValue());
        var entity = mapper.toEntity(session);
        var savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<InscriptionSession> findById(InscriptionSessionId id) {
        log.debug("Buscando sesión de inscripción con ID: {}", id.getValue());
        return repository.findById(uuidToBytes(id.getValue()))
                .map(mapper::toDomain);
    }

    @Override
    public Optional<InscriptionSession> findByInscriptionId(InscriptionId inscriptionId) {
        log.debug("Buscando sesión por ID de inscripción: {}", inscriptionId.getValue());
        return repository.findByInscriptionId(uuidToBytes(inscriptionId.getValue()))
                .map(mapper::toDomain);
    }

    @Override
    public List<InscriptionSession> findByUserId(UserId userId) {
        log.debug("Buscando sesiones por ID de usuario: {}", userId.getValue());
        return repository.findByUserId(uuidToBytes(userId.getValue()))
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<InscriptionSession> findByUserIdAndContestId(UserId userId, ContestId contestId) {
        log.debug("Buscando sesión por ID de usuario: {} y ID de concurso: {}", userId.getValue(), contestId.getValue());
        return repository.findByUserIdAndContestId(uuidToBytes(userId.getValue()), contestId.getValue())
                .map(mapper::toDomain);
    }

    @Override
    public void deleteById(InscriptionSessionId id) {
        log.debug("Eliminando sesión de inscripción con ID: {}", id.getValue());
        repository.deleteById(uuidToBytes(id.getValue()));
    }

    @Override
    public int deleteExpiredSessions() {
        log.debug("Eliminando sesiones expiradas");
        return repository.deleteExpiredSessions(LocalDateTime.now());
    }
}
