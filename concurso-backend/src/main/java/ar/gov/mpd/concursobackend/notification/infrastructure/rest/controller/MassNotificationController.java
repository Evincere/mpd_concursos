package ar.gov.mpd.concursobackend.notification.infrastructure.rest.controller;

import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendMassNotificationUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for mass notification operations
 */
@RestController
@RequestMapping("/api/v1/notifications/mass")
@RequiredArgsConstructor
@Slf4j
public class MassNotificationController {

    private final SendMassNotificationUseCase sendMassNotificationUseCase;

    /**
     * Send a mass notification to multiple users
     * @param request The mass notification request
     * @return The response containing information about the sent notifications
     */
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<MassNotificationResponse> sendMassNotification(
            @Valid @RequestBody MassNotificationRequest request) {
        log.debug("Received request to send mass notification: {}", request);
        MassNotificationResponse response = sendMassNotificationUseCase.sendMassNotification(request);
        log.debug("Mass notification processed: {}", response);
        return ResponseEntity.ok(response);
    }
}
