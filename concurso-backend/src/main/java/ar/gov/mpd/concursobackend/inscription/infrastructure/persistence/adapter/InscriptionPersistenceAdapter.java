package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.adapter;

import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository.InscriptionJpaRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class InscriptionPersistenceAdapter implements LoadInscriptionPort, SaveInscriptionPort {
    private final InscriptionJpaRepository repository;
    private final InscriptionEntityMapper mapper;

    @Override
    public Page<Inscription> findAllByUserId(UUID userId, org.springframework.data.domain.PageRequest pageRequest) {
        var page = repository.findAllByUserId(userId, pageRequest);
        return page.map(mapper::toDomain);
    }

    @Override
    public Page<Inscription> findAll(org.springframework.data.domain.PageRequest pageRequest) {
        var page = repository.findAll(pageRequest);
        return page.map(mapper::toDomain);
    }

    @Override
    public Inscription save(Inscription inscription) {
        var entity = mapper.toEntity(inscription);
        var savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Inscription> findById(Long id) {
        // Convertir el ID a String y luego a UUID de manera segura
        try {
            UUID uuid = UUID.fromString(id.toString());
            return repository.findById(uuid)
                    .map(mapper::toDomain);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Inscription> findByContestIdAndUserId(Long contestId, UUID userId) {
        return repository.findByContestIdAndUserIdAndStatusNot(contestId, userId, InscriptionStatus.CANCELLED)
                .map(mapper::toDomain);
    }
}