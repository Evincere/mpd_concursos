package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExaminationSessionJpaRepository extends JpaRepository<ExaminationSessionEntity, UUID> {
    Optional<ExaminationSessionEntity> findByExaminationId(UUID examinationId);

    // Buscar sesión por examen y usuario
    Optional<ExaminationSessionEntity> findByExaminationIdAndUserId(UUID examinationId, UUID userId);

    // Buscar todas las sesiones de un usuario
    List<ExaminationSessionEntity> findByUserId(UUID userId);

    // Buscar sesiones por examen, usuario y estado
    Optional<ExaminationSessionEntity> findByExaminationIdAndUserIdAndStatus(
            UUID examinationId,
            UUID userId,
            ExaminationSessionStatus status);

    // Verificar si existe una sesión finalizada para un examen y usuario
    boolean existsByExaminationIdAndUserIdAndStatus(
            UUID examinationId,
            UUID userId,
            ExaminationSessionStatus status);
}