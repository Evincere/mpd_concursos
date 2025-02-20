package ar.gov.mpd.concursobackend.examination.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;
import ar.gov.mpd.concursobackend.examination.application.service.ExaminationService;
import ar.gov.mpd.concursobackend.examination.application.dto.ExaminationBackupResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/examenes")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;

    @GetMapping("/{id}/backup")
    public ResponseEntity<ExaminationBackupResponse> getExaminationBackup(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(examinationService.getBackup(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/backup")
    public ResponseEntity<Void> saveBackup(@PathVariable Long id, @RequestBody String answers) {
        examinationService.saveBackup(id, answers);
        return ResponseEntity.ok().build();
    }
} 