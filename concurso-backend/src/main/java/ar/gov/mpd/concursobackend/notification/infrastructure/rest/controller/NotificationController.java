package ar.gov.mpd.concursobackend.notification.infrastructure.rest.controller;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.GetUserNotificationsUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SendNotificationUseCase sendNotificationUseCase;
    private final AcknowledgeNotificationUseCase acknowledgeNotificationUseCase;
    private final GetUserNotificationsUseCase getUserNotificationsUseCase;

    @GetMapping("/user")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications() {
        List<NotificationResponse> notifications = getUserNotificationsUseCase.getUserNotifications();
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> sendNotification(
            @Valid @RequestBody NotificationRequest request) {
        NotificationResponse result = sendNotificationUseCase.sendNotification(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<NotificationResponse> acknowledgeNotification(
            @PathVariable("id") UUID id,
            @Valid @RequestBody NotificationAcknowledgementRequest request) {
        request.setNotificationId(id);
        NotificationResponse result = acknowledgeNotificationUseCase.acknowledgeNotification(request);
        return ResponseEntity.ok(result);
    }
}
