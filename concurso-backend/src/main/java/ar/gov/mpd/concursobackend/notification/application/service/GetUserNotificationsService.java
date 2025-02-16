package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.mapper.NotificationMapper;
import ar.gov.mpd.concursobackend.notification.application.port.in.GetUserNotificationsUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.shared.security.IAuthenticationFacade;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class GetUserNotificationsService implements GetUserNotificationsUseCase {

    private final INotificationRepository notificationRepository;
    private final IAuthenticationFacade authenticationFacade;
    private final NotificationMapper notificationMapper;
    private final UserService userService;
    private final JwtProvider jwtProvider;

    @Override
    public List<NotificationResponse> getUserNotifications() {
        log.debug("Iniciando obtención de notificaciones del usuario");

        String token = authenticationFacade.getCurrentUserId(); // Este método en realidad devuelve el token
        String username = jwtProvider.getUsernameFromToken(token);
        log.debug("Username obtenido del token: {}", username);

        User user = userService.getByUsername(new UserUsername(username))
                .orElseThrow(() -> {
                    log.error("Usuario no encontrado: {}", username);
                    return new IllegalStateException("Usuario no encontrado");
                });

        var userId = user.getId().value();
        log.debug("Usuario encontrado con ID: {}", userId);

        var notifications = notificationRepository.findByRecipientId(userId);
        log.debug("Notificaciones encontradas: {}", notifications.size());

        return notifications.stream()
                .map(notificationMapper::toResponse)
                .toList();
    }
}
