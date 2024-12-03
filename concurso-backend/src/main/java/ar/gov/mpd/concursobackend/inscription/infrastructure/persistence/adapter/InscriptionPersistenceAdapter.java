package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.adapter;

import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository.InscriptionJpaRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class InscriptionPersistenceAdapter implements LoadInscriptionPort, SaveInscriptionPort {
    private final InscriptionJpaRepository repository;
    private final InscriptionEntityMapper mapper;

    @Override
    public PageResponse<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest) {
        Pageable pageable = createPageable(pageRequest);
        var page = repository.findAllByUserId(userId, pageable);
        return createPageResponse(page);
    }

    @Override
    public PageResponse<Inscription> findAll(PageRequest pageRequest) {
        Pageable pageable = createPageable(pageRequest);
        var page = repository.findAll(pageable);
        return createPageResponse(page);
    }

    @Override
    public Inscription save(Inscription inscription) {
        var entity = mapper.toEntity(inscription);
        var savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Inscription> findById(Long id) {
        return repository.findById(id)
            .map(mapper::toDomain);
    }

    private Pageable createPageable(PageRequest pageRequest) {
        return org.springframework.data.domain.PageRequest.of(
            pageRequest.getPage(),
            pageRequest.getSize(),
            Sort.by(Sort.Direction.fromString(pageRequest.getSortDirection()), 
                   pageRequest.getSortBy())
        );
    }

    private PageResponse<Inscription> createPageResponse(org.springframework.data.domain.Page<InscriptionEntity> page) {
        return new PageResponse<>(
            page.getContent().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList()),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast()
        );
    }
}