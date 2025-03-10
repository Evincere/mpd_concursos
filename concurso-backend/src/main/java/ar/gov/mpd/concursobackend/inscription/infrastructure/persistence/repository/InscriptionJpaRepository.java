package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InscriptionJpaRepository extends JpaRepository<InscriptionEntity, byte[]> {
    Page<InscriptionEntity> findAllByUserId(byte[] userId, Pageable pageable);

    Optional<InscriptionEntity> findByContestIdAndUserId(Long contestId, byte[] userId);

    Optional<InscriptionEntity> findByContestIdAndUserIdAndStatusNot(Long contestId, byte[] userId,
            InscriptionStatus status);
}