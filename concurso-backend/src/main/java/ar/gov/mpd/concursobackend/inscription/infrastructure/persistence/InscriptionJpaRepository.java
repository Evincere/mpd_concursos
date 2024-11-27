package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence;

import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InscriptionJpaRepository extends JpaRepository<InscriptionEntity, Long> {
} 