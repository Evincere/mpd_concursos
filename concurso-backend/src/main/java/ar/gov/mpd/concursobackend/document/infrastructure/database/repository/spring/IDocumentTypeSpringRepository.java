package ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;

@Repository
public interface IDocumentTypeSpringRepository extends JpaRepository<DocumentTypeEntity, UUID> {
    Optional<DocumentTypeEntity> findByCode(String code);

    List<DocumentTypeEntity> findByIsActiveTrue();

    boolean existsByCode(String code);
}