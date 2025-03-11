package ar.gov.mpd.concursobackend.document.domain.port;

import java.util.List;
import java.util.Optional;

import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;

public interface IDocumentTypeRepository {
    DocumentType save(DocumentType documentType);

    Optional<DocumentType> findById(DocumentTypeId id);

    List<DocumentType> findAll();

    void deleteById(DocumentTypeId id);

    boolean existsById(DocumentTypeId id);
}