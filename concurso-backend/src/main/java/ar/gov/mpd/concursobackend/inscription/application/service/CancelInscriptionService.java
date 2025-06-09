package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
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

                if (id == null) {
                        log.error("ID de inscripción nulo");
                        throw new IllegalArgumentException("El ID de inscripción no puede ser nulo");
                }

                try {
                        var inscription = inscriptionRepository.findById(id)
                                        .orElseThrow(() -> {
                                                log.error("No se encontró la inscripción con ID: {}. Entity null", id);
                                                return new IllegalArgumentException(String
                                                                .format("Inscripción no encontrada con id: %s", id));
                                        });

                        log.debug("Inscripción encontrada: {}", inscription);
                        log.debug("Estado actual de la inscripción: {}", inscription.getState());

                        // Verificar si la inscripción ya está cancelada
                        if (inscription.getState() != null && inscription.getState().toString().equals("CANCELLED")) {
                                log.info("La inscripción {} ya está cancelada, no se requiere acción adicional", id);
                                return;
                        }

                        try {
                                inscription.cancel();
                                inscriptionRepository.save(inscription);
                                log.debug("Inscripción cancelada exitosamente: {}", id);
                        } catch (Exception e) {
                                log.error("Error al cancelar la inscripción en la base de datos: {}", e.getMessage(), e);
                                throw new RuntimeException("Error al guardar la inscripción cancelada", e);
                        }

                        try {
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
                                                                contest.getLocation() != null ? contest.getLocation() : "No especificado",
                                                                contest.getDependency()))
                                                .type(NotificationType.INSCRIPTION)
                                                .acknowledgementLevel(AcknowledgementLevel.NONE)
                                                .build();

                                log.debug("Enviando notificación de cancelación a usuario: {}", user.getUsername().value());
                                notificationService.sendNotification(notificationRequest);
                                log.debug("Notificación enviada exitosamente");
                        } catch (Exception e) {
                                // Si hay un error al enviar la notificación, lo registramos pero no interrumpimos el proceso
                                // La inscripción ya fue cancelada en la base de datos
                                log.warn("Error al enviar notificación de cancelación: {}", e.getMessage(), e);
                        }

                } catch (IllegalArgumentException e) {
                        log.error("Error de validación al cancelar la inscripción: {}", e.getMessage());
                        throw e;
                } catch (IllegalStateException e) {
                        log.error("Error de estado al cancelar la inscripción: {}", e.getMessage());
                        throw e;
                } catch (Exception e) {
                        log.error("Error inesperado al cancelar la inscripción: {}", e.getMessage(), e);
                        throw new RuntimeException("Error al cancelar la inscripción: " + e.getMessage(), e);
                }
        }
}
