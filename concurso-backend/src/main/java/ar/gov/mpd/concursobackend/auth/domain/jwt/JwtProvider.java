package ar.gov.mpd.concursobackend.auth.domain.jwt;

import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.domain.model.UserAuthority;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {

    private final static Logger logger = LoggerFactory.getLogger(JwtProvider.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration;

    public String generateToken(Authentication authentication) {
        UserAuthority userAuthority = (UserAuthority) authentication.getPrincipal();

        return Jwts.builder()
            .setSubject(userAuthority.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(new Date().getTime() + expiration * 1000))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS512)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("token mal formado", e);
        } catch (UnsupportedJwtException e) {
            logger.error("token no soportado", e);
        } catch (ExpiredJwtException e) {
            logger.error("token expirado", e);
        } catch (IllegalArgumentException e) {
            logger.error("token vacío", e);
        } catch (SignatureException e) {
            logger.error("fail en la firma", e);
        }
        return false;
    }

}
