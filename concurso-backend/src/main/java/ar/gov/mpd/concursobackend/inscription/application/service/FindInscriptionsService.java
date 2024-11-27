package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.FindInscriptionsPort;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FindInscriptionsService implements FindInscriptionsUseCase {
    
    private final FindInscriptionsPort findInscriptionsPort;
    private final InscriptionMapper inscriptionMapper;

    @Override
    public PageResponse<InscriptionResponse> findAll(PageRequest pageRequest) {
        var inscriptionsPage = findInscriptionsPort.findAll(pageRequest);
        var inscriptionResponses = inscriptionsPage.getContent()
            .stream()
            .map(inscriptionMapper::toResponse)
            .toList();

        return new PageResponse<>(
            inscriptionResponses,
            inscriptionsPage.getPageNumber(),
            inscriptionsPage.getPageSize(),
            inscriptionsPage.getTotalElements(),
            inscriptionsPage.getTotalPages(),
            inscriptionsPage.isLast()
        );
    }
} 