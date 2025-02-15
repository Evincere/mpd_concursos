package ar.gov.mpd.concursobackend.shared.infrastructure.security;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.shared.application.service.SecurityService;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SecurityUtils {
    private final SecurityService securityService;

    public String getCurrentUserId() {
        try {
            return securityService.getCurrentUserId().toString();
        } catch (Exception e) {
            return null;
        }
    }
}