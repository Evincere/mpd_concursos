package ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring;

import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IDocumentSpringRepository extends JpaRepository<DocumentEntity, UUID> {
    List<DocumentEntity> findByUserId(UUID userId);

    long countByStatus(String status);

    long countByProcessingStatus(String processingStatus);

    // Métodos para manejo de duplicidad

    /**
     * Busca documentos activos (no archivados) por usuario
     */
    @Query("SELECT d FROM DocumentEntity d WHERE d.userId = :userId AND d.isArchived = false")
    List<DocumentEntity> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Busca documento activo por usuario y tipo de documento
     */
    @Query("SELECT d FROM DocumentEntity d WHERE d.userId = :userId AND d.documentType.id = :documentTypeId AND d.isArchived = false")
    Optional<DocumentEntity> findActiveByUserAndType(@Param("userId") UUID userId, @Param("documentTypeId") UUID documentTypeId);

    /**
     * Busca documentos archivados por usuario
     */
    @Query("SELECT d FROM DocumentEntity d WHERE d.userId = :userId AND d.isArchived = true ORDER BY d.archivedAt DESC")
    List<DocumentEntity> findArchivedByUserId(@Param("userId") UUID userId);

    /**
     * Busca historial de versiones para un tipo de documento
     */
    @Query("SELECT d FROM DocumentEntity d WHERE d.userId = :userId AND d.documentType.id = :documentTypeId ORDER BY d.version DESC, d.uploadDate DESC")
    List<DocumentEntity> findVersionHistory(@Param("userId") UUID userId, @Param("documentTypeId") UUID documentTypeId);

    /**
     * Cuenta documentos activos por usuario
     */
    @Query("SELECT COUNT(d) FROM DocumentEntity d WHERE d.userId = :userId AND d.isArchived = false")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Busca documentos por estado de procesamiento y archivado
     */
    @Query("SELECT d FROM DocumentEntity d WHERE d.processingStatus = :processingStatus AND d.isArchived = :isArchived")
    List<DocumentEntity> findByProcessingStatusAndArchived(@Param("processingStatus") DocumentEntity.ProcessingStatusEnum processingStatus, @Param("isArchived") boolean isArchived);
}