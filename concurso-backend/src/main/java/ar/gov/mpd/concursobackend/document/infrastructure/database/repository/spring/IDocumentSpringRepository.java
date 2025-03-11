package ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;

@Repository
public interface IDocumentSpringRepository extends JpaRepository<DocumentEntity, UUID> {
    List<DocumentEntity> findByUserId(UUID userId);
}