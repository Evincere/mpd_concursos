package ar.gov.mpd.concursobackend.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationFacade implements IAuthenticationFacade {

  private final JwtProvider jwtProvider;

  @Override
  public String getCurrentUserId() {
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
    return token;
  }

  @Override
  public Authentication getAuthentication() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      log.error("No authenticated user found");
      throw new IllegalStateException("No authenticated user found");
    }
    return authentication;
  }
}
