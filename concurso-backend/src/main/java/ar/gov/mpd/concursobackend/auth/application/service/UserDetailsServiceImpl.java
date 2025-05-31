package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import jakarta.transaction.Transactional;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    @Lazy
    UserService userService;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // Verificar el estado del usuario
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new LockedException("Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.");
        } else if (user.getStatus() == UserStatus.LOCKED) {
            throw new LockedException("Su cuenta ha sido bloqueada temporalmente. Por favor, contacte al administrador para más información.");
        } else if (user.getStatus() == UserStatus.INACTIVE) {
            throw new DisabledException("Su cuenta está inactiva. Por favor, contacte al administrador para activarla.");
        } else if (user.getStatus() == UserStatus.EXPIRED) {
            throw new AccountExpiredException("Su cuenta ha expirado. Por favor, contacte al administrador para renovarla.");
        }

        // Construir UserDetails con la contraseña sin procesar
        return org.springframework.security.core.userdetails.User
            .withUsername(username)
            .password(user.getPassword().value()) // Usar el valor directo de la contraseña
            .authorities(user.getRoles().stream()
                .map(rol -> new SimpleGrantedAuthority(rol.getRole().name()))
                .collect(Collectors.toList()))
            .build();
    }
}
