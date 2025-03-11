package ar.gov.mpd.concursobackend.document.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;

public interface IDocumentRepository {
    Document save(Document document);

    Optional<Document> findById(DocumentId id);

    List<Document> findByUserId(UUID userId);

    void deleteById(DocumentId id);

    boolean existsById(DocumentId id);
}