package ar.gov.mpd.concursobackend.auth.infrastructure.exception;

import javax.security.auth.login.AccountLockedException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import ar.gov.mpd.concursobackend.auth.domain.exception.EmailAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCredentialsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidEmailException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidPasswordException;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.NombreObligatorioException;
import ar.gov.mpd.concursobackend.auth.domain.exception.ApellidoObligatorioException;
import ar.gov.mpd.concursobackend.auth.domain.exception.DniInvalidoException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCuitException;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserDniAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.BlockedAccountException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InactiveAccountException;
import ar.gov.mpd.concursobackend.auth.domain.exception.ExpiredAccountException;

@RestControllerAdvice
@SuppressWarnings("unused")
public class AuthExceptionHandler {
    
    private static class ErrorResponse {
        private String field;
        private String message;

        public ErrorResponse(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("email", ex.getMessage()),
            HttpStatus.CONFLICT
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("credentials", ex.getMessage()),
            HttpStatus.UNAUTHORIZED
        );
    }

    /**
     * Maneja errores de cuenta bloqueada
     */
    @ExceptionHandler(BlockedAccountException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleBlockedAccount(BlockedAccountException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("account", ex.getMessage()),
            HttpStatus.FORBIDDEN
        );
    }

    /**
     * Maneja errores de cuenta inactiva
     */
    @ExceptionHandler(InactiveAccountException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleInactiveAccount(InactiveAccountException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("account", ex.getMessage()),
            HttpStatus.FORBIDDEN
        );
    }

    /**
     * Maneja errores de cuenta expirada
     */
    @ExceptionHandler(ExpiredAccountException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleExpiredAccount(ExpiredAccountException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("account", ex.getMessage()),
            HttpStatus.FORBIDDEN
        );
    }

    @ExceptionHandler(InvalidPasswordException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidPassword(InvalidPasswordException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("password", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(InvalidEmailException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidEmail(InvalidEmailException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("email", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("username", ex.getMessage()),
            HttpStatus.CONFLICT
        );
    }

    @ExceptionHandler(NombreObligatorioException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleNombreObligatorio(NombreObligatorioException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("nombre", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(ApellidoObligatorioException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleApellidoObligatorio(ApellidoObligatorioException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("apellido", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(DniInvalidoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleDniInvalido(DniInvalidoException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("dni", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(InvalidCuitException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidCuit(InvalidCuitException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("cuit", ex.getMessage()),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(AccountLockedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("account", ex.getMessage()),
            HttpStatus.FORBIDDEN
        );
    }

    @ExceptionHandler(UserDniAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleUserDniAlreadyExists(UserDniAlreadyExistsException ex) {
        return new ResponseEntity<>(
            new ErrorResponse("dni", ex.getMessage()),
            HttpStatus.CONFLICT
        );
    }

    /**
     * Maneja errores de integridad de datos (claves duplicadas, constraints, etc.)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = ex.getMessage();
        String field = "unknown";
        String userMessage = "Ya existe un registro con estos datos";

        // Analizar el mensaje de error para determinar el campo específico
        if (message != null) {
            if (message.contains("user_entity.cuit")) {
                field = "cuit";
                userMessage = "El CUIT ya está registrado en el sistema";
            } else if (message.contains("user_entity.dni")) {
                field = "dni";
                userMessage = "El DNI ya está registrado en el sistema";
            } else if (message.contains("user_entity.email")) {
                field = "email";
                userMessage = "El email ya está registrado en el sistema";
            } else if (message.contains("user_entity.username")) {
                field = "username";
                userMessage = "El nombre de usuario ya está en uso";
            } else if (message.contains("Duplicate entry")) {
                // Extraer información más específica del mensaje de error
                if (message.contains("'") && message.contains("for key")) {
                    // Formato: Duplicate entry 'valor' for key 'tabla.campo'
                    String[] parts = message.split("for key '");
                    if (parts.length > 1) {
                        String keyInfo = parts[1].replace("'", "");
                        if (keyInfo.contains(".")) {
                            String[] keyParts = keyInfo.split("\\.");
                            if (keyParts.length > 1) {
                                field = keyParts[1];
                                userMessage = "Ya existe un registro con este " + getFieldDisplayName(field);
                            }
                        }
                    }
                }
            }
        }

        return new ResponseEntity<>(
            new ErrorResponse(field, userMessage),
            HttpStatus.CONFLICT
        );
    }

    /**
     * Obtiene el nombre de visualización para un campo
     */
    private String getFieldDisplayName(String field) {
        switch (field) {
            case "cuit":
                return "CUIT";
            case "dni":
                return "DNI";
            case "email":
                return "correo electrónico";
            case "username":
                return "nombre de usuario";
            default:
                return field;
        }
    }

}