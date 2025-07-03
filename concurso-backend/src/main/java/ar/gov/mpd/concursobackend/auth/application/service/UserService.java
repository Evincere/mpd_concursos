package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.audit.application.service.AuditService;
import ar.gov.mpd.concursobackend.audit.domain.model.AuditEventType;
import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.application.usecase.role.RoleGetByRole;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserCreate;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserExists;
import ar.gov.mpd.concursobackend.auth.application.usecase.user.UserGetByUsername;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.exception.*;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRoleManager;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService implements IUserService, IUserRoleManager {
  private static final Logger logger = LoggerFactory.getLogger(UserService.class);

  private final UserCreate userCreate;
  private final UserGetByUsername getByUsername;
  private final UserExists userExists;
  private final PasswordEncoder passwordEncoder;
  private final RoleGetByRole findByRole;
  private final IUserRepository userRepository;
  private final AuditService auditService;
  private final HttpServletRequest request;

  @Autowired
  @Lazy
  private AuthenticationManager authenticationManager;
  @Autowired
  @Lazy
  private JwtProvider jwtProvider;

  public UserService(@Autowired UserExists userExists,
      @Autowired UserCreate userCreate,
      @Autowired UserGetByUsername getByUserName,
      @Autowired PasswordEncoder passwordEncoder,
      @Autowired RoleGetByRole findByRole,
      @Autowired IUserRepository userRepository,
      @Autowired AuditService auditService,
      @Autowired HttpServletRequest request) {
    this.userCreate = userCreate;
    this.getByUsername = getByUserName;
    this.userExists = userExists;
    this.passwordEncoder = passwordEncoder;
    this.findByRole = findByRole;
    this.userRepository = userRepository;
    this.auditService = auditService;
    this.request = request;
  }

  @Override
  @Transactional
  public User createUser(UserCreateDto dto) {
    validateNewUserCredentials(dto);

    String encodedPassword = passwordEncoder.encode(dto.getPassword());

    // Crear usuario con los campos básicos
    User user = new User(
        new UserUsername(dto.getUsername()),
        new UserPassword(encodedPassword),
        new UserEmail(dto.getEmail()),
        new UserDni(dto.getDni()),
        new UserCuit(dto.getCuit()),
        dto.getFirstName(),
        dto.getLastName());

    // Establecer los campos adicionales si están presentes
    if (dto.getBirthDate() != null) {
        user.setBirthDate(new UserBirthDate(dto.getBirthDate()));
    }
    if (dto.getCountry() != null) {
        user.setCountry(new UserCountry(dto.getCountry()));
    }
    if (dto.getProvince() != null) {
        user.setProvince(new UserProvince(dto.getProvince()));
    }
    if (dto.getMunicipality() != null) {
        user.setMunicipality(new UserMunicipality(dto.getMunicipality()));
    }
    if (dto.getLegalAddress() != null) {
        user.setLegalAddress(new UserLegalAddress(dto.getLegalAddress()));
    }
    if (dto.getResidentialAddress() != null) {
        user.setResidentialAddress(new UserResidentialAddress(dto.getResidentialAddress()));
    }
    if (dto.getTelefono() != null) {
        user.setTelefono(dto.getTelefono());
    }

    // Asignar rol de usuario por defecto
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

      // Verificar el estado del usuario antes de intentar autenticar
      User user = getByUsername(new UserUsername(userLogin.getUsername()))
          .orElseThrow(() -> {
            logger.error("Usuario no encontrado: {}", userLogin.getUsername());
            return new InvalidCredentialsException("El usuario no existe");
          });

      // Verificar el estado del usuario
      if (user.getStatus() == UserStatus.BLOCKED) {
        logger.warn("Intento de login en cuenta bloqueada: {}", userLogin.getUsername());
        throw new BlockedAccountException("Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.");
      } else if (user.getStatus() == UserStatus.LOCKED) {
        logger.warn("Intento de login en cuenta bloqueada temporalmente: {}", userLogin.getUsername());
        throw new BlockedAccountException("Su cuenta ha sido bloqueada temporalmente. Por favor, contacte al administrador para más información.");
      } else if (user.getStatus() == UserStatus.INACTIVE) {
        logger.warn("Intento de login en cuenta inactiva: {}", userLogin.getUsername());
        throw new InactiveAccountException("Su cuenta está inactiva. Por favor, contacte al administrador para activarla.");
      } else if (user.getStatus() == UserStatus.EXPIRED) {
        logger.warn("Intento de login en cuenta expirada: {}", userLogin.getUsername());
        throw new ExpiredAccountException("Su cuenta ha expirado. Por favor, contacte al administrador para renovarla.");
      }

      // Intentar autenticar
      Authentication authentication;
      try {
        authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                userLogin.getUsername(),
                userLogin.getPassword()));
      } catch (BadCredentialsException e) {
        logger.error("Credenciales incorrectas para usuario: {}", userLogin.getUsername());
        throw new InvalidCredentialsException("Contraseña incorrecta");
      } catch (LockedException e) {
        logger.warn("Intento de login en cuenta bloqueada: {}", userLogin.getUsername());
        throw new BlockedAccountException("Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.");
      } catch (DisabledException e) {
        logger.warn("Intento de login en cuenta inactiva: {}", userLogin.getUsername());
        throw new InactiveAccountException("Su cuenta está inactiva. Por favor, contacte al administrador para activarla.");
      } catch (AccountExpiredException e) {
        logger.warn("Intento de login en cuenta expirada: {}", userLogin.getUsername());
        throw new ExpiredAccountException("Su cuenta ha expirado. Por favor, contacte al administrador para renovarla.");
      } catch (Exception e) {
        logger.error("Error durante la autenticación: {}", e.getMessage());
        throw new InvalidCredentialsException("Error en la autenticación");
      }

      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Obtener los detalles del usuario autenticado
      UserDetails userDetails = (UserDetails) authentication.getPrincipal();

      // Obtener el usuario nuevamente para asegurarnos de tener la información más actualizada
      user = getByUsername(new UserUsername(userDetails.getUsername()))
          .orElseThrow(() -> {
            logger.error("Usuario no encontrado después de la autenticación: {}",
                userDetails.getUsername());
            return new RuntimeException("Usuario no encontrado después de la autenticación");
          });

      String jwt = jwtProvider.generateToken(authentication, user);
      logger.info("Token generado exitosamente para el usuario: {}", userDetails.getUsername());

      auditService.logEvent(
          AuditEventType.LOGIN_SUCCESS,
          userLogin.getUsername(),
          "User logged in successfully.",
          "SUCCESS"
      );

      // Manejar el caso cuando el CUIT es null
      String cuitValue = user.getCuit() != null ? user.getCuit().value() : null;
      return new JwtDto(jwt, userDetails.getUsername(), userDetails.getAuthorities(), cuitValue);
    } catch (InvalidCredentialsException | BlockedAccountException | InactiveAccountException | ExpiredAccountException e) {
      auditService.logEvent(
          AuditEventType.LOGIN_FAILURE,
          userLogin.getUsername(),
          e.getMessage(),
          "FAILURE"
      );
      throw e; // Re-lanzar excepciones específicas
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

    // Actualizar los campos básicos
    existingUser.setFirstName(user.getFirstName());
    existingUser.setLastName(user.getLastName());
    existingUser.setDni(user.getDni());
    existingUser.setCuit(user.getCuit());
    existingUser.setTelefono(user.getTelefono());
    existingUser.setDireccion(user.getDireccion());

    // Actualizar los campos adicionales
    existingUser.setBirthDate(user.getBirthDate());
    existingUser.setCountry(user.getCountry());
    existingUser.setProvince(user.getProvince());
    existingUser.setMunicipality(user.getMunicipality());
    existingUser.setLegalAddress(user.getLegalAddress());
    existingUser.setResidentialAddress(user.getResidentialAddress());

    // Actualizar las listas
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

  /**
   * Get a user by ID
   * @param id User ID
   * @return Optional containing the user if found
   */
  @Override
  public Optional<User> getById(UUID id) {
    logger.debug("Getting user by ID: {}", id);
    return userRepository.findById(id);
  }

  /**
   * Get all users with a specific role
   * @param role Role to filter by
   * @return List of users with the specified role
   */
  @Override
  public List<User> findUsersByRole(RoleEnum role) {
    logger.debug("Finding users with role: {}", role);

    // Get the role entity
    Optional<Rol> roleOpt = findByRole.run(role);
    if (roleOpt.isEmpty()) {
      logger.warn("Role not found: {}", role);
      return new ArrayList<>();
    }

    Rol roleEntity = roleOpt.get();

    // Get all users
    List<User> allUsers = userRepository.findAll();

    // Filter users by role
    return allUsers.stream()
        .filter(user -> user.getRoles() != null && user.getRoles().contains(roleEntity))
        .collect(Collectors.toList());
  }

  /**
   * Get all users
   * @return List of all users
   */
  @Override
  public List<User> findAll() {
    logger.debug("Finding all users");
    return userRepository.findAll();
  }

  /**
   * Get all users with a specific status
   * @param status Status to filter by
   * @return List of users with the specified status
   */
  @Override
  public List<User> findUsersByStatus(UserStatus status) {
    logger.debug("Finding users with status: {}", status);
    return userRepository.findByStatus(status);
  }

  @Override
  public boolean deleteUser(UUID id) {
    logger.debug("Deleting user with ID: {}", id);
    try {
      // Verificar si el usuario existe
      Optional<User> userOptional = getById(id);
      if (userOptional.isEmpty()) {
        logger.warn("User with ID {} not found", id);
        return false;
      }

      // Eliminar el usuario del repositorio
      userRepository.deleteById(id);
      logger.info("User with ID {} deleted successfully", id);
      return true;
    } catch (Exception e) {
      logger.error("Error deleting user with ID {}: {}", id, e.getMessage(), e);
      return false;
    }
  }

  /**
   * Debug method to get all users with basic information
   * @return List of user debug information
   */
  public List<UserDebugInfo> getAllUsersDebug() {
    logger.debug("Getting all users for debug");
    List<User> users = userRepository.findAll();
    return users.stream()
        .map(user -> new UserDebugInfo(
            user.getId().value(),
            user.getUsername().value(),
            user.getEmail().value(),
            user.getPassword().value().substring(0, Math.min(20, user.getPassword().value().length())) + "...",
            user.getRoles().stream().map(role -> role.getRole().name()).collect(Collectors.joining(", ")),
            user.getStatus().name()
        ))
        .collect(Collectors.toList());
  }

  public static class UserDebugInfo {
    private final UUID id;
    private final String username;
    private final String email;
    private final String passwordPreview;
    private final String roles;
    private final String status;

    public UserDebugInfo(UUID id, String username, String email, String passwordPreview, String roles, String status) {
      this.id = id;
      this.username = username;
      this.email = email;
      this.passwordPreview = passwordPreview;
      this.roles = roles;
      this.status = status;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordPreview() { return passwordPreview; }
    public String getRoles() { return roles; }
    public String getStatus() { return status; }
  }
}
