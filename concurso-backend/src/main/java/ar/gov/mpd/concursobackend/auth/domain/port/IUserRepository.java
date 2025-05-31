package ar.gov.mpd.concursobackend.auth.domain.port;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IUserRepository {

    User create(User user);

    Optional<User> getByUsername(UserUsername username);

    Optional<User> findById(UUID id);

    boolean existsByUsername(UserUsername userName);

    boolean existsByEmail(UserEmail email);

    boolean existsByDni(UserDni dni);

    /**
     * Obtiene todos los usuarios registrados en el sistema.
     *
     * @return Lista de todos los usuarios
     */
    List<User> findAll();

    /**
     * Obtiene todos los usuarios con un estado específico.
     *
     * @param status Estado de usuario a filtrar
     * @return Lista de usuarios con el estado especificado
     */
    List<User> findByStatus(UserStatus status);

    /**
     * Elimina un usuario por su ID.
     *
     * @param id ID del usuario a eliminar
     */
    void deleteById(UUID id);
}
