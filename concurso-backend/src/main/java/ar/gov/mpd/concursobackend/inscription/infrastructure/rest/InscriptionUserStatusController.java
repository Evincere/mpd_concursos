package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStatusUseCase;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionNotificationService;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controlador para permitir a los usuarios actualizar el estado de sus propias inscripciones
 * Permite cambiar a PENDING, COMPLETED_WITH_DOCS o COMPLETED_PENDING_DOCS cuando se completa el proceso de inscripción
 */
@RestController
@RequestMapping({"/api/inscriptions", "/api/inscripciones"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@Slf4j
public class InscriptionUserStatusController {
    private final UpdateInscriptionStatusUseCase updateInscriptionStatusUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;
    private final SecurityUtils securityUtils;
    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final InscriptionNotificationService inscriptionNotificationService;
    private final SendNotificationUseCase notificationService;
    private final IUserService userService;

    /**
     * Endpoint para que un usuario pueda actualizar el estado de su propia inscripción
     * Permite cambiar a PENDING, COMPLETED_WITH_DOCS o COMPLETED_PENDING_DOCS cuando se completa el proceso
     *
     * @param id ID de la inscripción
     * @param status Nuevo estado (PENDING, COMPLETED_WITH_DOCS o COMPLETED_PENDING_DOCS)
     * @return ResponseEntity sin contenido
     */
    @PatchMapping("/{id}/user-status")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> updateUserStatus(@PathVariable UUID id, @RequestParam String status) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            log.error("No se encontró el usuario autenticado");
            return ResponseEntity.badRequest().build();
        }

        // Verificar que la inscripción pertenece al usuario actual
        try {
            InscriptionDetailResponse inscription = findInscriptionsUseCase.findById(id);
            if (!inscription.getUserId().toString().equals(currentUserId)) {
                log.error("El usuario {} intentó actualizar una inscripción que no le pertenece: {}",
                        currentUserId, id);
                return ResponseEntity.notFound().build();
            }

            // Permitir cambiar a PENDING, COMPLETED_WITH_DOCS o COMPLETED_PENDING_DOCS
            if (!"PENDING".equalsIgnoreCase(status) &&
                !"COMPLETED_WITH_DOCS".equalsIgnoreCase(status) &&
                !"COMPLETED_PENDING_DOCS".equalsIgnoreCase(status)) {
                log.error("El usuario {} intentó cambiar el estado a {}, pero solo se permite PENDING, COMPLETED_WITH_DOCS o COMPLETED_PENDING_DOCS",
                        currentUserId, status);
                return ResponseEntity.badRequest().build();
            }

            // Actualizar el estado
            updateInscriptionStatusUseCase.updateStatus(id, status);
            log.info("Usuario {} actualizó su inscripción {} a estado {}", currentUserId, id, status);

            // Send notifications about the pending inscription
            try {
                Inscription updatedInscription = inscriptionRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Inscription not found after update"));

                Contest contest = contestRepository.findById(updatedInscription.getContestId().getValue())
                        .orElseThrow(() -> new IllegalArgumentException("Contest not found"));

                // Notify administrators
                inscriptionNotificationService.notifyAdminsAboutPendingInscription(updatedInscription, contest);
                log.info("Notification sent to administrators about pending inscription: {}", id);

                // Notify user about completed inscription
                User user = userService.getById(UUID.fromString(currentUserId))
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));

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
                                contest.getLocation() != null ? contest.getLocation() : "No especificado",
                                contest.getDependency()))
                        .type(NotificationType.INSCRIPTION)
                        .acknowledgementLevel(AcknowledgementLevel.NONE)
                        .build();

                notificationService.sendNotification(completionRequest);
                log.info("Notification sent to user about completed inscription: {}", id);

            } catch (Exception e) {
                // Don't fail the request if notification fails
                log.error("Failed to send notifications about pending inscription: {}", id, e);
            }

            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error de validación al actualizar estado de inscripción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
