package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.mapper;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionDocumentDTO;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir Document a InscriptionDocumentDTO
 */
@Component
public class InscriptionDocumentMapper {

    /**
     * Convierte un Document a InscriptionDocumentDTO
     */
    public InscriptionDocumentDTO toInscriptionDocumentDTO(Document document, String inscriptionId) {
        if (document == null) {
            return null;
        }

        return InscriptionDocumentDTO.builder()
                .id(document.getId().value().toString())
                .inscriptionId(inscriptionId)
                .documentType(document.getDocumentType().getName())
                .documentTypeId(document.getDocumentType().getCode())
                .fileName(document.getFileName().value())
                .fileSize(null) // TODO: Implementar si es necesario
                .uploadDate(document.getUploadDate())
                .status(document.getStatus().name())
                .observations(document.getRejectionReason())
                .reviewedBy(document.getValidatedBy() != null ? document.getValidatedBy().toString() : null)
                .reviewDate(document.getValidatedAt())
                .downloadUrl(generateDownloadUrl(document))
                .build();
    }

    /**
     * Genera la URL de descarga para un documento
     */
    private String generateDownloadUrl(Document document) {
        // TODO: Implementar lógica para generar URL de descarga
        return "/api/documents/" + document.getId().value() + "/download";
    }
}
