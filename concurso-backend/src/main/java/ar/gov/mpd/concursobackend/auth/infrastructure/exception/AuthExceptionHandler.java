package ar.gov.mpd.concursobackend.auth.infrastructure.exception;

import javax.security.auth.login.AccountLockedException;

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

@RestControllerAdvice
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

} 