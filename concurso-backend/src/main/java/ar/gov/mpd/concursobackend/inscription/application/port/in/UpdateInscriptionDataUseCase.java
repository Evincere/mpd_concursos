package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDataUpdateRequest;

import java.util.UUID;

/**
 * ✅ SOLUCIÓN: Caso de uso para actualizar datos específicos de una inscripción
 * Permite actualizar centro de vida y circunscripciones seleccionadas
 */
public interface UpdateInscriptionDataUseCase {
    
    /**
     * Actualiza los datos específicos de una inscripción
     * @param inscriptionId ID de la inscripción
     * @param request Datos a actualizar
     */
    void updateInscriptionData(UUID inscriptionId, InscriptionDataUpdateRequest request);
}