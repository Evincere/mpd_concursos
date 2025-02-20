package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExaminationJpaRepository extends JpaRepository<ExaminationEntity, UUID> {
} 