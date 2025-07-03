package ar.gov.mpd.concursobackend.examination.infrastructure.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    @PostMapping
    public ResponseEntity<Void> logActivity(@RequestBody ActivityLogRequest request) {
        // Ignorar logs de network-information que no son críticos
        if ("network-information".equals(request.type())) {
            return ResponseEntity.ok().build();
        }
        System.out.println("Activity log received: " + request);
        return ResponseEntity.ok().build();
    }
}

record ActivityLogRequest(String type, String timestamp, String details) {} 