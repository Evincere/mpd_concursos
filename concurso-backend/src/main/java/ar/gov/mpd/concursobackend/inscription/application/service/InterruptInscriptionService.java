package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.port.in.InterruptInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class InterruptInscriptionService implements InterruptInscriptionUseCase {

    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final IUserService userService;
    private final SendNotificationUseCase notificationService;

    @Override
    public void markAsInterrupted(UUID id) {
        log.debug("Marcando inscripción como interrumpida: {}", id);

        try {
            // Obtener la inscripción
            Inscription inscription = inscriptionRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));

            // Obtener el concurso
            Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

            // Obtener el usuario
            User user = userService.getById(inscription.getUserId().getValue())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

            // Enviar notificación al usuario
            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .recipientUsername(user.getUsername().value())
                    .subject("Inscripción en Proceso - " + contest.getTitle())
                    .content(String.format(
                            "Has interrumpido el proceso de inscripción al concurso '%s'.\n\n" +
                                    "Detalles del concurso:\n" +
                                    "- Cargo: %s\n" +
                                    "- Dependencia: %s\n\n" +
                                    "Tu inscripción está en estado 'En Proceso'. Puedes retomar la inscripción " +
                                    "desde la sección 'Mis Postulaciones' o desde la tarjeta del concurso.",
                            contest.getTitle(),
                            contest.getPosition(),
                            contest.getDependency()))
                    .type(NotificationType.INSCRIPTION)
                    .acknowledgementLevel(AcknowledgementLevel.NONE)
                    .build();

            notificationService.sendNotification(notificationRequest);
            log.info("Notificación enviada al usuario sobre inscripción interrumpida: {}", id);

        } catch (Exception e) {
            log.error("Error al marcar inscripción como interrumpida: {}", e.getMessage(), e);
            throw new RuntimeException("Error al marcar inscripción como interrumpida: " + e.getMessage(), e);
        }
    }
}
