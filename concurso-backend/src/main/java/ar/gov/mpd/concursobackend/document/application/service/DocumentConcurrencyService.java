package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Servicio especializado para manejar problemas de concurrencia en operaciones de documentos.
 * 
 * Características:
 * - Retry automático con backoff exponencial
 * - Recarga segura de entidades
 * - Logging detallado para debugging
 * - Manejo robusto de conflictos de Optimistic Locking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentConcurrencyService {

    private final IDocumentRepository documentRepository;
    private final DocumentConcurrencyMetricsService metricsService;

    /**
     * Ejecuta una operación con retry automático en caso de conflictos de concurrencia.
     * 
     * @param operation Operación a ejecutar
     * @param operationName Nombre de la operación para logging
     * @return Resultado de la operación
     */
    @Retryable(
        value = {ObjectOptimisticLockingFailureException.class}, 
        maxAttempts = 3, 
        backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public <T> T executeWithRetry(Supplier<T> operation, String operationName) {
        return executeWithRetry(operation, operationName, null, null);
    }

    /**
     * Versión con tracking de métricas
     */
    public <T> T executeWithRetry(Supplier<T> operation, String operationName, String userId, String documentId) {
        log.debug("🔄 [DocumentConcurrency] Ejecutando operación con retry: {}", operationName);

        try {
            T result = operation.get();
            log.debug("✅ [DocumentConcurrency] Operación exitosa: {}", operationName);
            return result;
        } catch (ObjectOptimisticLockingFailureException e) {
            log.warn("⚠️ [DocumentConcurrency] Conflicto de concurrencia en {}: {}", operationName, e.getMessage());

            // Registrar métricas si están disponibles
            if (userId != null && documentId != null) {
                metricsService.recordConcurrencyConflict(userId, documentId, operationName);
            }

            throw e; // Re-lanzar para que el retry funcione
        } catch (Exception e) {
            log.error("❌ [DocumentConcurrency] Error no recuperable en {}: {}", operationName, e.getMessage(), e);

            // Registrar fallo si están disponibles las métricas
            if (userId != null && documentId != null) {
                metricsService.recordFailedOperation(userId, documentId, operationName, e.getClass().getSimpleName());
            }

            throw e;
        }
    }

    /**
     * Recarga un documento de forma segura desde la base de datos.
     * 
     * @param documentId ID del documento a recargar
     * @return Documento recargado
     * @throws DocumentException si el documento no existe
     */
    @Transactional(readOnly = true)
    public Document reloadDocumentSafely(DocumentId documentId) {
        log.debug("🔄 [DocumentConcurrency] Recargando documento: {}", documentId.value());
        
        Document reloadedDocument = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentException("Documento no encontrado durante recarga: " + documentId.value()));
        
        log.debug("✅ [DocumentConcurrency] Documento recargado exitosamente - ID: {}", 
                documentId.value());
        
        return reloadedDocument;
    }

    /**
     * Verifica si un documento fue modificado comparando versiones.
     * 
     * @param originalDocument Documento original
     * @param currentDocumentId ID del documento actual
     * @return true si fue modificado, false en caso contrario
     */
    @Transactional(readOnly = true)
    public boolean wasDocumentModified(Document originalDocument, DocumentId currentDocumentId) {
        Document currentDocument = reloadDocumentSafely(currentDocumentId);
        boolean wasModified = !originalDocument.getId().equals(currentDocumentId);

        if (wasModified) {
            log.info("📊 [DocumentConcurrency] Documento modificado - Original ID{}, Actual ID{}",
                    originalDocument.getId(), currentDocumentId);
        }
        
        return wasModified;
    }

    /**
     * Ejecuta una operación con manejo completo de concurrencia:
     * - Verificación de modificaciones
     * - Retry automático
     * - Logging detallado
     * 
     * @param documentId ID del documento
     * @param operation Operación a ejecutar
     * @param operationName Nombre de la operación
     * @return Resultado de la operación
     */
    public <T> T executeWithConcurrencyHandling(DocumentId documentId, Supplier<T> operation, String operationName) {
        log.info("🚀 [DocumentConcurrency] Iniciando operación con manejo de concurrencia: {} para documento: {}", 
                operationName, documentId.value());
        
        return executeWithRetry(() -> {
            // Recargar documento antes de la operación para tener la versión más reciente
            Document currentDocument = reloadDocumentSafely(documentId);
            log.debug("📋 [DocumentConcurrency] Documento recargado antes de operación");
            
            return operation.get();
        }, operationName);
    }

    /**
     * Ejecuta una operación aplicando un bloqueo pesimista al documento para garantizar exclusividad.
     * El documento bloqueado se pasa a la operación a ejecutar.
     *
     * @param documentId ID del documento a bloquear
     * @param operation Operación a ejecutar, que recibe el documento bloqueado
     * @param operationName Nombre de la operación para logging
     * @return Resultado de la operación
     */
    @Transactional
    public <T> T executeWithPessimisticLock(DocumentId documentId, Function<Document, T> operation, String operationName) {
        log.info("🔒 [DocumentConcurrency] Iniciando operación con PESSIMISTIC_WRITE lock: {} para documento: {}",
                operationName, documentId.value());

        try {
            // Bloquear el documento y obtener la versión más reciente
            Document lockedDocument = documentRepository.findByIdWithPessimisticLock(documentId)
                    .orElseThrow(() -> new DocumentException("Documento no encontrado para bloqueo pesimista: " + documentId.value()));

            log.debug("✅ [DocumentConcurrency] Documento bloqueado exitosamente - ID: {}",
                    lockedDocument.getId().value());

            // Ejecutar la operación de negocio principal pasándole el documento ya bloqueado
            return operation.apply(lockedDocument);

        } catch (Exception e) {
            log.error("❌ [DocumentConcurrency] Error durante operación con bloqueo pesimista [{}]: {}",
                    operationName, e.getMessage(), e);
            throw e; // Re-lanzar para que la transacción haga rollback
        }
    }
}
