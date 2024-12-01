package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import ar.gov.mpd.concursobackend.auth.domain.model.User;

@Component
public class JwtProvider {

    private final static Logger logger = LoggerFactory.getLogger(JwtProvider.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        logger.info("Clave JWT inicializada");
    }

    public String generateToken(Authentication authentication, User user) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toList());

        logger.info("Generando token para usuario: {} con roles: {}", 
            userDetails.getUsername(), roles);

        String token = Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("roles", roles)
            .claim("userId", user.getId().value().toString())
            .setIssuedAt(new Date())
            .setExpiration(new Date(new Date().getTime() + expiration * 1000))
            .signWith(key)
            .compact();

        logger.info("Token generado: {}", token);
        return token;
    }

    public String getUsernameFromToken(String token) {
        String username = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();

        logger.info("Nombre de usuario extraído del token: {}", username);
        return username;
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
        
        String userId = claims.get("userId", String.class);
        logger.info("ID de usuario extraído del token: {}", userId);
        return userId;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            logger.info("Token válido");
            return true;
        } catch (Exception e) {
            logger.error("Error al validar el token: {}", e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
        
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        logger.info("Roles extraídos del token: {}", roles);
        return roles;
    }

}
