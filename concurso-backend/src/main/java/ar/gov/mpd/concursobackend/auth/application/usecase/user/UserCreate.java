package ar.gov.mpd.concursobackend.auth.application.usecase.user;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserCreate {

    private IUserRepository userRepository;

    public UserCreate(@Autowired IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User run(User user) {
        return this.userRepository.create(user);
    }
}
