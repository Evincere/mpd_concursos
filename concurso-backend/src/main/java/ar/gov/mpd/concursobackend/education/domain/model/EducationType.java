package ar.gov.mpd.concursobackend.education.domain.model;

import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;

/**
 * Enumeración unificada para tipos de educación
 * Mapea entre domain, persistence y frontend
 */
public enum EducationType {
    SECONDARY("Educación Secundaria", EducationRecordEntity.EducationType.SECONDARY_EDUCATION),
    HIGHER_EDUCATION_CAREER("Carrera de Nivel Superior", EducationRecordEntity.EducationType.TECHNICAL_DEGREE),
    UNDERGRADUATE_CAREER("Carrera de grado", EducationRecordEntity.EducationType.UNIVERSITY_DEGREE),
    POSTGRADUATE_SPECIALIZATION("Posgrado: especialización", EducationRecordEntity.EducationType.POSTGRADUATE_DEGREE),
    POSTGRADUATE_MASTERS("Posgrado: maestría", EducationRecordEntity.EducationType.MASTER_DEGREE),
    POSTGRADUATE_DOCTORATE("Posgrado: doctorado", EducationRecordEntity.EducationType.DOCTORAL_DEGREE),
    DIPLOMA("Diplomatura", EducationRecordEntity.EducationType.DIPLOMA),
    TRAINING_COURSE("Curso de Capacitación", EducationRecordEntity.EducationType.TRAINING_COURSE),
    SCIENTIFIC_ACTIVITY("Actividad Científica (investigación y/o difusión)", EducationRecordEntity.EducationType.SCIENTIFIC_ACTIVITY);

    private final String displayName;
    private final EducationRecordEntity.EducationType persistenceType;

    EducationType(String displayName, EducationRecordEntity.EducationType persistenceType) {
        this.displayName = displayName;
        this.persistenceType = persistenceType;
    }

    public String getDisplayName() {
        return displayName;
    }

    public EducationRecordEntity.EducationType getPersistenceType() {
        return persistenceType;
    }

    /**
     * Obtener un EducationType desde su nombre para mostrar
     *
     * @param displayName el nombre para mostrar
     * @return el EducationType correspondiente
     * @throws IllegalArgumentException si no se encuentra un EducationType que coincida
     */
    public static EducationType fromDisplayName(String displayName) {
        for (EducationType type : values()) {
            if (type.getDisplayName().equals(displayName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Tipo de educación inválido: " + displayName);
    }

    /**
     * Obtener un EducationType desde el tipo de persistencia
     *
     * @param persistenceType el tipo de la entidad JPA
     * @return el EducationType correspondiente
     * @throws IllegalArgumentException si no se encuentra un EducationType que coincida
     */
    public static EducationType fromPersistenceType(EducationRecordEntity.EducationType persistenceType) {
        for (EducationType type : values()) {
            if (type.getPersistenceType().equals(persistenceType)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Tipo de persistencia inválido: " + persistenceType);
    }
} 