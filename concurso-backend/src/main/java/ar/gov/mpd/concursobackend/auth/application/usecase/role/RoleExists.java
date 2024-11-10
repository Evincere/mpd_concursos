package ar.gov.mpd.concursobackend.auth.application.usecase.role;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;

@Component
public class RoleExists {

    private IRoleRepository roleRepository;

    public RoleExists(@Autowired IRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public boolean runByRole(RoleEnum role) {
        return roleRepository.existsByRole(role);
    }

}
