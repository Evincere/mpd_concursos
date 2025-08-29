package ar.gov.mpd.concursobackend.shared.infrastructure.security;

import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.shared.application.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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

    /**
     * Verifica si el usuario actual tiene rol de administrador
     * @return true si el usuario es admin, false en caso contrario
     */
    public boolean isCurrentUserAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("No authenticated user found - not admin");
                return false;
            }

            boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            log.debug("Current user admin status: {}", isAdmin);
            return isAdmin;
        } catch (Exception e) {
            log.error("Error al verificar si el usuario actual es admin: {}", e.getMessage(), e);
            return false;
        }
    }
}
