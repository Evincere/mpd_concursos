package ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring;

import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentAuditEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentAuditEntity.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio Spring Data para auditoría de documentos
 */
@Repository
public interface IDocumentAuditSpringRepository extends JpaRepository<DocumentAuditEntity, UUID> {

    /**
     * Busca auditorías por documento específico
     */
    List<DocumentAuditEntity> findByDocumentIdOrderByActionDateDesc(UUID documentId);

    /**
     * Busca auditorías por usuario
     */
    Page<DocumentAuditEntity> findByUserIdOrderByActionDateDesc(UUID userId, Pageable pageable);

    /**
     * Busca auditorías por tipo de acción
     */
    List<DocumentAuditEntity> findByActionTypeOrderByActionDateDesc(ActionType actionType);

    /**
     * Busca auditorías por rango de fechas
     */
    @Query("SELECT da FROM DocumentAuditEntity da WHERE da.actionDate BETWEEN :startDate AND :endDate ORDER BY da.actionDate DESC")
    List<DocumentAuditEntity> findByActionDateBetween(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);

    /**
     * Busca auditorías por usuario y documento
     */
    List<DocumentAuditEntity> findByUserIdAndDocumentIdOrderByActionDateDesc(UUID userId, UUID documentId);

    /**
     * Busca auditorías por usuario y tipo de acción
     */
    List<DocumentAuditEntity> findByUserIdAndActionTypeOrderByActionDateDesc(UUID userId, ActionType actionType);

    /**
     * Cuenta auditorías por tipo de acción
     */
    long countByActionType(ActionType actionType);

    /**
     * Cuenta auditorías por usuario
     */
    long countByUserId(UUID userId);

    /**
     * Busca auditorías recientes (últimas 24 horas)
     */
    @Query("SELECT da FROM DocumentAuditEntity da WHERE da.actionDate >= :since ORDER BY da.actionDate DESC")
    List<DocumentAuditEntity> findRecentAudits(@Param("since") LocalDateTime since);

    /**
     * Busca auditorías de reemplazos para un documento específico
     */
    @Query("SELECT da FROM DocumentAuditEntity da WHERE da.documentId = :documentId AND da.actionType = 'REPLACED' ORDER BY da.actionDate DESC")
    List<DocumentAuditEntity> findReplacementHistory(@Param("documentId") UUID documentId);

    /**
     * Busca auditorías por usuario que realizó la acción
     */
    List<DocumentAuditEntity> findByActionByOrderByActionDateDesc(UUID actionBy);

    /**
     * Busca auditorías con archivos específicos
     */
    @Query("SELECT da FROM DocumentAuditEntity da WHERE da.oldFilePath = :filePath OR da.newFilePath = :filePath ORDER BY da.actionDate DESC")
    List<DocumentAuditEntity> findByFilePath(@Param("filePath") String filePath);

    /**
     * Elimina auditorías antiguas (para limpieza periódica)
     */
    @Query("DELETE FROM DocumentAuditEntity da WHERE da.actionDate < :cutoffDate")
    void deleteOldAudits(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Estadísticas de auditoría por período
     */
    @Query("SELECT da.actionType, COUNT(da) FROM DocumentAuditEntity da WHERE da.actionDate BETWEEN :startDate AND :endDate GROUP BY da.actionType")
    List<Object[]> getAuditStatistics(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);
}
