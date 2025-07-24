package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestJpaRepository extends JpaRepository<ContestEntity, Long>, JpaSpecificationExecutor<ContestEntity> {
    List<ContestEntity> findByStatus(ContestStatus status);
}
