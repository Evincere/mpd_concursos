package ar.gov.mpd.concursobackend.auth.application.usecase.user;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UserGetByUsername {
    private final IUserRepository userRepository;

    public UserGetByUsername(@Autowired IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> run(UserUsername username) {
        return userRepository.getByUsername(username);
    }
}
