package ar.gov.mpd.concursobackend.inscription.application.service;

import java.util.stream.Collectors;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FindInscriptionsService implements FindInscriptionsUseCase {
    private final LoadInscriptionPort loadInscriptionPort;
    private final ContestRepository contestRepository;
    private final InscriptionMapper inscriptionMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InscriptionDetailResponse> findAll(PageRequest pageRequest) {
        PageResponse<Inscription> inscriptions = loadInscriptionPort.findAll(pageRequest);
        
        List<InscriptionDetailResponse> detailResponses = inscriptions.getContent().stream()
            .map(inscription -> {
                Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElse(null);
                
                // Log para ver el status de cada inscripción
                System.out.println("Inscription Status: " + inscription.getStatus());
                
                return inscriptionMapper.toDetailResponse(inscription, contest);
            })
            .collect(Collectors.toList());

        return new PageResponse<>(
            detailResponses,
            inscriptions.getPageNumber(),
            inscriptions.getPageSize(),
            inscriptions.getTotalElements(),
            inscriptions.getTotalPages(),
            inscriptions.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public InscriptionDetailResponse findById(Long id) {
        Inscription inscription = loadInscriptionPort.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Inscription not found with id: " + id));
        
        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
            .orElse(null);
        
        return inscriptionMapper.toDetailResponse(inscription, contest);
    }
}