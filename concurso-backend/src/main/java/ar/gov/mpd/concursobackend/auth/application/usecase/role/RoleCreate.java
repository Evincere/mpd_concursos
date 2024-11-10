package ar.gov.mpd.concursobackend.auth.application.usecase.role;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;

@Component
public class RoleCreate {

    private IRoleRepository roleRepository;

    public RoleCreate(@Autowired IRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public void run(Rol rol) {
        this.roleRepository.create(rol);
    }
}
