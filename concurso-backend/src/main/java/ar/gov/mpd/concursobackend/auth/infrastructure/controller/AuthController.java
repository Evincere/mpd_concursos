package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.exception.BlockedAccountException;
import ar.gov.mpd.concursobackend.auth.domain.exception.ExpiredAccountException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InactiveAccountException;
import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCredentialsException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateDto newUser, BindingResult bindingResult) {
        if (validateBindingResult(bindingResult)) {
            return ResponseEntity.badRequest().body(bindingResult.getAllErrors());
        }
        userService.createUser(newUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLogin userLogin, BindingResult bindingResult) {
        logger.info("Intento de login para usuario: {}", userLogin.getUsername());

        if (validateBindingResult(bindingResult)) {
            logger.error("Errores de validación en el login");
            return ResponseEntity.badRequest().body(bindingResult.getAllErrors());
        }

        try {
            JwtDto jwtDto = userService.login(userLogin);
            logger.info("Login exitoso para usuario: {}", userLogin.getUsername());
            return ResponseEntity.ok(jwtDto);
        } catch (BlockedAccountException e) {
            logger.warn("Intento de login en cuenta bloqueada: {}", userLogin.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Cuenta bloqueada", e.getMessage()));
        } catch (InactiveAccountException e) {
            logger.warn("Intento de login en cuenta inactiva: {}", userLogin.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Cuenta inactiva", e.getMessage()));
        } catch (ExpiredAccountException e) {
            logger.warn("Intento de login en cuenta expirada: {}", userLogin.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Cuenta expirada", e.getMessage()));
        } catch (InvalidCredentialsException e) {
            logger.error("Credenciales inválidas para usuario: {}", userLogin.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Credenciales inválidas", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error inesperado en el login para usuario {}: {}", userLogin.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error de autenticación", "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde."));
        }
    }

    @GetMapping("/debug/users")
    public ResponseEntity<?> debugUsers() {
        try {
            // Este endpoint es solo para debugging - remover en producción
            return ResponseEntity.ok(userService.getAllUsersDebug());
        } catch (Exception e) {
            logger.error("Error al obtener usuarios para debug", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor", e.getMessage()));
        }
    }

    private boolean validateBindingResult(BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            bindingResult.getAllErrors()
                    .forEach(error -> logger.error("Validation error: " + error.getDefaultMessage()));
            return true;
        }
        return false;
    }

    private static class ErrorResponse {
        private final String error;
        private final String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }

        @SuppressWarnings("unused")
        public String getError() {
            return error;
        }

        @SuppressWarnings("unused")
        public String getMessage() {
            return message;
        }
    }
}