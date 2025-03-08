package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.repository;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationSessionEntity;

@Repository
public interface ExaminationSessionJpaRepository extends JpaRepository<ExaminationSessionEntity, UUID> {
    Optional<ExaminationSessionEntity> findByExaminationId(UUID examinationId);
}