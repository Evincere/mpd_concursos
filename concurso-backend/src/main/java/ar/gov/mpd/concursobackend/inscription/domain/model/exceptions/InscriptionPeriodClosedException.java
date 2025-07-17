package ar.gov.mpd.concursobackend.inscription.domain.model.exceptions;

/**
 * Excepción lanzada cuando se intenta crear una inscripción 
 * fuera del período permitido para el concurso.
 * 
 * Esta excepción representa una violación de regla de negocio crítica
 * que debe ser manejada apropiadamente por la capa de aplicación.
 */
public class InscriptionPeriodClosedException extends RuntimeException {
    
    private final Long contestId;
    private final String contestTitle;
    
    public InscriptionPeriodClosedException(Long contestId, String contestTitle) {
        super(String.format("El período de inscripción para el concurso '%s' (ID: %d) ha finalizado o aún no ha comenzado", 
                contestTitle, contestId));
        this.contestId = contestId;
        this.contestTitle = contestTitle;
    }
    
    public InscriptionPeriodClosedException(Long contestId, String contestTitle, String customMessage) {
        super(customMessage);
        this.contestId = contestId;
        this.contestTitle = contestTitle;
    }
    
    public Long getContestId() {
        return contestId;
    }
    
    public String getContestTitle() {
        return contestTitle;
    }
}
