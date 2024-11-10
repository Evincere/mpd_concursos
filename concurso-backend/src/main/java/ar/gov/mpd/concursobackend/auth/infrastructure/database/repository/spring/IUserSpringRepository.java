package ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository 
public interface IUserSpringRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByUsername(String userName);
    boolean existsByUsername(String userName);
    boolean existsByEmail(String email);

}
