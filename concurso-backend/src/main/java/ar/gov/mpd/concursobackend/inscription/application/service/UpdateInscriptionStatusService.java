package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStatusUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.util.InscriptionStateConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UpdateInscriptionStatusService implements UpdateInscriptionStatusUseCase {
    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final SendNotificationUseCase notificationService;
    private final IUserService userService;
    private final InscriptionNotificationService inscriptionNotificationService;

    @Override
    public void updateStatus(UUID id, String newStatus) {
        log.debug("Intentando actualizar estado de inscripción con ID: {} a estado: {}", id, newStatus);

        var inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("No se encontró la inscripción con ID: {}. Entity null", id);
                    return new IllegalArgumentException("Inscripción no encontrada");
                });

        log.debug("Inscripción encontrada: {}", inscription);

        try {
            // Validar y convertir el nuevo estado
            InscriptionStatus status;
            try {
                status = InscriptionStatus.valueOf(newStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.error("Estado de inscripción inválido: {}", newStatus);
                throw new IllegalArgumentException("Estado de inscripción inválido: " + newStatus);
            }

            // Actualizar el estado
            inscription = updateInscriptionStatus(inscription, status);
            inscriptionRepository.save(inscription);
            log.debug("Estado de inscripción actualizado exitosamente a {}: {}", status, id);

            // Obtener información del concurso
            Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

            // Send notifications based on the new status
            if (status == InscriptionStatus.PENDING) {
                // Notify administrators about pending inscription
                inscriptionNotificationService.notifyAdminsAboutPendingInscription(inscription, contest);
                log.info("Notification sent to administrators about pending inscription: {}", id);

                // Notify user about completed inscription
                User user = userService.getById(inscription.getUserId().getValue())
                        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                NotificationRequest completionRequest = NotificationRequest.builder()
                        .recipientUsername(user.getUsername().value())
                        .subject("Inscripción Completada - " + contest.getTitle())
                        .content(String.format(
                                "¡Felicitaciones! Has completado tu inscripción al concurso '%s'.\n\n" +
                                        "Detalles del concurso:\n" +
                                        "- Cargo: %s\n" +
                                        "- Dependencia: %s\n\n" +
                                        "Tu inscripción está ahora pendiente de validación por el equipo administrativo.\n" +
                                        "Te notificaremos cuando tu inscripción sea revisada.",
                                contest.getTitle(),
                                contest.getPosition(),
                                contest.getDependency()))
                        .type(NotificationType.INSCRIPTION)
                        .acknowledgementLevel(AcknowledgementLevel.NONE)
                        .build();

                notificationService.sendNotification(completionRequest);
                log.info("Notification sent to user about completed inscription: {}", id);

            } else if (status == InscriptionStatus.APPROVED || status == InscriptionStatus.REJECTED) {
                // Notify user about approved or rejected inscription
                inscriptionNotificationService.notifyUserAboutInscriptionStatusChange(inscription, contest);
                log.info("Notification sent to user about inscription status change to {}: {}", status, id);
            }

            // Para los estados ACTIVE, CANCELLED y otros que no tienen notificaciones específicas
            // enviamos una notificación general de cambio de estado
            if (status != InscriptionStatus.PENDING && status != InscriptionStatus.APPROVED && status != InscriptionStatus.REJECTED) {
                // Obtener información del usuario
                User user = userService.getById(inscription.getUserId().getValue())
                        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                // Enviar notificación
                NotificationRequest notificationRequest = NotificationRequest.builder()
                        .recipientUsername(user.getUsername().value())
                        .subject("Estado de Postulación Actualizado - " + contest.getTitle())
                        .content(String.format(
                                "El estado de tu postulación al concurso '%s' ha sido actualizado a %s.\n\n" +
                                        "Detalles del concurso:\n" +
                                        "- Cargo: %s\n" +
                                        "- Dependencia: %s",
                                contest.getTitle(),
                                status,
                                contest.getPosition(),
                                contest.getDependency()))
                        .type(NotificationType.INSCRIPTION)
                        .acknowledgementLevel(AcknowledgementLevel.NONE)
                        .build();

                notificationService.sendNotification(notificationRequest);
                log.info("General notification sent to user about inscription status change to {}: {}", status, id);
            }

        } catch (Exception e) {
            log.error("Error al actualizar el estado de la inscripción: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar el estado de la inscripción: " + e.getMessage());
        }
    }

    private Inscription updateInscriptionStatus(Inscription inscription, InscriptionStatus newStatus) {
        if (InscriptionStateConverter.equals(inscription.getState(), newStatus)) {
            log.debug("La inscripción ya tiene el estado {}", newStatus);
            return inscription;
        }

        // Aquí podrías agregar validaciones adicionales para las transiciones de estado
        // permitidas
        if (newStatus == InscriptionStatus.CANCELLED && InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.CANCELLED)) {
            throw new IllegalStateException("La inscripción ya está cancelada");
        }

        // Crear una nueva instancia con el nuevo estado
        return Inscription.builder()
                .id(inscription.getId())
                .contestId(inscription.getContestId())
                .userId(inscription.getUserId())
                .state(InscriptionStateConverter.toState(newStatus))
                .createdAt(inscription.getCreatedAt())
                .inscriptionDate(inscription.getInscriptionDate())
                .build();
    }
}