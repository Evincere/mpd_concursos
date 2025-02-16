package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import io.jsonwebtoken.ExpiredJwtException;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private final static Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        if (shouldNotFilter(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getToken(request);
            String requestPath = request.getServletPath();

            logger.debug("Headers de la petición:");
            Collections.list(request.getHeaderNames())
                    .forEach(headerName -> logger.debug("{}: {}", headerName, request.getHeader(headerName)));

            logger.debug("Processing request for path: {} with token: {}", requestPath,
                    token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "absent");

            if (token != null) {
                logger.debug("Validando token para la ruta: {}", requestPath);
                if (jwtProvider.validateToken(token)) {
                    String username = jwtProvider.getUsernameFromToken(token);
                    List<String> roles = jwtProvider.getRolesFromToken(token);
                    logger.debug("Token válido para usuario: {} con roles: {} en ruta: {}", username, roles,
                            requestPath);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("Detalles de usuario cargados exitosamente: {}", userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, token, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Autenticación establecida en SecurityContext: {}", authentication.getAuthorities());
                    filterChain.doFilter(request, response);
                } else {
                    logger.warn("Token inválido proporcionado para la ruta: {}", requestPath);
                    handleAuthenticationError(response, "Su sesión ha expirado. Por favor, vuelva a iniciar sesión.",
                            HttpServletResponse.SC_UNAUTHORIZED);
                }
            } else {
                logger.warn("No se proporcionó token para la ruta: {}", requestPath);
                handleAuthenticationError(response, "Se requiere autenticación para acceder a este recurso",
                        HttpServletResponse.SC_UNAUTHORIZED);
            }
        } catch (ExpiredJwtException e) {
            logger.error("Token expirado: {}", e.getMessage());
            handleAuthenticationError(response, "Su sesión ha expirado. Por favor, vuelva a iniciar sesión.",
                    HttpServletResponse.SC_UNAUTHORIZED);
        } catch (Exception e) {
            logger.error("Error detallado en el filtro JWT:", e);
            throw e;
        }
    }

    private void handleAuthenticationError(HttpServletResponse response, String message, int status)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format(
                "{\"error\": \"Error de autenticación\", \"message\": \"%s\", \"status\": %d}",
                message.replace("\"", "'"),
                status));
    }

    private String getToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        logger.debug("Authorization header: {}",
                header != null ? header.substring(0, Math.min(header.length(), 20)) + "..." : "null");

        if (header == null || !header.startsWith("Bearer ")) {
            logger.debug("No se encontró el header Authorization o no tiene el formato correcto");
            return null;
        }

        String token = header.substring(7);
        logger.debug("Token extraído del header: {}", token.substring(0, Math.min(token.length(), 20)) + "...");
        return token;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") ||
                path.startsWith("/h2-console") ||
                path.equals("/favicon.ico") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui") ||
                (path.startsWith("/api/concursos") && request.getMethod().equals("GET"));
    }
}
