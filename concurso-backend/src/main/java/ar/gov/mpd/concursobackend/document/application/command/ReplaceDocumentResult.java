package ar.gov.mpd.concursobackend.document.application.command;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Resultado de la operación de reemplazo de documentos
 * Implementa el patrón Result para manejo robusto de errores
 */
@Getter
@Builder
@RequiredArgsConstructor
public class ReplaceDocumentResult {
    
    private final boolean success;
    private final Document newDocument;
    private final Document archivedDocument;
    private final String errorCode;
    private final String errorMessage;
    private final int attemptsCount;
    private final long processingTimeMs;
    private final Integer expectedVersion;
    private final Integer actualVersion;

    /**
     * Crea un resultado exitoso
     */
    public static ReplaceDocumentResult success(
            Document newDocument,
            Document archivedDocument,
            int attemptsCount,
            long processingTimeMs) {
        
        return ReplaceDocumentResult.builder()
                .success(true)
                .newDocument(newDocument)
                .archivedDocument(archivedDocument)
                .attemptsCount(attemptsCount)
                .processingTimeMs(processingTimeMs)
                .build();
    }

    /**
     * Crea un resultado de fallo por concurrencia
     */
    public static ReplaceDocumentResult concurrencyFailure(
            int attemptsCount,
            long processingTimeMs) {
        
        return ReplaceDocumentResult.builder()
                .success(false)
                .errorCode("CONCURRENCY_FAILURE")
                .errorMessage("Error de concurrencia: maximo numero de reintentos alcanzado")
                .attemptsCount(attemptsCount)
                .processingTimeMs(processingTimeMs)
                .build();
    }

    /**
     * Crea un resultado de fallo por versión incorrecta
     */
    public static ReplaceDocumentResult versionMismatchFailure(
            int expectedVersion,
            int actualVersion,
            int attemptsCount,
            long processingTimeMs) {
        
        return ReplaceDocumentResult.builder()
                .success(false)
                .errorCode("VERSION_MISMATCH")
                .errorMessage(String.format("Version incorrecta. Esperada: %d, Actual: %d", 
                        expectedVersion, actualVersion))
                .expectedVersion(expectedVersion)
                .actualVersion(actualVersion)
                .attemptsCount(attemptsCount)
                .processingTimeMs(processingTimeMs)
                .build();
    }

    /**
     * Crea un resultado de fallo genérico
     */
    public static ReplaceDocumentResult failure(
            String errorCode,
            String errorMessage,
            int attemptsCount,
            long processingTimeMs) {
        
        return ReplaceDocumentResult.builder()
                .success(false)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .attemptsCount(attemptsCount)
                .processingTimeMs(processingTimeMs)
                .build();
    }

    /**
     * Verifica si la operación fue exitosa
     */
    public boolean isSuccess() {
        return success;
    }

    /**
     * Verifica si el error fue por concurrencia
     */
    public boolean isConcurrencyError() {
        return "CONCURRENCY_FAILURE".equals(errorCode);
    }

    /**
     * Verifica si el error fue por versión incorrecta
     */
    public boolean isVersionMismatch() {
        return "VERSION_MISMATCH".equals(errorCode);
    }

    /**
     * Obtiene un resumen del resultado para logging
     */
    public String getSummary() {
        if (success) {
            return String.format("SUCCESS - Tiempo: %dms, Intentos: %d", 
                    processingTimeMs, attemptsCount);
        } else {
            return String.format("FAILURE - Codigo: %s, Mensaje: %s, Tiempo: %dms, Intentos: %d", 
                    errorCode, errorMessage, processingTimeMs, attemptsCount);
        }
    }
}