package ar.gov.mpd.concursobackend.education.domain.model;

import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;

/**
 * Enumeración unificada para estados de registros de educación
 * Mapea entre domain, persistence y frontend
 */
public enum EducationStatus {
    IN_PROGRESS("en proceso", EducationRecordEntity.EducationStatus.IN_PROGRESS),
    COMPLETED("finalizado", EducationRecordEntity.EducationStatus.COMPLETED);

    private final String displayName;
    private final EducationRecordEntity.EducationStatus persistenceStatus;

    EducationStatus(String displayName, EducationRecordEntity.EducationStatus persistenceStatus) {
        this.displayName = displayName;
        this.persistenceStatus = persistenceStatus;
    }

    public String getDisplayName() {
        return displayName;
    }

    public EducationRecordEntity.EducationStatus getPersistenceStatus() {
        return persistenceStatus;
    }

    /**
     * Obtener un EducationStatus desde su nombre para mostrar
     *
     * @param displayName el nombre para mostrar
     * @return el EducationStatus correspondiente
     * @throws IllegalArgumentException si no se encuentra un EducationStatus que coincida
     */
    public static EducationStatus fromDisplayName(String displayName) {
        for (EducationStatus status : values()) {
            if (status.getDisplayName().equals(displayName)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Estado de educación inválido: " + displayName);
    }

    /**
     * Obtener un EducationStatus desde el estado de persistencia
     *
     * @param persistenceStatus el estado de la entidad JPA
     * @return el EducationStatus correspondiente
     * @throws IllegalArgumentException si no se encuentra un EducationStatus que coincida
     */
    public static EducationStatus fromPersistenceStatus(EducationRecordEntity.EducationStatus persistenceStatus) {
        for (EducationStatus status : values()) {
            if (status.getPersistenceStatus().equals(persistenceStatus)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Estado de persistencia inválido: " + persistenceStatus);
    }
} 