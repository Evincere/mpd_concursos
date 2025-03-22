package ar.gov.mpd.concursobackend.education.domain.model;

/**
 * Enumeración para estados de registros de educación
 */
public enum EducationStatus {
    IN_PROGRESS("En Curso"),
    COMPLETED("Completado"),
    ABANDONED("Abandonado");
    
    private final String displayName;
    
    EducationStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
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
} 