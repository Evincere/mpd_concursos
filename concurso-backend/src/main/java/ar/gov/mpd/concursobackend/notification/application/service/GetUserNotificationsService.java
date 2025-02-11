package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.mapper.NotificationMapper;
import ar.gov.mpd.concursobackend.notification.application.port.in.GetUserNotificationsUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.shared.security.IAuthenticationFacade;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetUserNotificationsService implements GetUserNotificationsUseCase {

    private final INotificationRepository notificationRepository;
    private final IAuthenticationFacade authenticationFacade;
    private final NotificationMapper notificationMapper;
    private final UserService userService;

    @Override
    public List<NotificationResponse> getUserNotifications() {
        String username = authenticationFacade.getCurrentUserId();
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
        
        UUID userId = user.getId().value();
        var notifications = notificationRepository.findByRecipientId(userId);
        return notifications.stream()
                .map(notificationMapper::toResponse)
                .toList();
    }
}
