package ar.gov.mpd.concursobackend.auth.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

@Component
public class CreateRoles implements CommandLineRunner {

    @Autowired
    RolService rolService;
    @Autowired
    UserService userService;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Verificar si ya existen roles para evitar duplicados
            if (!rolService.existsByRole(RoleEnum.ROLE_ADMIN)) {
                Rol rolAdmin = new Rol(RoleEnum.ROLE_ADMIN);
                rolService.create(rolAdmin);
            }
            
            if (!rolService.existsByRole(RoleEnum.ROLE_USER)) {
                Rol rolUser = new Rol(RoleEnum.ROLE_USER);
                rolService.create(rolUser);
            }

            if (!userService.existsByUsername(new UserUsername("semper"))) {
                UserCreateDto user = new UserCreateDto();
                user.setEmail("spereyra@gmail.com");
                user.setUsername("semper");
                user.setPassword("123456");
                user.setDni("26598410");
                user.setCuit("20265984100");
                userService.createUser(user);
            }
        } catch (Exception e) {
           
            e.printStackTrace();
        }
    }
}
