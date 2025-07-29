package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para representar un documento en el contexto de una inscripción
 * Compatible con la interfaz InscriptionDocument del frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionDocumentDTO {
    private String id;
    private String inscriptionId;
    private String documentType;
    private String documentTypeId;
    private String fileName;
    private Long fileSize;
    private LocalDateTime uploadDate;
    private String status; // 'PENDING', 'APPROVED', 'REJECTED'
    private String observations;
    private String reviewedBy;
    private LocalDateTime reviewDate;
    private String downloadUrl;
}
