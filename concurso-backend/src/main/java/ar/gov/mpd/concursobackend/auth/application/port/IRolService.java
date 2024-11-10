package ar.gov.mpd.concursobackend.auth.application.port;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import java.util.Optional;

public interface IRolService {
    Optional<Rol> findByRole(RoleEnum name);
    boolean existsByRole(RoleEnum roleAdmin);
} 