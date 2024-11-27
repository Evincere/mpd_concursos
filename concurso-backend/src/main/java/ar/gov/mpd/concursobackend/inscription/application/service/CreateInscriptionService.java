package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateInscriptionService implements CreateInscriptionUseCase {
    private final SaveInscriptionPort saveInscriptionPort;
    private final InscriptionMapper inscriptionMapper;

    @Override
    public InscriptionResponse createInscription(InscriptionRequest request) {
        Inscription inscription = Inscription.builder()
                .contestId(new ContestId(request.getContestId()))
                .userId(new UserId(request.getUserId()))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(LocalDateTime.now())
                .build();
        
        Inscription savedInscription = saveInscriptionPort.save(inscription);
        
        return inscriptionMapper.toResponse(savedInscription);
    }
} 