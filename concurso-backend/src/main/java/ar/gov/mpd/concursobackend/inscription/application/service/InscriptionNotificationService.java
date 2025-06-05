package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.util.InscriptionStateConverter;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for sending notifications related to inscription status changes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionNotificationService {

    private final SendNotificationUseCase sendNotificationUseCase;
    private final IUserService userService;

    /**
     * Sends a notification to all administrators when an inscription status changes to PENDING
     *
     * @param inscription The inscription that changed status
     * @param contest     The contest associated with the inscription
     */
    public void notifyAdminsAboutPendingInscription(Inscription inscription, Contest contest) {
        if (!InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.PENDING)) {
            log.debug("Inscription status is not PENDING, not sending notification to admins");
            return;
        }

        log.info("Sending notification to admins about pending inscription: {}", inscription.getId().getValue());

        // Get all admin users using the new method
        log.info("Getting admin users to notify about pending inscription");

        try {
            // Get all admin users
            List<User> adminUsers = userService.findUsersByRole(RoleEnum.ROLE_ADMIN);

            if (adminUsers.isEmpty()) {
                log.warn("No admin users found to notify about pending inscription");
                return;
            }

            log.info("Found {} admin users to notify", adminUsers.size());

            // Get user who submitted the inscription using the new method
            log.info("Getting user information for inscription: {}", inscription.getId().getValue());

            UUID userId = inscription.getUserId().getValue();
            Optional<User> applicantOpt = userService.getById(userId);

            String applicantFirstName;
            String applicantLastName;

            if (applicantOpt.isPresent()) {
                User applicant = applicantOpt.get();
                applicantFirstName = applicant.getFirstName();
                applicantLastName = applicant.getLastName();
                log.info("Found applicant: {} {}", applicantFirstName, applicantLastName);
            } else {
                log.warn("Applicant not found with ID: {}", userId);
                applicantFirstName = "Unknown";
                applicantLastName = "Applicant";
            }

            String subject = "New Pending Inscription";
            String content = String.format(
                    "A new inscription is pending approval for contest: %s.\n\n" +
                            "Applicant: %s %s\n" +
                            "Inscription ID: %s\n" +
                            "Submitted on: %s\n\n" +
                            "Please review and validate this inscription.",
                    contest.getTitle(),
                    applicantFirstName,
                    applicantLastName,
                    inscription.getId().getValue(),
                    inscription.getLastUpdated()
            );

            // Send notification to each admin
            for (User admin : adminUsers) {
                try {
                    NotificationRequest request = NotificationRequest.builder()
                            .recipientUsername(admin.getUsername().value())
                            .subject(subject)
                            .content(content)
                            .type(NotificationType.INSCRIPTION)
                            .acknowledgementLevel(AcknowledgementLevel.SIMPLE)
                            .build();

                    sendNotificationUseCase.sendNotification(request);
                    log.debug("Notification sent to admin: {}", admin.getUsername().value());
                } catch (Exception e) {
                    log.error("Failed to send notification to admin: {}", admin.getUsername().value(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process admin notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Sends a notification to a user when their inscription status changes to APPROVED or REJECTED
     *
     * @param inscription The inscription that changed status
     * @param contest     The contest associated with the inscription
     */
    public void notifyUserAboutInscriptionStatusChange(Inscription inscription, Contest contest) {
        if (!InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.APPROVED) &&
            !InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.REJECTED)) {
            log.debug("Inscription status is not APPROVED or REJECTED, not sending notification to user");
            return;
        }

        UUID userId = inscription.getUserId().getValue();
        log.info("Sending notification to user {} about inscription status change to: {}",
                userId, inscription.getState());

        // Get the user by ID using the new method
        log.info("Getting user information for inscription: {}", inscription.getId().getValue());

        try {
            // Get the user by ID
            Optional<User> userOpt = userService.getById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {} to notify about inscription status change", userId);
                return;
            }

            User user = userOpt.get();
            log.info("Found user: {} {}", user.getFirstName(), user.getLastName());

            String subject = "Inscription Status Update";
            String statusText = InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.APPROVED) ? "approved" : "rejected";

            String content = String.format(
                    "Your inscription for contest \"%s\" has been %s.\n\n" +
                            "Contest: %s\n" +
                            "Inscription ID: %s\n" +
                            "Status: %s\n" +
                            "Updated on: %s\n\n",
                    contest.getTitle(),
                    statusText,
                    contest.getTitle(),
                    inscription.getId().getValue(),
                    statusText.toUpperCase(),
                    inscription.getLastUpdated()
            );

            // Add additional information based on status
            if (InscriptionStateConverter.equals(inscription.getState(), InscriptionStatus.APPROVED)) {
                content += "Congratulations! Your inscription has been approved. " +
                        "You will receive further instructions about the next steps in the contest process.";
            } else {
                content += "We regret to inform you that your inscription has been rejected. " +
                        "If you have any questions, please contact the administration.";
            }

            try {
                NotificationRequest request = NotificationRequest.builder()
                        .recipientUsername(user.getUsername().value())
                        .subject(subject)
                        .content(content)
                        .type(NotificationType.INSCRIPTION)
                        .acknowledgementLevel(AcknowledgementLevel.SIMPLE)
                        .build();

                sendNotificationUseCase.sendNotification(request);
                log.debug("Notification sent to user: {}", user.getUsername().value());
            } catch (Exception e) {
                log.error("Failed to send notification to user: {}", user.getUsername().value(), e);
            }
        } catch (Exception e) {
            log.error("Failed to process notification for user with ID {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Sends a notification to a user when their inscription is frozen due to expired documentation deadline
     *
     * @param inscription The inscription that was frozen
     * @param contest     The contest associated with the inscription
     */
    public void notifyUserAboutInscriptionFrozen(Inscription inscription, Contest contest) {
        UUID userId = inscription.getUserId().getValue();
        log.info("Sending notification to user {} about inscription being frozen due to expired deadline", userId);

        try {
            // Get the user by ID
            Optional<User> userOpt = userService.getById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {} to notify about inscription freeze", userId);
                return;
            }

            User user = userOpt.get();
            log.info("Found user: {} {} for frozen inscription notification", user.getFirstName(), user.getLastName());

            String subject = "Inscripción Congelada - Plazo de Documentación Vencido";

            String content = String.format(
                    "Su inscripción al concurso \"%s\" ha sido congelada debido al vencimiento del plazo para la presentación de documentación.\n\n" +
                            "Detalles de la inscripción:\n" +
                            "- Concurso: %s\n" +
                            "- ID de Inscripción: %s\n" +
                            "- Estado: CONGELADA\n" +
                            "- Fecha de congelación: %s\n\n" +
                            "IMPORTANTE: Su inscripción ha sido congelada porque no se completó la documentación requerida " +
                            "dentro del plazo perentorio de 3 días hábiles posterior al cierre de inscripciones.\n\n" +
                            "Esta acción es irreversible y su inscripción no podrá continuar en el proceso de selección.\n\n" +
                            "Si considera que existe un error, puede contactar a la administración para revisar su caso.",
                    contest.getTitle(),
                    contest.getTitle(),
                    inscription.getId().getValue(),
                    inscription.getLastUpdated()
            );

            try {
                NotificationRequest request = NotificationRequest.builder()
                        .recipientUsername(user.getUsername().value())
                        .subject(subject)
                        .content(content)
                        .type(NotificationType.INSCRIPTION)
                        .acknowledgementLevel(AcknowledgementLevel.SIGNATURE_BASIC)
                        .build();

                sendNotificationUseCase.sendNotification(request);
                log.info("Frozen inscription notification sent to user: {}", user.getUsername().value());
            } catch (Exception e) {
                log.error("Failed to send frozen inscription notification to user: {}", user.getUsername().value(), e);
            }
        } catch (Exception e) {
            log.error("Failed to process frozen inscription notification for user with ID {}: {}", userId, e.getMessage(), e);
        }
    }
}
