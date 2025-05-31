package ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring;

import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IUserSpringRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByUsername(String userName);
    boolean existsByUsername(String userName);
    boolean existsByEmail(String email);
    boolean existsByDni(String dni);

    /**
     * Encuentra todos los usuarios con un estado específico
     * @param status Estado de usuario a filtrar
     * @return Lista de usuarios con el estado especificado
     */
    List<UserEntity> findByStatus(UserStatus status);
}
