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

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
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
        logger.info("Clave JWT inicializada con longitud: {}", secret.length());
    }

    public String generateToken(Authentication authentication, User user) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toList());

        logger.debug("Generando token para usuario: {} con roles: {}", 
            userDetails.getUsername(), roles);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 1000);

        String token = Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("roles", roles)
            .claim("userId", user.getId().value().toString())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact();

        logger.debug("Token generado. Expira en: {}", expiryDate);
        return token;
    }

    public String getUsernameFromToken(String token) {
        try {
            String username = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();

            logger.debug("Nombre de usuario extraído del token: {}", username);
            return username;
        } catch (Exception e) {
            logger.error("Error al extraer username del token: {}", e.getMessage());
            throw e;
        }
    }

    public String getUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
            
            String userId = claims.get("userId", String.class);
            logger.debug("ID de usuario extraído del token: {}", userId);
            return userId;
        } catch (Exception e) {
            logger.error("Error al extraer userId del token: {}", e.getMessage());
            throw e;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

            List<String> roles = claims.get("roles", List.class);
            logger.debug("Roles extraídos del token: {}", roles);
            return roles;
        } catch (Exception e) {
            logger.error("Error al extraer roles del token: {}", e.getMessage());
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            logger.debug("Validando token...");
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            logger.debug("Token válido");
            return true;
        } catch (SignatureException e) {
            logger.error("Firma JWT inválida: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Token mal formado: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Token expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Claims vacíos: {}", e.getMessage());
        }
        return false;
    }
}
