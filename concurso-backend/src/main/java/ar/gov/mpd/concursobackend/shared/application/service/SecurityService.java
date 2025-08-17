package ar.gov.mpd.concursobackend.shared.application.service;

import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecurityService {
    private static final Logger logger = LoggerFactory.getLogger(SecurityService.class);
    private final UserService userService;
    private final JwtProvider jwtProvider;
    private final HttpServletRequest request;

    public UUID getCurrentUserId() {
        try {
            String token = getTokenFromRequest();
            logger.info("=== DEBUG SecurityService: token obtenido: '{}'", token != null ? "TOKEN_PRESENTE" : "TOKEN_NULL");
            if (token != null) {
                try {
                    String userIdStr = jwtProvider.getUserIdFromToken(token);
                    logger.info("=== DEBUG SecurityService: userIdStr del token: '{}'", userIdStr);
                    if (userIdStr != null && !userIdStr.isEmpty()) {
                        UUID userId = UUID.fromString(userIdStr);
                        logger.info("=== DEBUG SecurityService: UUID final: '{}'", userId);
                        return userId;
                    }
                } catch (Exception e) {
                    logger.warn("No se pudo obtener userId del token, intentando con username: {}", e.getMessage());
                }
                
                // Si no se pudo obtener userId del token, intentar con username
                try {
                    String username = jwtProvider.getUsernameFromToken(token);
                    logger.info("=== DEBUG SecurityService: username del token: '{}'", username);
                    if (username != null) {
                        User user = userService.getByUsername(new UserUsername(username))
                            .orElseThrow(() -> new RuntimeException("Usuario no encontrado con username: " + username));
                        logger.info("=== DEBUG SecurityService: Usuario encontrado por username: '{}', ID: '{}'", username, user.getId().value());
                        return user.getId().value();
                    }
                } catch (Exception e) {
                    logger.warn("No se pudo obtener username del token: {}", e.getMessage());
                }
            }
            
            // Si no hay token, intentar obtener el ID del usuario del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                logger.info("=== DEBUG SecurityService: Obteniendo usuario del contexto de seguridad: '{}'", authentication.getName());
                User user = userService.getByUsername(new UserUsername(authentication.getName()))
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                return user.getId().value();
            }
            
            throw new RuntimeException("No se pudo obtener el ID del usuario actual");
        } catch (Exception e) {
            logger.error("Error al obtener el ID del usuario actual: {}", e.getMessage());
            throw new RuntimeException("Error al obtener el ID del usuario actual", e);
        }
    }

    private String getTokenFromRequest() {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}