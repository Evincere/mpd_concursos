package ar.gov.mpd.concursobackend.auth.application.usecase.role;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class RoleGetByRole {

    private final IRoleRepository roleRepository;

    public RoleGetByRole(@Autowired IRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Optional<Rol> run(RoleEnum name) {
        return roleRepository.findByRole(name);
    }
}
