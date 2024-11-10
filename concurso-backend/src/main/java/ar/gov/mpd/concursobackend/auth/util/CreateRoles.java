package ar.gov.mpd.concursobackend.auth.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;

@Component
public class CreateRoles implements CommandLineRunner {

    @Autowired
    RolService rolService;

    @Override
    public void run(String... args) throws Exception {
        // Verificar si ya existen roles para evitar duplicados
        if (!rolService.existsByRole(RoleEnum.ROLE_ADMIN)) {
            Rol rolAdmin = new Rol(RoleEnum.ROLE_ADMIN);
            rolService.create(rolAdmin);
        }
        
        if (!rolService.existsByRole(RoleEnum.ROLE_USER)) {
            Rol rolUser = new Rol(RoleEnum.ROLE_USER);
            rolService.create(rolUser);
        }
    }
}
