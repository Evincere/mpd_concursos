package ar.gov.mpd.concurso_backend.infrastructure.adapters.in.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public String testEndpoint() {
        // Aquí el controlador delega la lógica al servicio de aplicación
        return "{\"message\": \"Conexión exitosa desde el backend (lógica de negocio)!\"}";
    }
}
