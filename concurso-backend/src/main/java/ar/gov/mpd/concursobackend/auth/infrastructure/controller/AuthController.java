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
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/auth")
@CrossOrigin
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
        if (validateBindingResult(bindingResult)) {
            return ResponseEntity.badRequest().body(bindingResult.getAllErrors());
        }
        JwtDto jwtDto = userService.login(userLogin);
        logger.info("Usuario logueado: {}", userLogin.getUsername());
        logger.info("jwtDto: {}", jwtDto.getBearer());
        return new ResponseEntity<>(jwtDto, HttpStatus.OK);
    }

    private boolean validateBindingResult(BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            bindingResult.getAllErrors().forEach(error -> logger.error("Validation error: " + error.getDefaultMessage()));
            return true;
        }
        return false;
    }

} 