package ar.gov.mpd.concursobackend.auth.domain.port;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

import java.util.Optional;

public interface IUserRepository {

    User create(User user);
    Optional<User> getByUsername(UserUsername username);
    boolean existsByUsername(UserUsername userName);
    boolean existsByEmail(UserEmail email);
    boolean existsByDni(UserDni dni);
}
