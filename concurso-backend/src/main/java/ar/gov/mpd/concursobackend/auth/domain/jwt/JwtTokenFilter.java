package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import ar.gov.mpd.concursobackend.auth.application.service.UserDetailsServiceImpl;
import ar.gov.mpd.concursobackend.shared.infrastructure.config.SecurityConstants;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private final static Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);

    @Autowired
    JwtProvider jwtProvider;

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                  @NonNull HttpServletResponse response, 
                                  @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        logger.debug("Processing request for path: {}", path);

        if (shouldNotFilter(request)) {
            logger.debug("Path {} is whitelisted, skipping authentication", path);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getToken(request);
            logger.debug("Extracted token: {}", token);

            if (token != null && jwtProvider.validateToken(token)) {
                String username = jwtProvider.getUsernameFromToken(token);
                List<String> roles = jwtProvider.getRolesFromToken(token);
                logger.debug("Token valid for user: {} with roles: {}", username, roles);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                logger.debug("User details loaded: {}", userDetails);

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
                logger.debug("Authentication set in SecurityContext");
            } else {
                // Solo enviar respuesta 401 si no es una ruta pública y no hay token válido
                if (!isPublicPath(path)) {
                    logger.warn("Invalid or missing token for protected path: {}", path);
                    sendUnauthorizedError(response, "Token no válido o no proporcionado");
                    return;
                }
            }
        } catch (JwtException e) {
            logger.error("Error en la validación del token JWT: {}", e.getMessage(), e);
            sendUnauthorizedError(response, "Error en la validación del token: " + e.getMessage());
            return;
        } catch (Exception e) {
            logger.error("Error no relacionado con JWT: {}", e.getMessage(), e);
            sendUnauthorizedError(response, "Error de autenticación: " + e.getMessage());
            return;
        }
        
        filterChain.doFilter(request, response);
    }

    private String getToken(HttpServletRequest request) {
        String header = request.getHeader(SecurityConstants.HEADER_STRING);
        if (header != null && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            logger.debug("Token encontrado en header: {}", header);
            return header.substring(SecurityConstants.TOKEN_PREFIX.length());
        }
        logger.warn("No se encontró token en el header de Authorization");
        return null;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
        return isWhitelistedPath(request.getServletPath());
    }

    private boolean isWhitelistedPath(String path) {
        // Verificar primero las rutas de H2 Console explícitamente
        if (path.startsWith("/h2-console")) {
            logger.debug("Path {} is H2 Console path, allowing access", path);
            return true;
        }

        // Combinar ambos arrays de rutas públicas
        List<String> whitelistedPaths = new ArrayList<>();
        whitelistedPaths.addAll(Arrays.asList(SecurityConstants.ANT_MATCHER_PATHS));
        whitelistedPaths.addAll(Arrays.asList(SecurityConstants.MVC_MATCHER_PATHS));

        boolean isWhitelisted = whitelistedPaths.stream()
                .anyMatch(pattern -> {
                    // Si el patrón termina en /**, hacemos una coincidencia de prefijo
                    if (pattern.endsWith("/**")) {
                        String prefix = pattern.substring(0, pattern.length() - 2);
                        return path.startsWith(prefix);
                    }
                    // Si no, hacemos una coincidencia exacta
                    return path.equals(pattern);
                });

        if (isWhitelisted) {
            logger.debug("Path {} is whitelisted", path);
        }
        
        return isWhitelisted;
    }

    private boolean isPublicPath(String path) {
        return isWhitelistedPath(path);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        logger.error("Error de autorización: {}", message);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    public boolean filter(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        return jwtProvider.validateToken(token);
    }
}
