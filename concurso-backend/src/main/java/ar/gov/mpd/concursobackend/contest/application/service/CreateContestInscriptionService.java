package ar.gov.mpd.concursobackend.contest.application.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestInscriptionRequest;
import ar.gov.mpd.concursobackend.contest.application.port.in.CreateContestInscriptionUseCase;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateContestInscriptionService implements CreateContestInscriptionUseCase {

        private final ContestRepository contestRepository;
        private final IUserService userService;
        private final SaveInscriptionPort saveInscriptionPort;
        private final SendNotificationUseCase notificationService;

        @Override
        @Transactional
        public Inscription createInscription(ContestInscriptionRequest request) {
                log.debug("Iniciando creación de inscripción para el concurso: {}", request.getContestId());

                // Obtener el usuario autenticado
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = authentication.getName();
                log.debug("Usuario autenticado: {}", username);

                // Obtener el usuario
                User user = userService.getByUsername(new UserUsername(username))
                                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
                log.debug("Usuario encontrado: {}", user.getId().value());

                // Verificar que el concurso existe
                Contest contest = contestRepository.findById(request.getContestId())
                                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));
                log.debug("Concurso encontrado: {}", contest.getTitle());

                // Verificar que el concurso está publicado
                if (!contest.getStatus().equals("PUBLISHED")) {
                        throw new IllegalStateException("El concurso no está disponible para inscripciones");
                }

                // Crear la inscripción
                Inscription inscription = Inscription.builder()
                                .id(new InscriptionId(UUID.randomUUID()))
                                .contestId(new ContestId(contest.getId()))
                                .userId(new UserId(user.getId().value()))
                                .inscriptionDate(LocalDateTime.now())
                                .status(InscriptionStatus.PENDING)
                                .build();

                // Guardar la inscripción
                Inscription savedInscription = saveInscriptionPort.save(inscription);
                log.debug("Inscripción guardada con ID: {}", savedInscription.getId());

                // Enviar notificación
                NotificationRequest notificationRequest = NotificationRequest.builder()
                                .recipientUsername(user.getUsername().value())
                                .subject("Inscripción a Concurso - " + contest.getTitle())
                                .content(String.format(
                                                "Tu inscripción al concurso '%s' ha sido registrada con éxito.\n\n" +
                                                                "Detalles del concurso:\n" +
                                                                "- Cargo: %s\n" +
                                                                "- Dependencia: %s\n\n" +
                                                                "Estado actual: PENDIENTE\n" +
                                                                "Te notificaremos cuando tu inscripción sea revisada.",
                                                contest.getTitle(),
                                                contest.getPosition(),
                                                contest.getDependency()))
                                .type(NotificationType.INSCRIPTION)
                                .acknowledgementLevel(AcknowledgementLevel.NONE)
                                .build();

                log.debug("Enviando notificación para la inscripción: {}", notificationRequest);
                var notification = notificationService.sendNotification(notificationRequest);
                log.debug("Notificación enviada: {}", notification);

                return savedInscription;
        }
}
