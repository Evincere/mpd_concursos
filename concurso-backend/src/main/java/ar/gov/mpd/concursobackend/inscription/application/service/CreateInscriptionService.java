package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateInscriptionService implements CreateInscriptionUseCase {
    private final SaveInscriptionPort saveInscriptionPort;
    private final InscriptionMapper inscriptionMapper;
    private static final Logger log = LoggerFactory.getLogger(CreateInscriptionService.class);

    @Override
    public InscriptionDetailResponse createInscription(InscriptionRequest request) {
        LocalDateTime now = LocalDateTime.now();
        
        Inscription inscription = Inscription.builder()
            .id(new InscriptionId())
            .contestId(new ContestId(request.getContestId()))
            .userId(new UserId(request.getUserId()))
            .status(InscriptionStatus.PENDING)
            .createdAt(now)
            .inscriptionDate(now)
            .build();

        log.debug("Creando inscripción con ID: {}", inscription.getId().getValue());
        Inscription savedInscription = saveInscriptionPort.save(inscription);
        log.debug("Inscripción guardada con ID: {}", savedInscription.getId().getValue());

        return inscriptionMapper.toDetailResponse(savedInscription, null);
    }
} 