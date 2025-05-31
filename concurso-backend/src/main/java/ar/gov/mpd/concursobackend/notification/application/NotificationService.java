package ar.gov.mpd.concursobackend.notification.application;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.mapper.NotificationMapper;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.CreateNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.GetUserNotificationsUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.MarkNotificationAsReadUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.shared.security.IAuthenticationFacade;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for notification-related use cases
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class NotificationService implements SendNotificationUseCase,
                                           AcknowledgeNotificationUseCase,
                                           MarkNotificationAsReadUseCase,
                                           GetUserNotificationsUseCase,
                                           CreateNotificationUseCase {

    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final IAuthenticationFacade authenticationFacade;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        log.debug("Sending notification to user: {}", request.getRecipientUsername());

        User recipient = userRepository.getByUsername(new UserUsername(request.getRecipientUsername()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.debug("User found: {}", recipient.getId().value());

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

        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId);
        if (notification == null) {
            throw new IllegalArgumentException("Notification not found");
        }

        // Verify the notification belongs to the current user
        String currentUsername = authenticationFacade.getAuthentication().getName();
        User currentUser = userRepository.getByUsername(new UserUsername(currentUsername))
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        if (!notification.getRecipientId().equals(currentUser.getId().value())) {
            throw new IllegalArgumentException("Notification does not belong to the current user");
        }

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());

        Notification updatedNotification = notificationRepository.update(notification);
        return notificationMapper.toResponse(updatedNotification);
    }

    @Override
    @Transactional
    public NotificationResponse acknowledgeNotification(NotificationAcknowledgementRequest request) {
        Notification notification = notificationRepository.findById(request.getNotificationId());
        if (notification == null) {
            throw new IllegalArgumentException("Notification not found");
        }

        // Verify the notification belongs to the current user
        String currentUsername = authenticationFacade.getAuthentication().getName();
        User currentUser = userRepository.getByUsername(new UserUsername(currentUsername))
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        if (!notification.getRecipientId().equals(currentUser.getId().value())) {
            throw new IllegalArgumentException("Notification does not belong to the current user");
        }

        notification.setStatus(NotificationStatus.ACKNOWLEDGED);
        notification.setAcknowledgedAt(LocalDateTime.now());

        if (request.getSignatureValue() != null) {
            notification.setSignatureValue(request.getSignatureValue());
        }

        if (request.getSignatureMetadata() != null) {
            notification.setSignatureMetadata(request.getSignatureMetadata());
        }

        Notification updatedNotification = notificationRepository.update(notification);
        return notificationMapper.toResponse(updatedNotification);
    }

    @Override
    public List<NotificationResponse> getUserNotifications() {
        String currentUsername = authenticationFacade.getAuthentication().getName();
        User currentUser = userRepository.getByUsername(new UserUsername(currentUsername))
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        List<Notification> notifications = notificationRepository.findByRecipientId(currentUser.getId().value());
        return notifications.stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(String username, String content, NotificationType type) {
        log.debug("Creating notification for user: {}", username);

        User recipient = userRepository.getByUsername(new UserUsername(username))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.debug("User found: {}", recipient.getId().value());

        NotificationRequest request = NotificationRequest.builder()
                .recipientUsername(username)
                .subject(type.getDescription())
                .content(content)
                .type(type)
                .acknowledgementLevel(AcknowledgementLevel.NONE)
                .build();

        return sendNotification(request);
    }
}
