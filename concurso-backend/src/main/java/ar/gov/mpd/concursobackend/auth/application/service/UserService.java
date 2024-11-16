package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserGetByUsername;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.exception.EmailAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCredentialsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidPasswordException;
import jakarta.transaction.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserService implements IUserService {

    private final UserCreate userCreate;
    private final UserGetByUsername getByUsername;
    private final UserExists userExists;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class); 
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtProvider jwtProvider;

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
        validateNewUserCredentials(dto);
        
        // Codificar la contraseña con BCrypt
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        System.out.println("Contraseña codificada: " + encodedPassword); // Para debug

        // Construir usuario
        User user = new User(
            new UserUsername(dto.getUsername()),
            new UserPassword(encodedPassword), // Usar la contraseña codificada
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

    private void validateNewUserCredentials(UserCreateDto dto) {
        validateUsername(dto.getUsername());
        validateEmail(dto.getEmail());
        validatePassword(dto.getPassword());
    }

    private void validateUsername(String username) {
        if (existsByUsername(new UserUsername(username))) {
            throw new UserAlreadyExistsException("El nombre de usuario ya está en uso");
        }
    }

    private void validateEmail(String email) {
        if (existsByEmail(new UserEmail(email))) {
            throw new EmailAlreadyExistsException("El email " + email + " ya está registrado");
        }
    }

    private void validatePassword(String password) {
        try {
            new UserPassword(password);
        } catch (IllegalArgumentException e) {
            throw new InvalidPasswordException("La contraseña debe tener al menos 6 caracteres");
        }
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


    @Override
    public JwtDto login(UserLogin userLogin) {
        try {
            logger.info("Intentando autenticar al usuario: {}", userLogin.getUsername());
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    userLogin.getUsername(),
                    userLogin.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtProvider.generateToken(authentication);
            logger.info("token: {}", jwt);
            // Obtener los detalles del usuario autenticado
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            logger.info("Autenticación exitosa para el usuario: {}", userDetails.getUsername());
            return new JwtDto(jwt, userDetails.getUsername(), userDetails.getAuthorities());
        } catch (Exception e) {
            logger.error("Error al autenticar al usuario: {}", e.getMessage());
            throw new InvalidCredentialsException("Credenciales inválidas. Por favor, verifica tu nombre de usuario y contraseña.");
        }
    }

}
