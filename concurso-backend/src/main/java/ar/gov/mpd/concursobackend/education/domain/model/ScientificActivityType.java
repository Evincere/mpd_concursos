package ar.gov.mpd.concursobackend.education.domain.model;

/**
 * Enumeración para tipos de actividades científicas
 */
public enum ScientificActivityType {
    RESEARCH("Investigación"),
    PUBLICATION("Publicación"),
    CONFERENCE("Conferencia"),
    WORKSHOP("Taller"),
    SEMINAR("Seminario"),
    OTHER("Otro");
    
    private final String displayName;
    
    ScientificActivityType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Obtener un ScientificActivityType desde su nombre para mostrar
     * 
     * @param displayName el nombre para mostrar
     * @return el ScientificActivityType correspondiente
     * @throws IllegalArgumentException si no se encuentra un ScientificActivityType que coincida
     */
    public static ScientificActivityType fromDisplayName(String displayName) {
        for (ScientificActivityType type : values()) {
            if (type.getDisplayName().equals(displayName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Tipo de actividad científica inválido: " + displayName);
    }
} 