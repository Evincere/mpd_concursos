package ar.gov.mpd.concursobackend.document.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentSpringRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.mapper.DocumentEntityMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DocumentRepositoryImpl implements IDocumentRepository {

    private final IDocumentSpringRepository documentSpringRepository;
    private final DocumentEntityMapper documentEntityMapper;

    @Override
    public Document save(Document document) {
        var entity = documentEntityMapper.toEntity(document);
        var savedEntity = documentSpringRepository.save(entity);
        return documentEntityMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Document> findById(DocumentId id) {
        return documentSpringRepository.findById(id.value())
                .map(documentEntityMapper::toDomain);
    }

    @Override
    public List<Document> findByUserId(UUID userId) {
        log.debug("🔍 [DocumentRepository] Searching documents for userId: {}", userId);

        List<DocumentEntity> entities = documentSpringRepository.findByUserId(userId);
        log.debug("📊 [DocumentRepository] Found {} document entities", entities.size());

        if (!entities.isEmpty()) {
            log.debug("📄 [DocumentRepository] First entity: id={}, userId={}, fileName={}",
                entities.get(0).getId(), entities.get(0).getUserId(), entities.get(0).getFileName());
        }

        List<Document> documents = entities.stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());

        log.debug("✅ [DocumentRepository] Mapped {} documents to domain", documents.size());

        return documents;
    }

    @Override
    public void deleteById(DocumentId id) {
        documentSpringRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(DocumentId id) {
        return documentSpringRepository.existsById(id.value());
    }

    @Override
    public long countByStatus(String status) {
        return documentSpringRepository.countByStatus(status);
    }
}