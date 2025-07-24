package ar.gov.mpd.concursobackend.document.infrastructure.persistence;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentSpringRepository;

import ar.gov.mpd.concursobackend.document.infrastructure.mapper.DocumentEntityMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DocumentRepositoryImpl implements IDocumentRepository {

    private final IDocumentSpringRepository documentSpringRepository;
    private final DocumentEntityMapper documentEntityMapper;

    // Logger específico para versioning debug
    private static final Logger versioningLog = LoggerFactory.getLogger("VERSIONING_DEBUG");

    @Override
    public Document save(Document document) {
        // LOGGING CRÍTICO: Capturar stack trace para ver quién llama
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
        String caller = "Unknown";
        for (int i = 3; i < Math.min(8, stackTrace.length); i++) {
            String className = stackTrace[i].getClassName();
            if (className.contains("ar.gov.mpd.concursobackend") &&
                !className.contains("DocumentRepositoryImpl")) {
                caller = className.substring(className.lastIndexOf('.') + 1) +
                        "." + stackTrace[i].getMethodName() + ":" + stackTrace[i].getLineNumber();
                break;
            }
        }

        // LOGGING CRÍTICO: Estado antes de mapear a entity
        versioningLog.error("💾 [REPO] BEFORE_MAPPING | ID: {} | Domain File: {} | FilePath: {} | Caller: {}",
            document.getId().value(), document.getFileName().value(), document.getFilePath(), caller);

        var entity = documentEntityMapper.toEntity(document);

        // LOGGING CRÍTICO: Estado después de mapear a entity
        versioningLog.error("💾 [REPO] AFTER_MAPPING  | ID: {} | Entity Version: {} | Entity File: {} | Entity FilePath: {}",
            entity.getId(), entity.getVersion(), entity.getFileName(), entity.getFilePath());

        var savedEntity = documentSpringRepository.save(entity);

        // LOGGING CRÍTICO: Estado después de save
        versioningLog.error("💾 [REPO] AFTER_JPA_SAVE | ID: {} | Final Version: {} | Final File: {} | Final FilePath: {}",
            savedEntity.getId(), savedEntity.getVersion(), savedEntity.getFileName(), savedEntity.getFilePath());

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

    @Override
    public long countByProcessingStatus(String processingStatus) {
        return documentSpringRepository.countByProcessingStatus(processingStatus);
    }

    @Override
    public List<Document> findActiveByUserId(UUID userId) {
        log.debug("🔍 [DocumentRepository] Searching active documents for userId: {}", userId);

        List<DocumentEntity> entities = documentSpringRepository.findActiveByUserId(userId);
        log.debug("📊 [DocumentRepository] Found {} active document entities", entities.size());

        return entities.stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Document> findActiveByUserAndType(UUID userId, DocumentTypeId documentTypeId) {
        log.debug("🔍 [DocumentRepository] Searching active document for userId: {} and documentTypeId: {}",
                userId, documentTypeId.value());

        return documentSpringRepository.findActiveByUserAndType(userId, documentTypeId.value())
                .map(documentEntityMapper::toDomain);
    }

    @Override
    public Optional<Document> findLatestActiveByUserAndType(UUID userId, DocumentTypeId documentTypeId) {
        log.debug("🔍 [DocumentRepository] Searching latest active document for userId: {} and documentTypeId: {}",
                userId, documentTypeId.value());

        return documentSpringRepository.findLatestActiveByUserAndType(userId, documentTypeId.value())
                .map(documentEntityMapper::toDomain);
    }

    @Override
    public List<Document> findArchivedByUserId(UUID userId) {
        log.debug("🔍 [DocumentRepository] Searching archived documents for userId: {}", userId);

        List<DocumentEntity> entities = documentSpringRepository.findArchivedByUserId(userId);
        log.debug("📊 [DocumentRepository] Found {} archived document entities", entities.size());

        return entities.stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Document> findVersionHistory(UUID userId, DocumentTypeId documentTypeId) {
        log.debug("🔍 [DocumentRepository] Searching document history for userId: {} and documentTypeId: {}",
                userId, documentTypeId.value());

        List<DocumentEntity> entities = documentSpringRepository.findVersionHistory(userId, documentTypeId.value());
        log.debug("📊 [DocumentRepository] Found {} documents in history", entities.size());

        return entities.stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Document> findAll() {
        log.debug("🔍 [DocumentRepository] Finding all documents");

        List<DocumentEntity> entities = documentSpringRepository.findAll();
        log.debug("📊 [DocumentRepository] Found {} total document entities", entities.size());

        return entities.stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Document> findByIdWithPessimisticLock(DocumentId id) {
        log.debug("🔒 [DocumentRepository] Finding document by ID with PESSIMISTIC_WRITE lock: {}", id.value());
        return documentSpringRepository.findByIdWithPessimisticLock(id.value())
                .map(documentEntityMapper::toDomain);
    }
}