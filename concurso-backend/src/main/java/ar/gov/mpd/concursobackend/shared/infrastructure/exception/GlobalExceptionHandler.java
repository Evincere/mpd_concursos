package ar.gov.mpd.concursobackend.shared.infrastructure.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import ar.gov.mpd.concursobackend.shared.infrastructure.dto.ApiError;
import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                "No tiene permisos suficientes para realizar esta acción",
                "Para gestionar roles de usuario se requiere ser administrador del sistema");
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(IllegalStateException ex) {
        log.debug("Manejando IllegalStateException: {}", ex.getMessage());

        // Verificar si es un error de inscripción duplicada
        if (ex.getMessage() != null && ex.getMessage().contains("Ya existe una inscripción activa")) {
            ApiError apiError = new ApiError(
                    HttpStatus.CONFLICT.value(),
                    "Ya existe una inscripción para este concurso",
                    "Ya existe una inscripción activa para este concurso. Por favor, verifique su estado actual.");
            return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
        }

        // Para otros errores de estado ilegal, devolver 400 Bad Request
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Error en la solicitud",
                ex.getMessage());
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // Manejador para excepciones de recursos no encontrados
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFoundException(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        log.error("Recurso no encontrado: {}", ex.getMessage());

        // Extraer la ruta del mensaje de error
        String resourcePath = ex.getMessage().replace("No static resource ", "").replace(".", "");

        // Verificar si es una ruta de API
        if (resourcePath.startsWith("api/")) {
            ApiError apiError = new ApiError(
                    HttpStatus.NOT_FOUND.value(),
                    "Recurso no encontrado",
                    "El recurso solicitado no existe: " + resourcePath);
            return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
        }

        // Para otros recursos estáticos
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                "Recurso no encontrado",
                "El recurso estático solicitado no existe");
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    // Manejador genérico para excepciones no controladas
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        log.error("Error no controlado: {}", ex.getMessage(), ex);

        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Error interno del servidor",
                "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.");
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}