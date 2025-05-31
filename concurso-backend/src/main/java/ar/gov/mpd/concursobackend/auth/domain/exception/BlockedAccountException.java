package ar.gov.mpd.concursobackend.auth.domain.exception;

import org.springframework.security.core.AuthenticationException;

/**
 * Excepción lanzada cuando un usuario intenta iniciar sesión con una cuenta bloqueada.
 */
public class BlockedAccountException extends AuthenticationException {
    
    /**
     * Constructor con mensaje de error.
     * 
     * @param msg el mensaje de error
     */
    public BlockedAccountException(String msg) {
        super(msg);
    }
    
    /**
     * Constructor con mensaje de error y causa.
     * 
     * @param msg el mensaje de error
     * @param cause la causa de la excepción
     */
    public BlockedAccountException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
