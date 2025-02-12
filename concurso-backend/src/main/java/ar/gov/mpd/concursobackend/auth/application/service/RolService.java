package ar.gov.mpd.concursobackend.auth.application.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.auth.application.port.IRolService;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleGetByRole;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserGetByUsername;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRoleManager;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class RolService implements IRolService {

    private final RoleGetByRole findByRole;
    private final RoleCreate roleCreate;
    private final RoleExists roleExists;
    private final UserGetByUsername userGetByUsername;
    private final IUserRoleManager userRoleManager;

    public RolService(@Autowired RoleGetByRole findByRole, @Autowired RoleCreate roleCreate,
            @Autowired RoleExists roleExists, @Autowired UserGetByUsername userGetByUsername,
            @Autowired IUserRoleManager userRoleManager) {
        this.findByRole = findByRole;
        this.roleCreate = roleCreate;
        this.roleExists = roleExists;
        this.userGetByUsername = userGetByUsername;
        this.userRoleManager = userRoleManager;
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

    @Transactional
    public void assignRoleToUser(String username, RoleEnum roleEnum) {
        User user = userGetByUsername.run(new UserUsername(username))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Rol role = findByRole(roleEnum)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));

        userRoleManager.addRole(user, role);
    }

    @Transactional
    public void removeRoleFromUser(String username, RoleEnum roleEnum) {
        User user = userGetByUsername.run(new UserUsername(username))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Rol role = findByRole(roleEnum)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));

        userRoleManager.removeRole(user, role);
    }
}
