package ar.gov.mpd.concursobackend.auth.domain.port;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;

import java.util.Optional;

public interface IRoleRepository {
    Optional<Rol> findByRole(RoleEnum name);
    void create(Rol rol);
    boolean existsByRole(RoleEnum role);
}
