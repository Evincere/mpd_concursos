package ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IRoleSpringRepository extends JpaRepository<RoleEntity, UUID> {
    
    Optional<RoleEntity> findByRole(RoleEnum name);
    boolean existsByRole(RoleEnum role);
}
