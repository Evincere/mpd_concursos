package ar.gov.mpd.concursobackend.education.domain.model;

/**
 * Enumeración para tipos de educación
 */
public enum EducationType {
    HIGHER_EDUCATION_DEGREE("Título Terciario"),
    UNDERGRADUATE_DEGREE("Título Universitario"),
    POSTGRADUATE_SPECIALIZATION("Especialización"),
    POSTGRADUATE_MASTERS("Maestría"),
    POSTGRADUATE_DOCTORATE("Doctorado"),
    DIPLOMA("Diplomatura"),
    TRAINING_COURSE("Curso de Capacitación"),
    SCIENTIFIC_ACTIVITY("Actividad Científica");
    
    private final String displayName;
    
    EducationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
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
} 