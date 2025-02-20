package ar.gov.mpd.concursobackend.shared.controller;

import org.springframework.web.bind.annotation.*;
import java.time.Instant;

@RestController
@RequestMapping("/api/time")
public class TimeController {
    
    @GetMapping
    public Long getCurrentTime() {
        return Instant.now().getEpochSecond();
    }
} 