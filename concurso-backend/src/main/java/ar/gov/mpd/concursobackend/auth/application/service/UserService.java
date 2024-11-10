package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserGetByUsername;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.exception.EmailAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import jakarta.transaction.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserService implements IUserService {

    private final UserCreate userCreate;
    private final UserGetByUsername getByUsername;
    private final UserExists userExists;
    private final PasswordEncoder passwordEncoder;
    @Autowired
    RolService rolService;
    public UserService(@Autowired UserExists userExists, @Autowired UserCreate userCreate, @Autowired UserGetByUsername getByUserName, @Autowired PasswordEncoder passwordEncoder) {
        this.userCreate = userCreate;
        this.getByUsername = getByUserName;
        this.userExists = userExists;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public User createUser(UserCreateDto dto) {
        // Validar si el usuario ya existe
        if (existsByUsername(new UserUsername(dto.getUsername()))) {
            throw new UserAlreadyExistsException("El nombre de usuario ya está en uso");
        }
        
        if (existsByEmail(new UserEmail(dto.getEmail()))) {
            throw new EmailAlreadyExistsException("El email " + dto.getEmail() + " ya está registrado");
        }

        // Construir usuario
        User user = new User(
            new UserUsername(dto.getUsername()),
            new UserPassword(passwordEncoder.encode(dto.getPassword())),
            new UserEmail(dto.getEmail())
        );

         // Obtener y asignar roles
        Set<Rol> roles = new HashSet<>();
    
        // Siempre agregar ROLE_USER
        Rol userRole = rolService.findByRole(RoleEnum.ROLE_USER)
            .orElseThrow(() -> new RuntimeException("Error: Rol de usuario no encontrado"));
        roles.add(userRole);
        
        // Si se solicita rol admin
        if (dto.getRoles() != null && dto.getRoles().contains("admin")) {
            Rol adminRole = rolService.findByRole(RoleEnum.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Error: Rol de administrador no encontrado"));
            roles.add(adminRole);
        }

        user.setRoles(roles);

        // Guardar usuario
        return userCreate.run(user);
    }

    @Override
    public Optional<User> getByUsername(UserUsername username) {
        return getByUsername.run(username);
    }

    @Override
    public boolean existsByUsername(UserUsername username) {
        return userExists.runByUsername(username);
    }

    @Override
    public boolean existsByEmail(UserEmail email) {
        return userExists.runByEmail(email);
    }

}
