package ar.gov.mpd.concursobackend.auth.application.usecase.role;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RoleExists {

    private final IRoleRepository roleRepository;

    public RoleExists(@Autowired IRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public boolean runByRole(RoleEnum role) {
        return roleRepository.existsByRole(role);
    }

}
