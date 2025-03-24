package ar.gov.mpd.concursobackend.auth.infrastructure.database.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;

/**
 * JPA Repository for accessing User entities
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    /**
     * Find a user by username
     * 
     * @param username Username to search for
     * @return Optional containing the user if found
     */
    Optional<UserEntity> findByUsername(String username);

    /**
     * Find a user by email
     * 
     * @param email Email to search for
     * @return Optional containing the user if found
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * Find a user by DNI
     * 
     * @param dni DNI to search for
     * @return Optional containing the user if found
     */
    Optional<UserEntity> findByDni(String dni);
}