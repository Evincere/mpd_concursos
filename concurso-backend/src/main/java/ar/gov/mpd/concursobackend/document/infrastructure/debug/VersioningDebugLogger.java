package ar.gov.mpd.concursobackend.document.infrastructure.debug;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Logger específico para debugging de versioning
 * Todos los logs van a un archivo separado para fácil análisis
 */
@Component
public class VersioningDebugLogger {
    
    private static final Logger log = LoggerFactory.getLogger("VERSIONING_DEBUG");
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    public void logPrePersist(Object id, int version, Boolean isArchived, String additionalInfo) {
        String timestamp = LocalDateTime.now().format(formatter);
        String stackInfo = getCallerInfo();
        
        log.error("🔍 [{}] PRE_PERSIST  | ID: {} | Version: {} | Archived: {} | Info: {} | Caller: {}", 
                timestamp, id, version, isArchived, additionalInfo, stackInfo);
    }

    public void logPostPersist(Object id, int version, Boolean isArchived, String additionalInfo) {
        String timestamp = LocalDateTime.now().format(formatter);
        
        log.error("✅ [{}] POST_PERSIST | ID: {} | Version: {} | Archived: {} | Info: {}", 
                timestamp, id, version, isArchived, additionalInfo);
    }

    public void logPreUpdate(Object id, int version, Boolean isArchived, String additionalInfo) {
        String timestamp = LocalDateTime.now().format(formatter);
        String stackInfo = getCallerInfo();
        
        log.error("🔄 [{}] PRE_UPDATE   | ID: {} | Version: {} | Archived: {} | Info: {} | Caller: {}", 
                timestamp, id, version, isArchived, additionalInfo, stackInfo);
    }

    public void logPostUpdate(Object id, int version, Boolean isArchived, String additionalInfo) {
        String timestamp = LocalDateTime.now().format(formatter);
        
        log.error("✅ [{}] POST_UPDATE  | ID: {} | Version: {} | Archived: {} | Info: {}", 
                timestamp, id, version, isArchived, additionalInfo);
    }

    public void logDocumentCreation(Object id, String operation, String details) {
        String timestamp = LocalDateTime.now().format(formatter);
        String stackInfo = getCallerInfo();
        
        log.error("🆕 [{}] DOC_CREATE   | ID: {} | Operation: {} | Details: {} | Caller: {}", 
                timestamp, id, operation, details, stackInfo);
    }

    public void logDocumentSave(Object id, int versionBefore, int versionAfter, String operation) {
        String timestamp = LocalDateTime.now().format(formatter);
        String stackInfo = getCallerInfo();
        
        log.error("💾 [{}] DOC_SAVE     | ID: {} | Version: {} → {} | Operation: {} | Caller: {}", 
                timestamp, id, versionBefore, versionAfter, operation, stackInfo);
    }

    public void logVersionChange(Object id, int oldVersion, int newVersion, String reason) {
        String timestamp = LocalDateTime.now().format(formatter);
        
        log.error("🔢 [{}] VERSION_CHG  | ID: {} | Version: {} → {} | Reason: {}", 
                timestamp, id, oldVersion, newVersion, reason);
    }

    public void logSeparator(String operation) {
        log.error("═══════════════════════════════════════════════════════════════");
        log.error("🎯 INICIANDO OPERACIÓN: {}", operation);
        log.error("═══════════════════════════════════════════════════════════════");
    }

    public void logEndSeparator(String operation) {
        log.error("═══════════════════════════════════════════════════════════════");
        log.error("🏁 FINALIZANDO OPERACIÓN: {}", operation);
        log.error("═══════════════════════════════════════════════════════════════");
    }

    private String getCallerInfo() {
        StackTraceElement[] stack = Thread.currentThread().getStackTrace();
        // Buscar el primer elemento que no sea de esta clase ni de logging
        for (int i = 3; i < Math.min(8, stack.length); i++) {
            String className = stack[i].getClassName();
            if (!className.contains("VersioningDebugLogger") && 
                !className.contains("Logger") &&
                className.contains("ar.gov.mpd.concursobackend")) {
                return stack[i].getClassName().substring(className.lastIndexOf('.') + 1) + 
                       "." + stack[i].getMethodName() + ":" + stack[i].getLineNumber();
            }
        }
        return "Unknown";
    }
}
