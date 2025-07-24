package ar.gov.mpd.concursobackend.document.domain.port;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IDocumentRepository {
    Document save(Document document);

    Optional<Document> findById(DocumentId id);

    List<Document> findByUserId(UUID userId);

    void deleteById(DocumentId id);

    boolean existsById(DocumentId id);

    /**
     * Count documents by status
     *
     * @param status The status to count
     * @return The number of documents with the given status
     */
    long countByStatus(String status);

    /**
     * Count documents by processing status
     *
     * @param processingStatus The processing status to count
     * @return The number of documents with the given processing status
     */
    long countByProcessingStatus(String processingStatus);

    /**
     * Busca documentos activos (no archivados) por usuario
     */
    List<Document> findActiveByUserId(UUID userId);

    /**
     * Busca documento activo por usuario y tipo de documento
     */
    Optional<Document> findActiveByUserAndType(UUID userId, DocumentTypeId documentTypeId);

    /**
     * Busca el documento activo más reciente por usuario y tipo de documento
     * Ordenado por fecha de subida (más reciente primero)
     */
    Optional<Document> findLatestActiveByUserAndType(UUID userId, DocumentTypeId documentTypeId);

    /**
     * Busca documentos archivados por usuario
     */
    List<Document> findArchivedByUserId(UUID userId);

    /**
     * Busca historial de versiones para un tipo de documento
     */
    List<Document> findVersionHistory(UUID userId, DocumentTypeId documentTypeId);

    /**
     * Obtiene todos los documentos del sistema
     */
    List<Document> findAll();

    /**
     * Busca un documento por su ID y aplica un bloqueo pesimista de escritura.
     * Esto previene que otras transacciones lean o escriban en esta fila hasta que la transacción actual termine.
     *
     * @param id El ID del documento a buscar.
     * @return Un Optional que contiene el documento si se encuentra, o vacío si no.
     */
    Optional<Document> findByIdWithPessimisticLock(DocumentId id);
}