package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.port.NotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationContent;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationId;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationSubject;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService implements SendNotificationUseCase, AcknowledgeNotificationUseCase {

    private final NotificationRepository notificationRepository;
    private final IUserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        User recipient = userRepository.findById(request.getRecipientId())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        var notification = new Notification(
            new NotificationId(),
            recipient,
            new NotificationSubject(request.getSubject()),
            new NotificationContent(request.getContent())
        );

        notification.send();
        var savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }

    @Override
    @Transactional
    public NotificationResponse acknowledgeNotification(NotificationAcknowledgementRequest request) {
        var notification = notificationRepository.findById(new NotificationId(request.getNotificationId()))
            .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));

        notification.acknowledge(request.getSignature());
        var savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }
}
