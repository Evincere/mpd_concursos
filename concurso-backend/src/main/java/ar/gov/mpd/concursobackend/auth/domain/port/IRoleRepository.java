package ar.gov.mpd.concursobackend.auth.domain.port;

import java.util.Optional;


import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;

public interface IRoleRepository {
    Optional<Rol> findByRole(RoleEnum name);
    void create(Rol rol);
    boolean existsByRole(RoleEnum role);
}
