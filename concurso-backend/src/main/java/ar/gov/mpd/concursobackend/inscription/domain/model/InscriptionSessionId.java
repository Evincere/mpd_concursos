package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.shared.domain.model.Identifier;

import java.util.UUID;

/**
 * Identificador para las sesiones de inscripción
 */
public class InscriptionSessionId extends Identifier {
    public InscriptionSessionId(UUID value) {
        super(value);
    }

    public InscriptionSessionId(String value) {
        super(UUID.fromString(value));
    }

    public InscriptionSessionId() {
        super(UUID.randomUUID());
    }
}
