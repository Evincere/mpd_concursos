package ar.gov.mpd.concursobackend.contest.infrastructure.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuesta de disponibilidad de documentos de concurso
 * 
 * Contiene información sobre la disponibilidad de bases y descripción
 * del puesto para un concurso específico, incluyendo URLs de descarga
 * cuando los documentos están disponibles.
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDocumentAvailabilityResponse {

    /**
     * ID del concurso
     */
    @JsonProperty("contestId")
    private Long contestId;

    /**
     * Indica si las bases del concurso están disponibles
     */
    @JsonProperty("basesAvailable")
    private boolean basesAvailable;

    /**
     * Indica si la descripción del puesto está disponible
     */
    @JsonProperty("descriptionAvailable")
    private boolean descriptionAvailable;

    /**
     * URL para descargar las bases del concurso (si están disponibles)
     */
    @JsonProperty("basesUrl")
    private String basesUrl;

    /**
     * URL para descargar la descripción del puesto (si está disponible)
     */
    @JsonProperty("descriptionUrl")
    private String descriptionUrl;

    /**
     * Mensaje informativo sobre el estado de los documentos
     */
    @JsonProperty("message")
    private String message;

    /**
     * Constructor de conveniencia para casos donde no hay documentos disponibles
     * 
     * @param contestId ID del concurso
     * @param message Mensaje explicativo
     */
    public ContestDocumentAvailabilityResponse(Long contestId, String message) {
        this.contestId = contestId;
        this.basesAvailable = false;
        this.descriptionAvailable = false;
        this.basesUrl = null;
        this.descriptionUrl = null;
        this.message = message;
    }

    /**
     * Constructor de conveniencia para casos con documentos disponibles
     * 
     * @param contestId ID del concurso
     * @param basesAvailable Si las bases están disponibles
     * @param descriptionAvailable Si la descripción está disponible
     * @param basesUrl URL de las bases
     * @param descriptionUrl URL de la descripción
     */
    public ContestDocumentAvailabilityResponse(Long contestId, boolean basesAvailable, 
                                             boolean descriptionAvailable, String basesUrl, 
                                             String descriptionUrl) {
        this.contestId = contestId;
        this.basesAvailable = basesAvailable;
        this.descriptionAvailable = descriptionAvailable;
        this.basesUrl = basesUrl;
        this.descriptionUrl = descriptionUrl;
        this.message = generateMessage();
    }

    /**
     * Genera un mensaje automático basado en la disponibilidad de documentos
     */
    private String generateMessage() {
        if (basesAvailable && descriptionAvailable) {
            return "Todos los documentos están disponibles para descarga";
        } else if (basesAvailable || descriptionAvailable) {
            return "Algunos documentos están disponibles para descarga";
        } else {
            return "Los documentos aún no se han publicado";
        }
    }

    /**
     * Verifica si hay al menos un documento disponible
     */
    public boolean hasAnyDocumentAvailable() {
        return basesAvailable || descriptionAvailable;
    }

    /**
     * Verifica si todos los documentos están disponibles
     */
    public boolean hasAllDocumentsAvailable() {
        return basesAvailable && descriptionAvailable;
    }
}
