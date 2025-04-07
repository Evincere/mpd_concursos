package ar.gov.mpd.concursobackend.document.domain.port;

import java.util.List;
import java.util.Optional;

import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;

public interface IDocumentTypeRepository {
    DocumentType save(DocumentType documentType);

    Optional<DocumentType> findById(DocumentTypeId id);

    Optional<DocumentType> findByCode(String code);

    List<DocumentType> findAll();

    List<DocumentType> findAllActive();

    void deleteById(DocumentTypeId id);

    boolean existsById(DocumentTypeId id);

    boolean existsByCode(String code);
}