package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import jakarta.transaction.Transactional;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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

        // Construir UserDetails con la contraseña sin procesar
        return org.springframework.security.core.userdetails.User
            .withUsername(username)
            .password(user.getPassword().getValue()) // Usar el valor directo de la contraseña
            .authorities(user.getRoles().stream()
                .map(rol -> new SimpleGrantedAuthority(rol.getRole().name()))
                .collect(Collectors.toList()))
            .build();
    }
}
