package ar.gov.mpd.concursobackend.auth.application.port;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IUserService {
    User createUser(UserCreateDto dto);

    Optional<User> getByUsername(UserUsername username);

    boolean existsByUsername(UserUsername username);

    boolean existsByEmail(UserEmail email);

    JwtDto login(UserLogin userLogin);

    boolean existsByDni(UserDni dni);

    User updateUser(User user);

    User updateProfile(User user);

    /**
     * Get a user by ID
     * @param id User ID
     * @return Optional containing the user if found
     */
    Optional<User> getById(UUID id);

    /**
     * Get all users with a specific role
     * @param role Role to filter by
     * @return List of users with the specified role
     */
    List<User> findUsersByRole(RoleEnum role);

    /**
     * Get all users
     * @return List of all users
     */
    List<User> findAll();

    /**
     * Get all users with a specific status
     * @param status Status to filter by
     * @return List of users with the specified status
     */
    List<User> findUsersByStatus(UserStatus status);

    /**
     * Delete a user by ID
     * @param id User ID to delete
     * @return true if the user was deleted, false otherwise
     */
    boolean deleteUser(UUID id);
}
