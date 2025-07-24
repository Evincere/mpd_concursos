package ar.gov.mpd.concursobackend.document.application.command;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Command para reemplazo de documentos siguiendo el patrón Command
 * Encapsula toda la información necesaria para ejecutar la operación de reemplazo
 * de manera atómica y con manejo de concurrencia
 */
@Getter
@Builder
@RequiredArgsConstructor
public class ReplaceDocumentCommand {
    
    private final DocumentId existingDocumentId;
    private final Document newDocument;
    private final UUID actionBy;
    private final String reason;
    private final LocalDateTime requestedAt;
    private final int expectedVersion; // Para optimistic locking

    /**
     * Factory method para crear comando de reemplazo
     */
    public static ReplaceDocumentCommand create(
            DocumentId existingDocumentId,
            Document newDocument,
            UUID actionBy,
            String reason,
            int expectedVersion) {
        
        return ReplaceDocumentCommand.builder()
                .existingDocumentId(existingDocumentId)
                .newDocument(newDocument)
                .actionBy(actionBy)
                .reason(reason)
                .requestedAt(LocalDateTime.now())
                .expectedVersion(expectedVersion)
                .build();
    }

    /**
     * Valida que el comando tenga todos los datos necesarios
     */
    public void validate() {
        if (existingDocumentId == null) {
            throw new IllegalArgumentException("ID del documento existente es requerido");
        }
        
        if (newDocument == null) {
            throw new IllegalArgumentException("Nuevo documento es requerido");
        }
        
        if (actionBy == null) {
            throw new IllegalArgumentException("Usuario que ejecuta la accion es requerido");
        }
        
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Razon del reemplazo es requerida");
        }
        
        if (expectedVersion < 0) {
            throw new IllegalArgumentException("Version esperada debe ser mayor o igual a 0");
        }
    }
}