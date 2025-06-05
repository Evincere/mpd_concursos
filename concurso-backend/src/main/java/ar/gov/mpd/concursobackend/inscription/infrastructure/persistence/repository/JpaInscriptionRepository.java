package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.ByteBuffer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;

@Repository
@RequiredArgsConstructor
public class JpaInscriptionRepository implements InscriptionRepository {

    private final SpringJpaInscriptionRepository repository;
    private final InscriptionEntityMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(JpaInscriptionRepository.class);

    private byte[] uuidToBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    @Override
    public Inscription save(Inscription inscription) {
        InscriptionEntity entity = mapper.toEntity(inscription);
        InscriptionEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Inscription> findById(UUID id) {
        return repository.findById(uuidToBytes(id)).map(mapper::toDomain);
    }

    @Override
    public List<Inscription> findByUserId(UUID userId) {
        return repository.findByUserId(uuidToBytes(userId)).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByUserIdAndContestId(UUID userId, Long contestId) {
        return repository.existsByUserIdAndContestId(uuidToBytes(userId), contestId);
    }

    @Override
    public List<Inscription> findByContestId(Long contestId) {
        return repository.findByContestId(contestId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Page<Inscription> findAll(org.springframework.data.domain.PageRequest pageRequest) {
        log.debug("Ejecutando findAll con pageRequest: {}", pageRequest);

        var result = repository.findAll(pageRequest);
        log.debug("Resultado de findAll: {}", result.getContent());

        return result.map(mapper::toDomain);
    }

    @Override
    public Page<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest) {
        return repository.findAllByUserId(uuidToBytes(userId), pageRequest).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(uuidToBytes(id));
    }

    @Override
    public boolean existsById(UUID id) {
        return repository.existsById(uuidToBytes(id));
    }

    @Override
    public Page<Inscription> findAllWithFilters(Long contestId, String search, InscriptionState state,
                                              LocalDate startDate, LocalDate endDate, String sort,
                                              org.springframework.data.domain.Pageable pageable) {
        // Implementación básica por ahora, se puede mejorar con consultas más específicas
        Page<InscriptionEntity> result = repository.findAll(pageable);
        return result.map(mapper::toDomain);
    }

    @Override
    public long countByContestIdAndState(Long contestId, InscriptionState state) {
        // Implementación básica por ahora
        return repository.findByContestId(contestId).stream()
                .filter(entity -> mapper.map(entity.getStatus()) == state)
                .count();
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public long countByState(InscriptionState state) {
        return repository.findAll().stream()
                .filter(entity -> mapper.map(entity.getStatus()) == state)
                .count();
    }

    @Override
    public List<Object[]> countByContest() {
        return repository.countByContest();
    }

    @Override
    public List<Object[]> countByDepartment() {
        return repository.countByDepartment();
    }

    @Override
    public Page<Inscription> findAll(Specification<Inscription> spec, PageRequest pageRequest) {
        // Convertir la especificación del dominio a una especificación de JPA
        Specification<InscriptionEntity> jpaSpec = (root, query, cb) -> {
            // Crear un nuevo root para la entidad JPA
            return spec.toPredicate(
                (Root<Inscription>)(Root<?>)root, 
                query, 
                cb
            );
        };
        
        // Ejecutar la consulta y mapear los resultados
        return repository.findAll(jpaSpec, pageRequest)
                .map(mapper::toDomain);
    }

    @Override
    public List<Inscription> findByStateAndDocumentationDeadlineBefore(InscriptionState state, LocalDateTime deadline) {
        InscriptionStatus status = mapper.map(state);
        return repository.findByStatusAndDocumentationDeadlineBefore(status, deadline)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}

interface SpringJpaInscriptionRepository extends JpaRepository<InscriptionEntity, byte[]>, JpaSpecificationExecutor<InscriptionEntity> {
    List<InscriptionEntity> findByUserId(byte[] userId);

    boolean existsByUserIdAndContestId(byte[] userId, Long contestId);

    List<InscriptionEntity> findByContestId(Long contestId);

    Page<InscriptionEntity> findAllByUserId(byte[] userId, PageRequest pageRequest);

    @Query(value = "SELECT c.title, COUNT(*) FROM inscriptions i " +
           "JOIN contests c ON i.contest_id = c.id " +
           "GROUP BY c.id, c.title", nativeQuery = true)
    List<Object[]> countByContest();

    @Query(value = "SELECT COALESCE(u.municipality, 'Sin especificar'), COUNT(*) FROM inscriptions i " +
           "JOIN user_entity u ON i.user_id = u.id " +
           "GROUP BY u.municipality", nativeQuery = true)
    List<Object[]> countByDepartment();

    List<InscriptionEntity> findByStatusAndDocumentationDeadlineBefore(InscriptionStatus status, LocalDateTime deadline);
}