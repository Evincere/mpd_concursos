package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;

@Repository
public interface ContestJpaRepository extends JpaRepository<ContestEntity, Long>, JpaSpecificationExecutor<ContestEntity> {
}
