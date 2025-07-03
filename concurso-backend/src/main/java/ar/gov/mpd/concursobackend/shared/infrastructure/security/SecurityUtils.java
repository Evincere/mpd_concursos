package ar.gov.mpd.concursobackend.shared.infrastructure.security;

import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.shared.application.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityUtils {
    private final SecurityService securityService;
    private final JwtProvider jwtProvider;

    public String getCurrentUserId() {
        try {
            return securityService.getCurrentUserId().toString();
        } catch (Exception e) {
            log.error("Error al obtener el ID del usuario actual: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo obtener el ID del usuario actual", e);
        }
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("No authenticated user found");
            throw new IllegalStateException("No authenticated user found");
        }

        if (authentication.getCredentials() == null) {
            log.error("No credentials found in authentication");
            throw new IllegalStateException("No credentials found in authentication");
        }

        String token = authentication.getCredentials().toString();
        log.debug("Token obtenido de la autenticación: {}", token);
        return jwtProvider.getUsernameFromToken(token);
    }
}