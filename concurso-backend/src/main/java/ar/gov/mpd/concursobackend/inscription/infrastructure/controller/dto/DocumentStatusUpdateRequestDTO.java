package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitudes de actualización de estado de documento
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentStatusUpdateRequestDTO {
    private String status; // 'APPROVED' or 'REJECTED'
    private String observations;
}
