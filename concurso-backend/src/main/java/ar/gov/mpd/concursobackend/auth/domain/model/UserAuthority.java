package ar.gov.mpd.concursobackend.auth.domain.model;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.Getter;

@Getter
public class UserAuthority implements UserDetails {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private UserUsername username;
    private UserPassword password;
    private Collection<? extends GrantedAuthority> authorities;
    
    public UserAuthority(UserUsername username, UserPassword password, Collection<? extends GrantedAuthority> authorities) {
        this.username = username;
        this.password = password;
        this.authorities = authorities;
    }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
       return authorities;
    }
    @Override
    public String getPassword() {
        return (password != null) ? password.toString() : null;
    }
    @Override
    public String getUsername() {
        return username != null ? username.toString() : null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public static UserAuthority build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream().map(rol -> new SimpleGrantedAuthority(rol.getRole().name())).collect(Collectors.toList());
        return new UserAuthority(user.getUsername(), user.getPassword(), authorities);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserAuthority that = (UserAuthority) o;
        return Objects.equals(username, that.username) &&
               Objects.equals(password, that.password) &&
               Objects.equals(authorities, that.authorities);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username, password, authorities);
    }
}
