package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Servicio especializado para manejo de duplicidad de documentos
 * Implementa lógica de reemplazo transaccional y auditoría
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentDuplicateService {

    private final IDocumentRepository documentRepository;
    private final DocumentAuditService auditService;

    /**
     * Verifica si existe un documento del mismo tipo para el usuario
     */
    public Optional<Document> findExistingDocument(UUID userId, String documentTypeId) {
        log.debug("Verificando documento existente para usuario: {} y tipo: {}", userId, documentTypeId);

        try {
            UUID typeId = UUID.fromString(documentTypeId);
            return documentRepository.findActiveByUserAndType(userId, new DocumentTypeId(typeId));
        } catch (IllegalArgumentException e) {
            log.error("ID de tipo de documento inválido: {}", documentTypeId, e);
            return Optional.empty();
        }
    }

    /**
     * Maneja el reemplazo de documento existente de forma transaccional
     */
    @Transactional
    public DocumentReplacementResult replaceDocument(
            Document existingDocument, 
            Document newDocument, 
            UUID actionBy) {
        
        log.info("Iniciando reemplazo de documento: {} -> {}", 
                existingDocument.getId().value(), newDocument.getId().value());

        try {
            // 1. Archivar documento anterior
            archiveDocument(existingDocument, newDocument.getId(), actionBy);
            
            // 2. Guardar nuevo documento
            Document savedNewDocument = documentRepository.save(newDocument);
            
            // 3. Registrar auditoría
            auditService.recordReplacement(existingDocument, savedNewDocument, actionBy);

            // 4. Programar limpieza del archivo anterior (async)
            scheduleFileCleanup(existingDocument.getFilePath());
            
            log.info("Reemplazo de documento completado exitosamente");
            
            return DocumentReplacementResult.builder()
                    .success(true)
                    .newDocument(savedNewDocument)
                    .archivedDocument(existingDocument)
                    .message("Documento reemplazado exitosamente")
                    .build();
                    
        } catch (Exception e) {
            log.error("Error durante reemplazo de documento", e);
            throw new DocumentReplacementException("Error al reemplazar documento: " + e.getMessage(), e);
        }
    }

    /**
     * Archiva un documento marcándolo como inactivo
     */
    private void archiveDocument(Document document, DocumentId replacedBy, UUID actionBy) {
        log.debug("Archivando documento: {}", document.getId().value());

        // Usar el método del dominio para archivar
        document.archive(replacedBy, actionBy);

        documentRepository.save(document);
        log.debug("Documento archivado exitosamente: {}", document.getId().value());
    }

    /**
     * Programa la limpieza asíncrona del archivo físico
     */
    private void scheduleFileCleanup(String filePath) {
        if (filePath != null && !filePath.isEmpty()) {
            log.debug("Programando limpieza de archivo: {}", filePath);
            // TODO: Implementar limpieza asíncrona con retry en Fase 4
            // Por ahora solo registramos para limpieza posterior
            log.info("Archivo marcado para limpieza: {}", filePath);
        }
    }

    /**
     * Valida que un documento pueda ser reemplazado
     */
    public boolean canReplaceDocument(Document existingDocument, UUID userId) {
        if (existingDocument == null) {
            return false;
        }

        // Verificar que el documento pertenece al usuario
        if (!existingDocument.getUserId().equals(userId)) {
            log.warn("Intento de reemplazar documento de otro usuario. DocumentId: {}, UserId: {}",
                    existingDocument.getId().value(), userId);
            return false;
        }

        // Verificar que el documento esté activo
        if (!existingDocument.isActive()) {
            log.warn("Intento de reemplazar documento inactivo. DocumentId: {}",
                    existingDocument.getId().value());
            return false;
        }

        return true;
    }

    /**
     * Resultado del proceso de reemplazo
     */
    public static class DocumentReplacementResult {
        private final boolean success;
        private final Document newDocument;
        private final Document archivedDocument;
        private final String message;
        private final String errorMessage;

        private DocumentReplacementResult(Builder builder) {
            this.success = builder.success;
            this.newDocument = builder.newDocument;
            this.archivedDocument = builder.archivedDocument;
            this.message = builder.message;
            this.errorMessage = builder.errorMessage;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public boolean isSuccess() { return success; }
        public Document getNewDocument() { return newDocument; }
        public Document getArchivedDocument() { return archivedDocument; }
        public String getMessage() { return message; }
        public String getErrorMessage() { return errorMessage; }

        public static class Builder {
            private boolean success;
            private Document newDocument;
            private Document archivedDocument;
            private String message;
            private String errorMessage;

            public Builder success(boolean success) {
                this.success = success;
                return this;
            }

            public Builder newDocument(Document newDocument) {
                this.newDocument = newDocument;
                return this;
            }

            public Builder archivedDocument(Document archivedDocument) {
                this.archivedDocument = archivedDocument;
                return this;
            }

            public Builder message(String message) {
                this.message = message;
                return this;
            }

            public Builder errorMessage(String errorMessage) {
                this.errorMessage = errorMessage;
                return this;
            }

            public DocumentReplacementResult build() {
                return new DocumentReplacementResult(this);
            }
        }
    }
}

/**
 * Excepción específica para errores de reemplazo de documentos
 */
class DocumentReplacementException extends RuntimeException {
    public DocumentReplacementException(String message, Throwable cause) {
        super(message, cause);
    }
}
