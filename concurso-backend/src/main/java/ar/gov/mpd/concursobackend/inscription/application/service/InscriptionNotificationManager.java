package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * ✅ SERVICIO CENTRALIZADO: Manejo de notificaciones relacionadas con inscripciones
 * 
 * Responsabilidades:
 * - Enviar notificaciones específicas por tipo de cambio de estado
 * - Manejar notificaciones en transacciones separadas
 * - Proporcionar templates de mensajes consistentes
 * - Gestionar errores de notificación sin afectar operaciones principales
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionNotificationManager {
    
    private final SendNotificationUseCase notificationService;
    private final ContestRepository contestRepository;
    private final IUserService userService;
    private final SecurityUtils securityUtils;
    
    /**
     * ✅ NOTIFICACIÓN DE CANCELACIÓN: Método asíncrono en transacción separada
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendCancellationNotificationAsync(Inscription inscription) {
        try {
            log.debug("Enviando notificación de cancelación para inscripción: {}", inscription.getId());
            
            Contest contest = getContest(inscription);
            User user = getCurrentUser();
            
            NotificationRequest request = NotificationRequest.builder()
                .recipientUsername(user.getUsername().value())
                .subject("Postulación Cancelada - " + contest.getTitle())
                .content(buildCancellationMessage(contest))
                .type(NotificationType.INSCRIPTION)
                .acknowledgementLevel(AcknowledgementLevel.NONE)
                .build();
            
            notificationService.sendNotification(request);
            log.info("Notificación de cancelación enviada exitosamente para inscripción: {}", inscription.getId());
            
        } catch (Exception e) {
            log.error("Error al enviar notificación de cancelación para inscripción {}: {}", 
                    inscription.getId(), e.getMessage(), e);
        }
    }
    
    /**
     * ✅ NOTIFICACIÓN DE CAMBIO DE ESTADO: Método asíncrono genérico
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendStateChangeNotificationAsync(Inscription inscription, InscriptionState previousState, 
                                               InscriptionState newState, String reason) {
        try {
            log.debug("Enviando notificación de cambio de estado para inscripción: {} ({} -> {})", 
                    inscription.getId(), previousState, newState);
            
            Contest contest = getContest(inscription);
            User user = getUserById(inscription.getUserId().getValue());
            
            NotificationRequest request = NotificationRequest.builder()
                .recipientUsername(user.getUsername().value())
                .subject(buildStateChangeSubject(contest, newState))
                .content(buildStateChangeMessage(contest, previousState, newState, reason))
                .type(NotificationType.INSCRIPTION)
                .acknowledgementLevel(getAcknowledgementLevel(newState))
                .build();
            
            notificationService.sendNotification(request);
            log.info("Notificación de cambio de estado enviada exitosamente para inscripción: {}", inscription.getId());
            
        } catch (Exception e) {
            log.error("Error al enviar notificación de cambio de estado para inscripción {}: {}", 
                    inscription.getId(), e.getMessage(), e);
        }
    }
    
    /**
     * Obtiene información del concurso
     */
    private Contest getContest(Inscription inscription) {
        return contestRepository.findById(inscription.getContestId().getValue())
            .orElseThrow(() -> {
                log.error("No se encontró el concurso con ID: {}", inscription.getContestId().getValue());
                return new IllegalArgumentException("Concurso no encontrado");
            });
    }
    
    /**
     * Obtiene el usuario actual
     */
    private User getCurrentUser() {
        return userService.getByUsername(new UserUsername(securityUtils.getCurrentUsername()))
            .orElseThrow(() -> {
                log.error("No se encontró el usuario con username: {}", securityUtils.getCurrentUsername());
                return new IllegalArgumentException("Usuario no encontrado");
            });
    }
    
    /**
     * Obtiene un usuario por ID
     */
    private User getUserById(java.util.UUID userId) {
        return userService.getById(userId)
            .orElseThrow(() -> {
                log.error("No se encontró el usuario con ID: {}", userId);
                return new IllegalArgumentException("Usuario no encontrado");
            });
    }
    
    /**
     * Construye el mensaje de cancelación
     */
    private String buildCancellationMessage(Contest contest) {
        return String.format(
            "Tu postulación al concurso '%s' ha sido cancelada.\n\n" +
            "Detalles del concurso:\n" +
            "- Cargo: %s\n" +
            "- Dependencia: %s\n\n" +
            "Si tienes alguna consulta, puedes contactar al administrador.",
            contest.getTitle(),
            contest.getLocation() != null ? contest.getLocation() : "No especificado",
            contest.getDependency()
        );
    }
    
    /**
     * Construye el asunto para cambios de estado
     */
    private String buildStateChangeSubject(Contest contest, InscriptionState newState) {
        String stateDescription = switch (newState) {
            case PENDING -> "En Revisión";
            case APPROVED -> "Aprobada";
            case REJECTED -> "Rechazada";
            case FROZEN -> "Congelada";
            default -> newState.getDisplayName();
        };
        
        return String.format("Postulación %s - %s", stateDescription, contest.getTitle());
    }
    
    /**
     * Construye el mensaje para cambios de estado
     */
    private String buildStateChangeMessage(Contest contest, InscriptionState previousState, 
                                         InscriptionState newState, String reason) {
        String stateMessage = switch (newState) {
            case PENDING -> "Tu postulación está ahora en revisión por parte del equipo administrativo.";
            case APPROVED -> "¡Felicitaciones! Tu postulación ha sido aprobada.";
            case REJECTED -> "Tu postulación ha sido rechazada.";
            case FROZEN -> "Tu postulación ha sido congelada debido al vencimiento del plazo de documentación.";
            default -> String.format("El estado de tu postulación ha cambiado a: %s", newState.getDisplayName());
        };
        
        StringBuilder message = new StringBuilder();
        message.append(String.format("Estimado/a postulante,\n\n%s\n\n", stateMessage));
        message.append("Detalles del concurso:\n");
        message.append(String.format("- Cargo: %s\n", contest.getLocation() != null ? contest.getLocation() : "No especificado"));
        message.append(String.format("- Dependencia: %s\n", contest.getDependency()));
        
        if (reason != null && !reason.trim().isEmpty()) {
            message.append(String.format("\nObservaciones: %s\n", reason));
        }
        
        message.append("\nSi tienes alguna consulta, puedes contactar al administrador.");
        
        return message.toString();
    }
    
    /**
     * Determina el nivel de reconocimiento según el estado
     */
    private AcknowledgementLevel getAcknowledgementLevel(InscriptionState state) {
        return switch (state) {
            case APPROVED, REJECTED -> AcknowledgementLevel.SIGNATURE_BASIC;
            default -> AcknowledgementLevel.NONE;
        };
    }
}
