package ar.gov.mpd.concursobackend.auth.application.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.auth.application.port.IRolService;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleGetByRole;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class RolService implements IRolService {

    private RoleGetByRole findByRole;
    private RoleCreate roleCreate;
    private RoleExists roleExists;

    public RolService(@Autowired RoleGetByRole findByRole, @Autowired RoleCreate roleCreate, @Autowired RoleExists roleExists) {
        this.findByRole = findByRole;
        this.roleCreate = roleCreate;
        this.roleExists = roleExists;
    }

    @Override
    public Optional<Rol> findByRole(RoleEnum name) {
        return findByRole.run(name);
    }

    public void create(Rol rol) {
        roleCreate.run(rol);
    }

    @Override
    public boolean existsByRole(RoleEnum role) {
        return roleExists.runByRole(role);
    }
}
