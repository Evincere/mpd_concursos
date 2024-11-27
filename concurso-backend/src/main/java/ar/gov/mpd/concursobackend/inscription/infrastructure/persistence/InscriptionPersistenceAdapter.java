package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence;

import ar.gov.mpd.concursobackend.inscription.application.port.out.FindInscriptionsPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InscriptionPersistenceAdapter implements SaveInscriptionPort, FindInscriptionsPort {
    
    private final InscriptionJpaRepository repository;
    private final InscriptionEntityMapper mapper;

    @Override
    public Inscription save(Inscription inscription) {
        var entity = mapper.toEntity(inscription);
        var savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public PageResponse<Inscription> findAll(PageRequest pageRequest) {
        var direction = Sort.Direction.fromString(pageRequest.getSortDirection().toUpperCase());
        var pageable = org.springframework.data.domain.PageRequest.of(
            pageRequest.getPage(),
            pageRequest.getSize(),
            Sort.by(direction, pageRequest.getSortBy())
        );

        var page = repository.findAll(pageable);
        var inscriptions = page.getContent().stream()
            .map(mapper::toDomain)
            .toList();

        return new PageResponse<>(
            inscriptions,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast()
        );
    }
} 