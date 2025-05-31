package ar.gov.mpd.concursobackend.auth.domain.model;

/**
 * Enumeración de estados posibles para un usuario
 */
public enum UserStatus {
    /**
     * Usuario activo
     */
    ACTIVE,
    
    /**
     * Usuario inactivo
     */
    INACTIVE,
    
    /**
     * Usuario bloqueado permanentemente
     */
    BLOCKED,
    
    /**
     * Usuario bloqueado temporalmente
     */
    LOCKED,
    
    /**
     * Usuario con cuenta expirada
     */
    EXPIRED
}
