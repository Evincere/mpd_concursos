package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.mapper.NotificationMapper;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.MarkNotificationAsReadUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService
        implements SendNotificationUseCase, AcknowledgeNotificationUseCase, MarkNotificationAsReadUseCase {

    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        log.debug("Enviando notificación para usuario: {}", request.getRecipientUsername());

        User recipient = userRepository.getByUsername(new UserUsername(request.getRecipientUsername()))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        log.debug("Usuario encontrado: {}", recipient.getId().value());

        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .recipientId(recipient.getId().value())
                .subject(request.getSubject())
                .content(request.getContent())
                .status(NotificationStatus.PENDING)
                .type(request.getType())
                .sentAt(LocalDateTime.now())
                .acknowledgementLevel(request.getAcknowledgementLevel())
                .build();

        log.debug("Notificación creada: {}", notification);

        notification.send();
        Notification savedNotification = notificationRepository.save(notification);
        log.debug("Notificación guardada: {}", savedNotification);

        return notificationMapper.toResponse(savedNotification);
    }

    @Override
    @Transactional
    public NotificationResponse acknowledgeNotification(NotificationAcknowledgementRequest request) {
        int maxRetries = 3;
        int retryCount = 0;
        long waitTimeMs = 100;

        while (retryCount < maxRetries) {
            try {
                Notification notification = notificationRepository.findById(request.getNotificationId());
                if (notification == null) {
                    throw new IllegalArgumentException("Notificación no encontrada");
                }

                // Si ya está acusada, retornar la notificación sin cambios
                if (notification.getAcknowledgedAt() != null) {
                    return notificationMapper.toResponse(notification);
                }

                notification.acknowledge(request.getSignatureType(), request.getSignatureValue(),
                        request.getMetadata());

                try {
                    Notification savedNotification = notificationRepository.save(notification);
                    return notificationMapper.toResponse(savedNotification);
                } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw new RuntimeException(
                                "No se pudo acusar recibo de la notificación después de " + maxRetries + " intentos",
                                e);
                    }
                    // Espera exponencial entre reintentos
                    Thread.sleep(waitTimeMs * retryCount);
                    continue;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Operación interrumpida", ie);
            }
        }
        throw new RuntimeException("No se pudo acusar recibo de la notificación");
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId);
        if (notification == null) {
            throw new IllegalArgumentException("Notificación no encontrada");
        }
        notification.markAsRead();
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }
}
