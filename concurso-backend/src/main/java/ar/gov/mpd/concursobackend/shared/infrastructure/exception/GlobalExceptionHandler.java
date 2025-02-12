package ar.gov.mpd.concursobackend.shared.infrastructure.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import ar.gov.mpd.concursobackend.shared.infrastructure.dto.ApiError;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                "No tiene permisos suficientes para realizar esta acción",
                "Para gestionar roles de usuario se requiere ser administrador del sistema");
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    // Aquí puedes agregar más manejadores de excepciones según sea necesario
}