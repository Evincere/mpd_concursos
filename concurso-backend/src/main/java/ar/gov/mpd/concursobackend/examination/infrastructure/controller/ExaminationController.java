package ar.gov.mpd.concursobackend.examination.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;
import ar.gov.mpd.concursobackend.examination.application.service.ExaminationService;
import ar.gov.mpd.concursobackend.examination.application.dto.*;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examenes")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;
    private final SecurityUtils securityUtils;

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

    /**
     * Verifica si un examen ya fue realizado por el usuario actual
     * 
     * @param id ID del examen
     * @return ResponseEntity con la respuesta
     */
    @GetMapping("/{id}/verificar-realizado")
    public ResponseEntity<VerificarExamenResponse> verificarExamenRealizado(@PathVariable UUID id) {
        // Obtener el ID del usuario actual desde el contexto de seguridad
        UUID userId = UUID.fromString(securityUtils.getCurrentUserId());

        // Verificar si existe una sesión finalizada para este usuario y examen
        boolean realizado = examinationService.verificarExamenRealizado(id, userId);

        VerificarExamenResponse response = VerificarExamenResponse.builder()
                .realizado(realizado)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Finaliza un examen
     * 
     * @param id      ID del examen
     * @param request Datos de finalización del examen
     * @return ResponseEntity
     */
    @PostMapping("/{id}/finalizar")
    public ResponseEntity<Void> finalizarExamen(
            @PathVariable UUID id,
            @RequestBody FinalizarExamenRequest request) {
        // Obtener el ID del usuario actual desde el contexto de seguridad
        UUID userId = UUID.fromString(securityUtils.getCurrentUserId());

        // Finalizar el examen
        examinationService.finalizarExamen(id, userId, request);

        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint alternativo para finalizar un examen (para compatibilidad)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitExamen(
            @PathVariable UUID id,
            @RequestBody FinalizarExamenRequest request) {
        // Obtener el ID del usuario actual desde el contexto de seguridad
        UUID userId = UUID.fromString(securityUtils.getCurrentUserId());

        // Finalizar el examen
        examinationService.finalizarExamen(id, userId, request);

        return ResponseEntity.ok().build();
    }
}