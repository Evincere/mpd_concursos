package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CancelInscriptionService implements CancelInscriptionUseCase {
    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final SendNotificationUseCase notificationService;
    private final IUserService userService;

    @Override
    public void cancel(UUID id) {
        log.debug("Intentando cancelar inscripción con ID: {}", id);

        var inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("No se encontró la inscripción con ID: {}. Entity null", id);
                    return new IllegalArgumentException("Inscripción no encontrada");
                });

        log.debug("Inscripción encontrada: {}", inscription);

        try {
            inscription.cancel();
            inscriptionRepository.save(inscription);
            log.debug("Inscripción cancelada exitosamente: {}", id);

            // Obtener información del concurso
            Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

            // Obtener información del usuario
            User user = userService.getByUsername(new UserUsername(inscription.getUserId().getValue().toString()))
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

            // Enviar notificación
            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .recipientUsername(user.getUsername().value())
                    .subject("Postulación Cancelada - " + contest.getTitle())
                    .content(String.format(
                            "Tu postulación al concurso '%s' ha sido cancelada.\n\n" +
                                    "Detalles del concurso:\n" +
                                    "- Cargo: %s\n" +
                                    "- Dependencia: %s",
                            contest.getTitle(),
                            contest.getPosition(),
                            contest.getDependency()))
                    .type(NotificationType.INSCRIPTION)
                    .acknowledgementLevel(AcknowledgementLevel.NONE)
                    .build();

            notificationService.sendNotification(notificationRequest);

        } catch (Exception e) {
            log.error("Error al cancelar la inscripción: {}", e.getMessage(), e);
            throw new RuntimeException("Error al cancelar la inscripción: " + e.getMessage());
        }
    }
}
