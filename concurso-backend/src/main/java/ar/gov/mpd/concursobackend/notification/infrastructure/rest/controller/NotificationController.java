package ar.gov.mpd.concursobackend.notification.infrastructure.rest.controller;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.GetUserNotificationsUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.MarkNotificationAsReadUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final SendNotificationUseCase sendNotificationUseCase;
    private final GetUserNotificationsUseCase getUserNotificationsUseCase;
    private final AcknowledgeNotificationUseCase acknowledgeNotificationUseCase;
    private final MarkNotificationAsReadUseCase markNotificationAsReadUseCase;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications() {
        log.debug("Obteniendo notificaciones del usuario");
        var notifications = getUserNotificationsUseCase.getUserNotifications();
        log.debug("Notificaciones obtenidas: {}", notifications.size());
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody NotificationRequest request) {
        log.debug("Recibida solicitud para enviar notificación: {}", request);
        var response = sendNotificationUseCase.sendNotification(request);
        log.debug("Notificación enviada: {}", response);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable("id") UUID notificationId) {
        return ResponseEntity.ok(markNotificationAsReadUseCase.markAsRead(notificationId));
    }

    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<NotificationResponse> acknowledgeNotification(
            @PathVariable("id") UUID notificationId,
            @Valid @RequestBody NotificationAcknowledgementRequest request) {
        request.setNotificationId(notificationId);
        return ResponseEntity.ok(acknowledgeNotificationUseCase.acknowledgeNotification(request));
    }
}
