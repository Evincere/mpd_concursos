package ar.gov.mpd.concursobackend.auth.application.port;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

import java.util.Optional;

public interface IUserService {
    User createUser(UserCreateDto dto);
    Optional<User> getByUsername(UserUsername username);
    boolean existsByUsername(UserUsername username);
    boolean existsByEmail(UserEmail email);
    JwtDto login(UserLogin userLogin);
}
