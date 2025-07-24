package ar.gov.mpd.concursobackend.shared.infrastructure.database.repository;

import ar.gov.mpd.concursobackend.shared.domain.entities.DistributedLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DistributedLockRepository extends JpaRepository<DistributedLock, String> {
}
