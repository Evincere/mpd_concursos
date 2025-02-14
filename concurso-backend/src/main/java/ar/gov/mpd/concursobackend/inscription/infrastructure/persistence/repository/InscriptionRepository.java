package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface InscriptionRepository extends JpaRepository<InscriptionEntity, UUID> {
    
} 