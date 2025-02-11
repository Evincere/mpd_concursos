package ar.gov.mpd.concursobackend.shared.security;

/**
 * Interface for abstracting the way to get authentication information
 */
public interface IAuthenticationFacade {
    /**
     * Gets the ID of the currently authenticated user
     * @return the user ID as a string that can be converted to UUID
     */
    String getCurrentUserId();
}
