package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ar.gov.mpd.concursobackend.auth.application.dto.JwtDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.dto.UserLogin;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.exception.EmailAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.exception.UserAlreadyExistsException;
import ar.gov.mpd.concursobackend.auth.domain.jwt.JwtProvider;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;


@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    PasswordEncoder passwordEncoder;
    
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserService userService;

    @Autowired
    RolService rolService;

    @Autowired
    JwtProvider jwtProvider;


    @GetMapping("/login")
    public ResponseEntity<Map<String, String>> login() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "loginView");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/some/protected/endpoint")
    @PreAuthorize("isAuthenticated()")
    @Secured("IS_AUTHENTICATED_FULLY")
    public String protectedEndpoint() {
        return "protectedView";
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateDto newUser, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return new ResponseEntity<>("Campos inválidos", HttpStatus.BAD_REQUEST);
        }

        try {
            // Crear usuario con roles
            userService.createUser(newUser);
            return new ResponseEntity<>("Usuario creado exitosamente", HttpStatus.CREATED);
        } catch (EmailAlreadyExistsException | UserAlreadyExistsException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
    
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLogin userlogin, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return new ResponseEntity<>("campos inválidos", HttpStatus.BAD_REQUEST);
        }
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(userlogin.getUsername(), passwordEncoder.encode(userlogin.getPassword())));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtProvider.generateToken(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        JwtDto jwtDto = new JwtDto(jwt, userDetails.getUsername(), userDetails.getAuthorities());
        return new ResponseEntity<>(jwtDto, HttpStatus.OK);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<String> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.CONFLICT);
    }
} 