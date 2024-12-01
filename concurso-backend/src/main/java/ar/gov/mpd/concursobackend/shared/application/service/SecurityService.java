package ar.gov.mpd.concursobackend.shared.application.service;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

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
            if (token != null) {
                String userIdStr = jwtProvider.getUserIdFromToken(token);
                return UUID.fromString(userIdStr);
            }
            
            // Si no hay token, intentar obtener el ID del usuario del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
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