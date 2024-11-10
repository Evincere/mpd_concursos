package ar.gov.mpd.concursobackend.auth.application.usecase.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

@Component
public class UserExists {

    private IUserRepository userRepository;

    public UserExists(@Autowired IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean runByUsername(UserUsername username) {
        return userRepository.existsByUsername(username);
    }

    public boolean runByEmail(UserEmail email) {
        return userRepository.existsByEmail(email);
    }

}
