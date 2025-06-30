package ar.gov.mpd.concursobackend.education.domain.model;

/**
 * Enumeración para roles en actividades científicas
 */
public enum ScientificActivityRole {
    ASSISTANT_PARTICIPANT("ayudante-participante"),
    AUTHOR_SPEAKER_PANELIST_PRESENTER("autor-disertante-panelista-exponente");

    private final String displayName;

    ScientificActivityRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Obtener un ScientificActivityRole desde su nombre para mostrar
     * 
     * @param displayName el nombre para mostrar
     * @return el ScientificActivityRole correspondiente
     * @throws IllegalArgumentException si no se encuentra un ScientificActivityRole que coincida
     */
    public static ScientificActivityRole fromDisplayName(String displayName) {
        for (ScientificActivityRole role : values()) {
            if (role.getDisplayName().equals(displayName)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Rol de actividad científica inválido: " + displayName);
    }
} 