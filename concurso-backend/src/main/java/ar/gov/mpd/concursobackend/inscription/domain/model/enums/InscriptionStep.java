package ar.gov.mpd.concursobackend.inscription.domain.model.enums;

public enum InscriptionStep {
    INITIAL,                // Paso inicial
    TERMS_ACCEPTANCE,       // Aceptación de bases y condiciones
    LOCATION_SELECTION,     // Selección de circunscripciones
    DOCUMENTATION,          // Carga de documentación
    DATA_CONFIRMATION,      // Confirmación de datos personales
    COMPLETED              // Inscripción completada
}