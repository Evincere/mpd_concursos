package ar.gov.mpd.concursobackend.inscription.application.service;

import java.util.stream.Collectors;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FindInscriptionsService implements FindInscriptionsUseCase {
    private final LoadInscriptionPort loadInscriptionPort;
    private final ContestRepository contestRepository;
    private final InscriptionMapper inscriptionMapper;
    private static final Logger log = LoggerFactory.getLogger(FindInscriptionsService.class);

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InscriptionDetailResponse> findAll(ar.gov.mpd.concursobackend.shared.domain.model.PageRequest pageRequest) {
        log.debug("Buscando inscripciones con pageRequest: {}", pageRequest);
        
        var springPageRequest = org.springframework.data.domain.PageRequest.of(
            pageRequest.getPage(),
            pageRequest.getSize(),
            Sort.by(Sort.Direction.valueOf(pageRequest.getSortDirection().toUpperCase()), 
                    pageRequest.getSortBy())
        );
        
        var page = loadInscriptionPort.findAll(springPageRequest);
        log.debug("Inscripciones encontradas: {}", page.getContent());
        
        List<InscriptionDetailResponse> detailResponses = page.getContent().stream()
            .map(inscription -> {
                Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElse(null);
                return inscriptionMapper.toDetailResponse(inscription, contest);
            })
            .collect(Collectors.toList());
        
        return new PageResponse<>(
            detailResponses,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast()
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

    @Override
    public Boolean findInscriptionStatus(Long contestId, String userId) {
        try {
            log.debug("Verificando inscripción para concurso {} y usuario {}", contestId, userId);
            UUID userUUID = UUID.fromString(userId);
            
            // Verificar si existe una inscripción
            var inscripcionOpt = loadInscriptionPort.findByContestIdAndUserId(contestId, userUUID);
            
            if (inscripcionOpt.isPresent()) {
                var inscripcion = inscripcionOpt.get();
                log.debug("Se encontró una inscripción: {}", inscripcion);
                return true;
            }
            
            log.debug("No se encontró inscripción para el concurso {} y usuario {}", contestId, userId);
            return false;
            
        } catch (IllegalArgumentException e) {
            log.error("Error al convertir userId a UUID: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error al verificar inscripción: {}", e.getMessage());
            return false;
        }
    }
}