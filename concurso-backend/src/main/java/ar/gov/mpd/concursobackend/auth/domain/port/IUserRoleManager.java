package ar.gov.mpd.concursobackend.auth.domain.port;

import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;

public interface IUserRoleManager {
    User addRole(User user, Rol role);

    User removeRole(User user, Rol role);
}
