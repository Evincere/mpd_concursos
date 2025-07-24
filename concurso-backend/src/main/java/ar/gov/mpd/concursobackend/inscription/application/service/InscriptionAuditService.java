package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ✅ SERVICIO DE AUDITORÍA: Registro centralizado de cambios en inscripciones
 * 
 * Responsabilidades:
 * - Registrar cambios de estado con contexto completo
 * - Mantener trazabilidad de acciones de usuario
 * - Proporcionar información para debugging y compliance
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionAuditService {
    
    private final SecurityUtils securityUtils;
    
    /**
     * ✅ AUDITORÍA DE CAMBIO DE ESTADO
     * 
     * @param inscriptionId ID de la inscripción
     * @param previousState Estado anterior
     * @param newState Nuevo estado
     * @param reason Razón del cambio
     * @param actionType Tipo de acción (USER_ACTION, ADMIN_ACTION, SYSTEM_ACTION)
     */
    public void auditStateChange(UUID inscriptionId, InscriptionState previousState, 
                               InscriptionState newState, String reason, AuditActionType actionType) {
        
        String userId = getCurrentUserIdSafely();
        LocalDateTime timestamp = LocalDateTime.now();
        
        // Log estructurado para auditoría
        log.info("AUDIT_STATE_CHANGE: inscriptionId={}, previousState={}, newState={}, " +
                "reason='{}', actionType={}, userId={}, timestamp={}", 
                inscriptionId, previousState, newState, reason, actionType, userId, timestamp);
        
        // TODO: En el futuro, esto podría guardarse en una tabla de auditoría
        // auditRepository.save(new InscriptionAuditEntry(...));
    }
    
    /**
     * ✅ AUDITORÍA DE CANCELACIÓN ESPECÍFICA
     */
    public void auditCancellation(UUID inscriptionId, InscriptionState previousState, String reason) {
        auditStateChange(inscriptionId, previousState, InscriptionState.CANCELLED, 
                        reason != null ? reason : "Cancelada por el usuario", 
                        AuditActionType.USER_ACTION);
    }
    
    /**
     * ✅ AUDITORÍA DE ACCIÓN ADMINISTRATIVA
     */
    public void auditAdminAction(UUID inscriptionId, InscriptionState previousState, 
                               InscriptionState newState, String reason) {
        auditStateChange(inscriptionId, previousState, newState, 
                        reason != null ? reason : "Cambio administrativo", 
                        AuditActionType.ADMIN_ACTION);
    }
    
    /**
     * ✅ AUDITORÍA DE ACCIÓN DEL SISTEMA
     */
    public void auditSystemAction(UUID inscriptionId, InscriptionState previousState, 
                                InscriptionState newState, String reason) {
        auditStateChange(inscriptionId, previousState, newState, 
                        reason != null ? reason : "Cambio automático del sistema", 
                        AuditActionType.SYSTEM_ACTION);
    }
    
    /**
     * Obtiene el ID del usuario actual de forma segura
     */
    private String getCurrentUserIdSafely() {
        try {
            return securityUtils.getCurrentUserId();
        } catch (Exception e) {
            log.debug("No se pudo obtener el usuario actual para auditoría: {}", e.getMessage());
            return "SYSTEM";
        }
    }
    
    /**
     * Tipos de acciones para auditoría
     */
    public enum AuditActionType {
        USER_ACTION,    // Acción iniciada por el usuario
        ADMIN_ACTION,   // Acción iniciada por un administrador
        SYSTEM_ACTION   // Acción automática del sistema
    }
}
