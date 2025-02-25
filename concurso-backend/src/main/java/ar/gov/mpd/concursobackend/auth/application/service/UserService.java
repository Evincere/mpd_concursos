package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserGetByUsername;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleGetByRole;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserDniAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.exception.EmailAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRoleManager;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
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
import java.util.stream.Collectors;

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
public class UserService implements IUserService, IUserRoleManager {
  private static final Logger logger = LoggerFactory.getLogger(UserService.class);

  private final UserCreate userCreate;
  private final UserGetByUsername getByUsername;
  private final UserExists userExists;
  private final PasswordEncoder passwordEncoder;
  private final RoleGetByRole findByRole;

  @Autowired
  private AuthenticationManager authenticationManager;
  @Autowired
  private JwtProvider jwtProvider;

  public UserService(@Autowired UserExists userExists,
      @Autowired UserCreate userCreate,
      @Autowired UserGetByUsername getByUserName,
      @Autowired PasswordEncoder passwordEncoder,
      @Autowired RoleGetByRole findByRole) {
    this.userCreate = userCreate;
    this.getByUsername = getByUserName;
    this.userExists = userExists;
    this.passwordEncoder = passwordEncoder;
    this.findByRole = findByRole;
  }

  @Override
  @Transactional
  public User createUser(UserCreateDto dto) {
    validateNewUserCredentials(dto);

    String encodedPassword = passwordEncoder.encode(dto.getPassword());

    User user = new User(
        new UserUsername(dto.getUsername()),
        new UserPassword(encodedPassword),
        new UserEmail(dto.getEmail()),
        new UserDni(dto.getDni()),
        new UserCuit(dto.getCuit()),
        dto.getNombre(),
        dto.getApellido());

    Set<Rol> roles = new HashSet<>();
    Rol userRole = findByRole.run(RoleEnum.ROLE_USER)
        .orElseThrow(() -> new RuntimeException("Error: Rol de usuario no encontrado"));
    roles.add(userRole);
    user.setRoles(roles);

    logger.info("Creando usuario con username: {} y roles: {}",
        dto.getUsername(),
        roles.stream().map(rol -> rol.getRole().name()).collect(Collectors.joining(", ")));

    User createdUser = userCreate.run(user);

    logger.info("Usuario creado con ID: {}, Username: {} y roles: {}",
        createdUser.getId().value(),
        createdUser.getUsername().value(),
        createdUser.getRoles().stream().map(rol -> rol.getRole().name()).collect(Collectors.joining(", ")));

    return createdUser;
  }

  private void validateNewUserCredentials(UserCreateDto dto) {
    validateUsername(dto.getUsername());
    validateEmail(dto.getEmail());
    validateDni(dto.getDni());
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

  private void validateDni(String dni) {
    if (existsByDni(new UserDni(dni))) {
      throw new UserDniAlreadyExistsException("El usuario con dni " + dni + " ya está registrado");
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
  public boolean existsByDni(UserDni dni) {
    return userExists.runByDni(dni);
  }

  @Override
  public JwtDto login(UserLogin userLogin) {
    try {
      logger.info("Intentando autenticar al usuario: {}", userLogin.getUsername());

      // Verificar si el usuario existe antes de intentar autenticar
      if (!existsByUsername(new UserUsername(userLogin.getUsername()))) {
        logger.error("Usuario no encontrado: {}", userLogin.getUsername());
        throw new InvalidCredentialsException("El usuario no existe");
      }

      // Intentar autenticar
      Authentication authentication;
      try {
        authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                userLogin.getUsername(),
                userLogin.getPassword()));
      } catch (Exception e) {
        logger.error("Error durante la autenticación: {}", e.getMessage());
        throw new InvalidCredentialsException("Contraseña incorrecta");
      }

      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Obtener los detalles del usuario autenticado
      UserDetails userDetails = (UserDetails) authentication.getPrincipal();
      User user = getByUsername(new UserUsername(userDetails.getUsername()))
          .orElseThrow(() -> {
            logger.error("Usuario no encontrado después de la autenticación: {}",
                userDetails.getUsername());
            return new RuntimeException("Usuario no encontrado después de la autenticación");
          });

      String jwt = jwtProvider.generateToken(authentication, user);
      logger.info("Token generado exitosamente para el usuario: {}", userDetails.getUsername());

      return new JwtDto(jwt, userDetails.getUsername(), userDetails.getAuthorities(), user.getCuit().value());
    } catch (InvalidCredentialsException e) {
      throw e; // Re-lanzar excepciones específicas de credenciales
    } catch (Exception e) {
      logger.error("Error inesperado durante el login: {}", e.getMessage(), e);
      throw new RuntimeException("Error inesperado durante la autenticación");
    }
  }

  @Transactional
  public User updateProfile(User user) {
    // Validar que el usuario existe
    User existingUser = getByUsername(user.getUsername())
        .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

    // Validar DNI único si ha cambiado
    if (!existingUser.getDni().value().equals(user.getDni().value()) &&
        existsByDni(user.getDni())) {
      throw new UserDniAlreadyExistsException("El DNI ya está registrado");
    }

    // Actualizar los campos permitidos
    existingUser.setFirstName(user.getFirstName());
    existingUser.setLastName(user.getLastName());
    existingUser.setDni(user.getDni());
    existingUser.setCuit(user.getCuit());
    existingUser.setTelefono(user.getTelefono());
    existingUser.setDireccion(user.getDireccion());
    existingUser.setExperiencias(user.getExperiencias());
    existingUser.setEducacion(user.getEducacion());
    existingUser.setHabilidades(user.getHabilidades());

    return userCreate.run(existingUser);
  }

  @Override
  public User addRole(User user, Rol role) {
    Set<Rol> roles = user.getRoles();
    if (!roles.contains(role)) {
      roles.add(role);
      user.setRoles(roles);
      return userCreate.run(user);
    }
    return user;
  }

  @Override
  public User removeRole(User user, Rol role) {
    Set<Rol> roles = user.getRoles();
    if (roles.contains(role)) {
      roles.remove(role);
      user.setRoles(roles);
      return userCreate.run(user);
    }
    return user;
  }

  @Override
  public User updateUser(User user) {
    return userCreate.run(user);
  }
}
