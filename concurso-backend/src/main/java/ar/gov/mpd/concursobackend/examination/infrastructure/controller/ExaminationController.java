package ar.gov.mpd.concursobackend.examination.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;
import ar.gov.mpd.concursobackend.examination.application.service.ExaminationService;
import ar.gov.mpd.concursobackend.examination.application.dto.*;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examenes")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;

    @GetMapping
    public ResponseEntity<List<ExaminationDTO>> getAllExaminations() {
        return ResponseEntity.ok(examinationService.getAllExaminations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExaminationDTO> getExamination(@PathVariable UUID id) {
        return ResponseEntity.ok(examinationService.getExamination(id));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionDTO>> getExaminationQuestions(@PathVariable UUID id) {
        return ResponseEntity.ok(examinationService.getExaminationQuestions(id));
    }

    @GetMapping("/{id}/backup")
    public ResponseEntity<ExaminationBackupResponse> getExaminationBackup(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(examinationService.getBackup(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/backup")
    public ResponseEntity<Void> saveBackup(@PathVariable UUID id, @RequestBody String answers) {
        examinationService.saveBackup(id, answers);
        return ResponseEntity.ok().build();
    }
}