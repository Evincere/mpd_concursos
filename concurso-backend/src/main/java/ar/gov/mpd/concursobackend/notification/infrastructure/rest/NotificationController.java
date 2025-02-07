package ar.gov.mpd.concursobackend.notification.infrastructure.rest;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.port.in.AcknowledgeNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SendNotificationUseCase sendNotificationUseCase;
    private final AcknowledgeNotificationUseCase acknowledgeNotificationUseCase;

    @PostMapping
    public ResponseEntity<NotificationResponse> sendNotification(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(sendNotificationUseCase.sendNotification(request));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<NotificationResponse> acknowledgeNotification(
            @PathVariable("id") String notificationId,
            @Valid @RequestBody NotificationAcknowledgementRequest request) {
        return ResponseEntity.ok(acknowledgeNotificationUseCase.acknowledgeNotification(request));
    }
}
