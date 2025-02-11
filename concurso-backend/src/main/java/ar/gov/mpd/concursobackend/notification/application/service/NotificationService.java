package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.mapper.NotificationMapper;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService implements SendNotificationUseCase, AcknowledgeNotificationUseCase {

    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        User recipient = userRepository.findById(request.getRecipientId())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Notification notification = Notification.builder()
            .id(UUID.randomUUID())
            .recipientId(UUID.fromString(recipient.getId().toString()))
            .subject(request.getSubject())
            .content(request.getContent())
            .status(NotificationStatus.PENDING)
            .sentAt(LocalDateTime.now())
            .build();
            
        notification.send();
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }

    @Override
    @Transactional
    public NotificationResponse acknowledgeNotification(NotificationAcknowledgementRequest request) {
        Notification notification = notificationRepository.findById(request.getNotificationId());
        notification.acknowledge(request.getSignature());
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }
}
