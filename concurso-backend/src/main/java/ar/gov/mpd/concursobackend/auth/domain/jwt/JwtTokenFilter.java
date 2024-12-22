package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.io.IOException;
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
            logger.debug("Processing request for path: {} with token: {}", requestPath, token != null ? "present" : "absent");

            if (token != null) {
                logger.debug("Validating token...");
                if (jwtProvider.validateToken(token)) {
                    String username = jwtProvider.getUsernameFromToken(token);
                    List<String> roles = jwtProvider.getRolesFromToken(token);
                    logger.debug("Token valid for user: {} with roles: {}", username, roles);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("User details loaded successfully: {}", userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authentication set in SecurityContext: {}", authentication.getAuthorities());
                } else {
                    logger.warn("Invalid token provided for path: {}", requestPath);
                }
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            logger.error("Error processing JWT token: {}", e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Error procesando el token\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    private String getToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        logger.debug("Authorization header: {}", header != null ? header.substring(0, Math.min(header.length(), 20)) + "..." : "null");

        if (header == null || !header.startsWith("Bearer ")) {
            logger.debug("No Authorization header found");
            return null;
        }

        String token = header.substring(7);
        logger.debug("Token extracted from header: {}", token.substring(0, Math.min(token.length(), 20)) + "...");
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
