package ar.gov.mpd.concursobackend.shared.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/time")
public class TimeController {
    
    @GetMapping
    public Long getCurrentTime() {
        return Instant.now().getEpochSecond();
    }
} 