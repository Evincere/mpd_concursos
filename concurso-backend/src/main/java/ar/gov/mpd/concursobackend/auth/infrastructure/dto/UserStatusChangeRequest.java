package ar.gov.mpd.concursobackend.auth.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la solicitud de cambio de estado de un usuario
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusChangeRequest {
    
    /**
     * Nuevo estado del usuario
     */
    private String status;
    
    /**
     * Razón del cambio (opcional)
     */
    private String reason;
}
