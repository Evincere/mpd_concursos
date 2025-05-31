package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import ar.gov.mpd.concursobackend.inscription.domain.util.InscriptionStateConverter;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateInscriptionService implements CreateInscriptionUseCase {
        private final SaveInscriptionPort saveInscriptionPort;
        private final LoadInscriptionPort loadInscriptionPort;
        private final InscriptionMapper inscriptionMapper;
        private final ContestRepository contestRepository;
        private final SendNotificationUseCase notificationService;
        private final SecurityUtils securityUtils;
        private static final Logger log = LoggerFactory.getLogger(CreateInscriptionService.class);

        @Override
        public InscriptionDetailResponse createInscription(InscriptionRequest request) {
                log.debug("Iniciando creación de inscripción para concurso {} y usuario {}",
                                request.getContestId(), request.getUserId());

                // Verificar si ya existe una inscripción activa
                Optional<Inscription> existingInscription = loadInscriptionPort.findByContestIdAndUserId(
                                request.getContestId(),
                                request.getUserId());

                if (existingInscription.isPresent()) {
                        Inscription inscription = existingInscription.get();
                        if (InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.ACTIVE) ||
                                        InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.PENDING)) {
                                log.error("Ya existe una inscripción activa para el concurso {} y usuario {}",
                                                request.getContestId(), request.getUserId());
                                throw new IllegalStateException("Ya existe una inscripción activa para este concurso");
                        }
                }

                // Obtener el concurso
                Contest contest = contestRepository.findById(request.getContestId())
                                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

                LocalDateTime now = LocalDateTime.now();

                Inscription inscription = Inscription.builder()
                                .id(new InscriptionId())
                                .contestId(new ContestId(request.getContestId()))
                                .userId(new UserId(request.getUserId()))
                                .state(InscriptionStateConverter.toState(InscriptionStatus.ACTIVE))
                                .createdAt(now)
                                .inscriptionDate(now)
                                .build();

                log.debug("Creando inscripción con ID: {}", inscription.getId().getValue());
                Inscription savedInscription = saveInscriptionPort.save(inscription);
                log.debug("Inscripción guardada con ID: {}", savedInscription.getId().getValue());

                // Obtener el username del usuario autenticado
                String username = securityUtils.getCurrentUsername();
                if (username == null) {
                        throw new IllegalStateException("No se pudo obtener el username del usuario autenticado");
                }

                // No enviamos notificación al iniciar el proceso
                log.debug("Inscripción iniciada para el usuario {} en el concurso {} - No se envía notificación inicial",
                                username, contest.getTitle());

                return inscriptionMapper.toDetailResponse(savedInscription, null);
        }
}