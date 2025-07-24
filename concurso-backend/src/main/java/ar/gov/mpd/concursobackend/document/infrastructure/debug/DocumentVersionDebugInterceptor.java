package ar.gov.mpd.concursobackend.document.infrastructure.debug;

import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import org.hibernate.Interceptor;
import org.hibernate.type.Type;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Interceptor para debugging de versioning en DocumentEntity
 * SOLO PARA DEBUGGING - Remover en producción
 */
@Component
public class DocumentVersionDebugInterceptor implements Interceptor {
    
    private static final Logger log = LoggerFactory.getLogger(DocumentVersionDebugInterceptor.class);

    @Override
    public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        if (entity instanceof DocumentEntity) {
            DocumentEntity doc = (DocumentEntity) entity;
            
            // Encontrar el índice del campo version
            int versionIndex = findVersionIndex(propertyNames);
            
            log.error("🔍 [DEBUG] SAVE - Documento ID: {}", doc.getId());
            log.error("🔍 [DEBUG] SAVE - Version en entity: {}", doc.getVersion());
            if (versionIndex >= 0) {
                log.error("🔍 [DEBUG] SAVE - Version en state[{}]: {}", versionIndex, state[versionIndex]);
            }
            log.error("🔍 [DEBUG] SAVE - IsArchived: {}", doc.getIsArchived());
            log.error("🔍 [DEBUG] SAVE - UploadDate: {}", doc.getUploadDate());
            log.error("🔍 [DEBUG] SAVE - Stack trace:");
            
            // Imprimir stack trace para ver quién llama
            StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
            for (int i = 0; i < Math.min(10, stackTrace.length); i++) {
                log.error("🔍 [DEBUG] SAVE - [{}] {}", i, stackTrace[i]);
            }
        }
        return false; // No modificar el comportamiento
    }

    @Override
    public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, Object[] previousState, String[] propertyNames, Type[] types) {
        if (entity instanceof DocumentEntity) {
            DocumentEntity doc = (DocumentEntity) entity;
            
            int versionIndex = findVersionIndex(propertyNames);
            
            log.error("🔍 [DEBUG] UPDATE - Documento ID: {}", doc.getId());
            log.error("🔍 [DEBUG] UPDATE - Version en entity: {}", doc.getVersion());
            if (versionIndex >= 0) {
                log.error("🔍 [DEBUG] UPDATE - Version anterior: {}", previousState[versionIndex]);
                log.error("🔍 [DEBUG] UPDATE - Version actual: {}", currentState[versionIndex]);
            }
            log.error("🔍 [DEBUG] UPDATE - IsArchived: {}", doc.getIsArchived());
        }
        return false;
    }

    @Override
    public void onDelete(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        if (entity instanceof DocumentEntity) {
            DocumentEntity doc = (DocumentEntity) entity;
            log.error("🔍 [DEBUG] DELETE - Documento ID: {}, Version: {}", doc.getId(), doc.getVersion());
        }
    }

    private int findVersionIndex(String[] propertyNames) {
        for (int i = 0; i < propertyNames.length; i++) {
            if ("version".equals(propertyNames[i])) {
                return i;
            }
        }
        return -1;
    }
}
