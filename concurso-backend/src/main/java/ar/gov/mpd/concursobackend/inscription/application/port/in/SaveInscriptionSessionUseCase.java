package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;

/**
 * Puerto de entrada para guardar sesiones de inscripción
 */
public interface SaveInscriptionSessionUseCase {
    /**
     * Guarda una sesión de inscripción
     * @param request Datos de la sesión a guardar
     * @return Sesión guardada
     */
    InscriptionSessionResponse saveSession(InscriptionSessionRequest request);
}
