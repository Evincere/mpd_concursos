package ar.gov.mpd.concursobackend.auth.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la respuesta de cambio de estado de un usuario
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusResponse {
    
    /**
     * ID del usuario
     */
    private String id;
    
    /**
     * Nombre de usuario
     */
    private String username;
    
    /**
     * Estado actual del usuario
     */
    private String status;
}
