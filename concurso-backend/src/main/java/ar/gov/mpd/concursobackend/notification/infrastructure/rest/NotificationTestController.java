package ar.gov.mpd.concursobackend.notification.infrastructure.rest;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test/notifications")
@Profile("dev")  // Solo disponible en perfil de desarrollo
@RequiredArgsConstructor
public class NotificationTestController {

    private final SendNotificationUseCase sendNotificationUseCase;
    private final IUserRepository userRepository;

    @PostMapping("/send-to/{username}")
    public ResponseEntity<NotificationResponse> sendTestNotification(
            @PathVariable String username,
            @RequestBody TestNotificationRequest request) {
        
        return userRepository.getByUsername(new UserUsername(username))
            .map(user -> {
                NotificationRequest notificationRequest = new NotificationRequest();
                notificationRequest.setRecipientId(user.getId().value());
                notificationRequest.setSubject(request.getSubject());
                notificationRequest.setContent(request.getContent());
                
                return ResponseEntity.ok(
                    sendNotificationUseCase.sendNotification(notificationRequest)
                );
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
