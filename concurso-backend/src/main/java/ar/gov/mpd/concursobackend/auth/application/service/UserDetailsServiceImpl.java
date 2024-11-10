package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserAuthority;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = userService.getByUsername(
                new UserUsername(username)
        );
        
       /*  return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername().toString())
                .password(user.getPassword().toString())
                .authorities(user.getRoles().stream()
                        .map(rol -> new SimpleGrantedAuthority(rol.getRole().name()))
                        .collect(Collectors.toSet()))
                .build(); */
        
        return UserAuthority.build(user.get());
    }
}
