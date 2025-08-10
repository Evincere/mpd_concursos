package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailsResponse;

import java.util.UUID;

/**
 * ✅ SOLUCIÓN: Caso de uso para obtener detalles específicos de una inscripción
 * Incluye centro de vida y circunscripciones seleccionadas
 */
public interface GetInscriptionDetailsUseCase {
    
    /**
     * Obtiene los detalles específicos de una inscripción
     * @param inscriptionId ID de la inscripción
     * @return Detalles de la inscripción incluyendo preferencias
     */
    InscriptionDetailsResponse getInscriptionDetails(UUID inscriptionId);
}