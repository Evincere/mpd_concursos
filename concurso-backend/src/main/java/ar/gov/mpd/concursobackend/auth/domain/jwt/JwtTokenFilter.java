package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.io.IOException;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import java.util.stream.Collectors;

import ar.gov.mpd.concursobackend.auth.application.service.UserDetailsServiceImpl;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.util.AntPathMatcher;

import ar.gov.mpd.concursobackend.shared.infrastructure.config.SecurityConstants;

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
        
        // Verificar si la ruta está en whitelist
        if (isWhitelistedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getToken(request);
            
            if (token != null && jwtProvider.validateToken(token)) {
                String username = jwtProvider.getUsernameFromToken(token);
                List<String> roles = jwtProvider.getRolesFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList())
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
                filterChain.doFilter(request, response);
            } else {
                // Solo enviar respuesta 401 si no es una ruta pública y no hay token válido
                if (!isPublicPath(path)) {
                    sendUnauthorizedError(response, "Token no válido o no proporcionado");
                    return;
                }
                filterChain.doFilter(request, response);
            }
        } catch (JwtException e) {
            logger.error("Error en la validación del token JWT: {}", e.getMessage());
            sendUnauthorizedError(response, "Error en la validación del token");
        } catch (Exception e) {
            logger.error("Error no relacionado con JWT: {}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }

    private boolean isWhitelistedPath(String path) {
        return Arrays.stream(SecurityConstants.PUBLIC_PATHS)
            .anyMatch(pattern -> 
                new AntPathMatcher().match(pattern, path)
            );
    }

    private boolean isPublicPath(String path) {
        return isWhitelistedPath(path);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
            "{\"error\": \"No autorizado\", \"message\": \"%s\", \"status\": 401}", 
            message
        ));
    }

    private String getToken(HttpServletRequest request) {
        String header = request.getHeader(SecurityConstants.HEADER_STRING);
        if (header != null && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            return header.substring(SecurityConstants.TOKEN_PREFIX.length());
        }
        return null;
    }

    public boolean filter(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        return jwtProvider.validateToken(token);
    }

}
