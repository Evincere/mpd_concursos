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
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
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
        private final SecurityUtils securityUtils;

        @Override
        public void cancel(UUID id) {
                log.debug("Iniciando proceso de cancelación de inscripción con ID: {}", id);

                try {
                        var inscription = inscriptionRepository.findById(id)
                                        .orElseThrow(() -> {
                                                log.error("No se encontró la inscripción con ID: {}. Entity null", id);
                                                return new IllegalArgumentException(String
                                                                .format("Inscripción no encontrada con id: %s", id));
                                        });

                        log.debug("Inscripción encontrada: {}", inscription);
                        log.debug("Estado actual de la inscripción: {}", inscription.getStatus());

                        inscription.cancel();
                        inscriptionRepository.save(inscription);
                        log.debug("Inscripción cancelada exitosamente: {}", id);

                        // Obtener información del concurso
                        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                                        .orElseThrow(() -> {
                                                log.error("No se encontró el concurso con ID: {}",
                                                                inscription.getContestId().getValue());
                                                return new IllegalArgumentException("Concurso no encontrado");
                                        });

                        log.debug("Concurso encontrado: {}", contest.getTitle());

                        // Obtener el username del usuario autenticado
                        String username = securityUtils.getCurrentUsername();
                        log.debug("Username del usuario autenticado: {}", username);

                        // Obtener información del usuario
                        User user = userService.getByUsername(new UserUsername(username))
                                        .orElseThrow(() -> {
                                                log.error("No se encontró el usuario con username: {}", username);
                                                return new IllegalArgumentException("Usuario no encontrado");
                                        });

                        log.debug("Usuario encontrado: {}", user.getUsername().value());

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

                        log.debug("Enviando notificación de cancelación a usuario: {}", user.getUsername().value());
                        notificationService.sendNotification(notificationRequest);
                        log.debug("Notificación enviada exitosamente");

                } catch (IllegalArgumentException e) {
                        log.error("Error de validación al cancelar la inscripción: {}", e.getMessage());
                        throw e;
                } catch (Exception e) {
                        log.error("Error inesperado al cancelar la inscripción: {}", e.getMessage(), e);
                        throw new RuntimeException("Error al cancelar la inscripción: " + e.getMessage(), e);
                }
        }
}
