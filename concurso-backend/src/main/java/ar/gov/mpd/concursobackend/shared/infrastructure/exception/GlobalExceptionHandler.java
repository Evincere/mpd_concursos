package ar.gov.mpd.concursobackend.shared.infrastructure.exception;

import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.DuplicateInscriptionException;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InscriptionNotFoundException;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InvalidInscriptionException;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InvalidInscriptionStatusException;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InscriptionPeriodClosedException;
import ar.gov.mpd.concursobackend.shared.infrastructure.dto.ApiError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import jakarta.persistence.OptimisticLockException;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;

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

    // ========== MANEJADORES ESPECÍFICOS PARA EXCEPCIONES DE INSCRIPCIONES ==========

    @ExceptionHandler(InscriptionNotFoundException.class)
    public ResponseEntity<ApiError> handleInscriptionNotFoundException(InscriptionNotFoundException ex) {
        log.warn("Inscripción no encontrada: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                "Inscripción no encontrada",
                ex.getMessage() != null ? ex.getMessage() : "La inscripción solicitada no existe o no tiene permisos para acceder a ella");
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateInscriptionException.class)
    public ResponseEntity<ApiError> handleDuplicateInscriptionException(DuplicateInscriptionException ex) {
        log.warn("Intento de inscripción duplicada: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                "Ya existe una inscripción para este concurso",
                ex.getMessage() != null ? ex.getMessage() : "Ya existe una inscripción activa para este concurso. Por favor, verifique su estado actual.");
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidInscriptionException.class)
    public ResponseEntity<ApiError> handleInvalidInscriptionException(InvalidInscriptionException ex) {
        log.warn("Datos de inscripción inválidos: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Datos de inscripción inválidos",
                ex.getMessage() != null ? ex.getMessage() : "Los datos proporcionados para la inscripción no son válidos");
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidInscriptionStatusException.class)
    public ResponseEntity<ApiError> handleInvalidInscriptionStatusException(InvalidInscriptionStatusException ex) {
        log.warn("Estado de inscripción inválido: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Estado de inscripción inválido",
                ex.getMessage() != null ? ex.getMessage() : "El estado de inscripción proporcionado no es válido o no se puede aplicar en este contexto");
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InscriptionPeriodClosedException.class)
    public ResponseEntity<ApiError> handleInscriptionPeriodClosedException(InscriptionPeriodClosedException ex) {
        log.warn("Intento de inscripción fuera de período: Concurso ID {} - {}", ex.getContestId(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                "Período de inscripción cerrado",
                ex.getMessage());
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }



    // ========== MANEJADOR PARA EXCEPCIONES DE DOCUMENTOS ========== 
    @ExceptionHandler(DocumentException.class)
    public ResponseEntity<ApiError> handleDocumentException(DocumentException ex) {
        log.warn("Error de documento: {}", ex.getMessage());
        int status = HttpStatus.BAD_REQUEST.value();
        String message = ex.getMessage();
        String detail = ex.getCause() != null ? ex.getCause().toString() : "";
        // Si el mensaje indica conflicto, usar 409
        if (message != null && (message.toLowerCase().contains("conflicto") || message.toLowerCase().contains("conflict") || message.toLowerCase().contains("ya existe") )) {
            status = HttpStatus.CONFLICT.value();
        }
        ApiError apiError = new ApiError(status, message, detail);
        return new ResponseEntity<>(apiError, HttpStatus.valueOf(status));
    }

    // ========== MANEJADOR MEJORADO PARA CONFLICTOS DE CONCURRENCIA (OPTIMISTIC LOCKING) ==========
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleOptimisticLocking(ObjectOptimisticLockingFailureException ex) {
        log.warn("🔒 [GlobalExceptionHandler] Conflicto de concurrencia detectado: {}", ex.getMessage());

        int status = HttpStatus.CONFLICT.value();
        String message;
        String detail;

        // Determinar el tipo de conflicto basado en el mensaje de la excepción
        if (ex.getMessage().contains("DocumentEntity")) {
            message = "El documento está siendo modificado por otra operación. La página se recargará automáticamente.";
            detail = "DOCUMENT_CONCURRENCY_CONFLICT";
            log.info("📄 [GlobalExceptionHandler] Conflicto de concurrencia en documento - se enviará señal de recarga al frontend");
        } else if (ex.getMessage().contains("InscriptionEntity")) {
            message = "La inscripción está siendo modificada por otra operación. Por favor, recargue la página.";
            detail = "INSCRIPTION_CONCURRENCY_CONFLICT";
        } else if (ex.getMessage().contains("NotificationJpaEntity")) {
            message = "La notificación está siendo procesada por otra operación. La acción se completará automáticamente.";
            detail = "NOTIFICATION_CONCURRENCY_CONFLICT";
        } else {
            message = "El recurso fue modificado por otra operación. Por favor, recargue la página e intente nuevamente.";
            detail = "GENERIC_CONCURRENCY_CONFLICT";
        }

        ApiError apiError = new ApiError(status, message, detail);

        // Agregar headers específicos para que el frontend pueda manejar el conflicto apropiadamente
        return ResponseEntity.status(status)
                .header("X-Concurrency-Conflict", "true")
                .header("X-Conflict-Type", detail)
                .header("X-Retry-After", "2") // Sugerir retry después de 2 segundos
                .body(apiError);
    }

    // ========== MANEJADOR PARA OPERACIONES BLOQUEADAS POR LOCKS ==========
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleOperationLockException(IllegalStateException ex) {
        log.debug("🔐 [GlobalExceptionHandler] Manejando IllegalStateException: {}", ex.getMessage());

        // Verificar si es un error de lock de operación
        if (ex.getMessage() != null && ex.getMessage().contains("operación de reemplazo en progreso")) {
            log.info("🔒 [GlobalExceptionHandler] Operación bloqueada por lock activo");
            ApiError apiError = new ApiError(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Operación en progreso. Por favor, espere un momento e intente nuevamente.",
                    "OPERATION_LOCK_ACTIVE");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("X-Operation-Locked", "true")
                    .header("Retry-After", "3")
                    .body(apiError);
        }

        // Verificar si es un error de inscripción duplicada
        if (ex.getMessage() != null && ex.getMessage().contains("Ya existe una inscripción activa")) {
            ApiError apiError = new ApiError(
                    HttpStatus.CONFLICT.value(),
                    "Ya existe una inscripción para este concurso",
                    "Ya existe una inscripción activa para este concurso. Por favor, verifique su estado actual.");
            return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
        }

        // Para otros IllegalStateException, usar manejo genérico
        log.warn("⚠️ [GlobalExceptionHandler] IllegalStateException no específica: {}", ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Estado inválido para la operación solicitada",
                ex.getMessage());
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // ========== MANEJADORES MEJORADOS PARA EXCEPCIONES COMUNES ==========

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Argumento inválido: {}", ex.getMessage());

        String message = ex.getMessage();
        String userMessage = "Solicitud inválida";
        String detail = message;

        // Proporcionar mensajes más específicos basados en el contenido del error
        if (message != null) {
            if (message.toLowerCase().contains("concurso no encontrado") || message.toLowerCase().contains("contest not found")) {
                userMessage = "Concurso no encontrado";
                detail = "El concurso solicitado no existe o no está disponible";
            } else if (message.toLowerCase().contains("usuario no encontrado") || message.toLowerCase().contains("user not found")) {
                userMessage = "Usuario no encontrado";
                detail = "El usuario especificado no existe en el sistema";
            } else if (message.toLowerCase().contains("inscripción no encontrada") || message.toLowerCase().contains("inscription not found")) {
                userMessage = "Inscripción no encontrada";
                detail = "La inscripción solicitada no existe";
            } else if (message.toLowerCase().contains("id") && message.toLowerCase().contains("inválido")) {
                userMessage = "Identificador inválido";
                detail = "El identificador proporcionado no tiene un formato válido";
            } else if (message.toLowerCase().contains("estado") && message.toLowerCase().contains("inválido")) {
                userMessage = "Estado inválido";
                detail = message;
            }
        }

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                userMessage,
                detail);
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

    // Manejador mejorado para RuntimeException específicas
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntimeException(RuntimeException ex) {
        log.error("Error de tiempo de ejecución: {} - Tipo: {}", ex.getMessage(), ex.getClass().getSimpleName(), ex);

        String message = ex.getMessage();
        String userMessage = "Error en el procesamiento";
        String detail = "Ha ocurrido un error durante el procesamiento de su solicitud";

        // Proporcionar mensajes más específicos para errores comunes
        if (message != null) {
            if (message.toLowerCase().contains("verificar inscripción")) {
                userMessage = "Error al verificar inscripción";
                detail = "No se pudo verificar el estado de la inscripción. Por favor, inténtelo de nuevo";
            } else if (message.toLowerCase().contains("actualizar") && message.toLowerCase().contains("estado")) {
                userMessage = "Error al actualizar estado";
                detail = "No se pudo actualizar el estado. Por favor, inténtelo de nuevo";
            } else if (message.toLowerCase().contains("base de datos") || message.toLowerCase().contains("database")) {
                userMessage = "Error de base de datos";
                detail = "Ha ocurrido un error al acceder a los datos. Por favor, inténtelo de nuevo más tarde";
            }
        }

        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                userMessage,
                detail);
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ========== MANEJADOR GENÉRICO DE EXCEPCIONES ========== 
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        log.error("Error inesperado: {}", ex.getMessage(), ex);
        int status = HttpStatus.BAD_REQUEST.value();
        String message = "Error inesperado al reemplazar el documento";
        String detail = ex.getMessage();
        return ResponseEntity.status(status).body(new ApiError(status, message, detail));
    }
}