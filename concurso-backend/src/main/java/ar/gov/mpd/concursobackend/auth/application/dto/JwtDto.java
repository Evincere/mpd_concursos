package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.Data;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Data
public class JwtDto {

    private String token;
    private String bearer = "Bearer";
    private String username;
    private Collection<? extends GrantedAuthority> authorities;
    private String cuit;

    public JwtDto() {}
    
    public JwtDto(String token, String username, Collection<? extends GrantedAuthority> authorities, String cuit) {
        this.token = token;
        this.username = username;
        this.authorities = authorities;
        this.cuit = cuit;

    }

}
