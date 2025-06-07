package ar.gov.mpd.concursobackend.inscription.infrastructure.controller;

import ar.gov.mpd.concursobackend.inscription.application.AdminInscriptionService;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.AdminInscriptionDTO;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionNoteDTO;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionStateChangeDTO;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionReportRequestDTO;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.mapper.AdminInscriptionMapper;
import ar.gov.mpd.concursobackend.shared.infrastructure.controller.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/inscriptions")
@RequiredArgsConstructor
@Tag(name = "Admin Inscriptions", description = "Endpoints para la gestión administrativa de inscripciones")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInscriptionController {

    private final AdminInscriptionService adminInscriptionService;
    private final AdminInscriptionMapper adminInscriptionMapper;

    @GetMapping
    @Operation(summary = "Obtiene todas las inscripciones con filtros y paginación")
    public ResponseEntity<PageResponse<AdminInscriptionDTO>> getAllInscriptions(
            @RequestParam(required = false) Long contestId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) InscriptionState state,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<Inscription> inscriptionsPage = adminInscriptionService.getAllInscriptions(
                contestId, userId, state, startDate, endDate, search, pageable
        );

        PageResponse<AdminInscriptionDTO> response = new PageResponse<>(
                adminInscriptionMapper.toAdminDTOList(inscriptionsPage.getContent()),
                inscriptionsPage.getNumber(),
                inscriptionsPage.getSize(),
                inscriptionsPage.getTotalElements(),
                inscriptionsPage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtiene una inscripción por su ID")
    public ResponseEntity<AdminInscriptionDTO> getInscriptionById(@PathVariable String id) {
        Inscription inscription = adminInscriptionService.getInscriptionById(id);
        return ResponseEntity.ok(adminInscriptionMapper.toAdminDTO(inscription));
    }

    @PatchMapping("/{id}/state")
    @Operation(summary = "Cambia el estado de una inscripción")
    public ResponseEntity<AdminInscriptionDTO> changeInscriptionState(
            @PathVariable String id,
            @RequestBody InscriptionStateChangeDTO stateChangeDTO
    ) {
        try {
            Inscription updatedInscription = adminInscriptionService.changeInscriptionState(
                    id,
                    stateChangeDTO.getNewState(),
                    stateChangeDTO.getNote()
            );
            return ResponseEntity.ok(adminInscriptionMapper.toAdminDTO(updatedInscription));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/valid-next-states")
    @Operation(summary = "Obtiene los estados válidos siguientes para una inscripción")
    public ResponseEntity<Set<String>> getValidNextStates(@PathVariable String id) {
        try {
            Inscription inscription = adminInscriptionService.getInscriptionById(id);
            Set<InscriptionState> validStates = adminInscriptionService.getValidNextStates(inscription.getState());
            Set<String> stateNames = validStates.stream()
                .map(InscriptionState::name)
                .collect(java.util.stream.Collectors.toSet());
            return ResponseEntity.ok(stateNames);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/allows-document-upload")
    @Operation(summary = "Verifica si una inscripción permite carga de documentos")
    public ResponseEntity<Boolean> allowsDocumentUpload(@PathVariable String id) {
        try {
            Inscription inscription = adminInscriptionService.getInscriptionById(id);
            boolean allows = adminInscriptionService.allowsDocumentUpload(inscription.getState());
            return ResponseEntity.ok(allows);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/is-resumable")
    @Operation(summary = "Verifica si una inscripción puede ser reanudada por el usuario")
    public ResponseEntity<Boolean> isResumable(@PathVariable String id) {
        try {
            Inscription inscription = adminInscriptionService.getInscriptionById(id);
            boolean resumable = adminInscriptionService.isResumable(inscription.getState());
            return ResponseEntity.ok(resumable);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Agrega una nota a una inscripción")
    public ResponseEntity<InscriptionNoteDTO> addNote(
            @PathVariable String id,
            @RequestBody InscriptionNoteDTO noteDTO
    ) {
        InscriptionNote note = adminInscriptionService.addNote(id, noteDTO.getText());
        return new ResponseEntity<>(
                new InscriptionNoteDTO(note.getId().toString(), id, note.getText(), note.getCreatedByUsername(), note.getCreatedAt()),
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{inscriptionId}/notes/{noteId}")
    @Operation(summary = "Elimina una nota de una inscripción")
    public ResponseEntity<Void> deleteNote(
            @PathVariable String inscriptionId,
            @PathVariable String noteId
    ) {
        adminInscriptionService.deleteNote(inscriptionId, noteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtiene estadísticas generales de todas las inscripciones")
    public ResponseEntity<Map<String, Object>> getAllInscriptionStats() {
        Map<String, Object> stats = adminInscriptionService.getAllInscriptionStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/contest/{contestId}")
    @Operation(summary = "Obtiene estadísticas de inscripciones para un concurso específico")
    public ResponseEntity<Map<String, Long>> getInscriptionStats(@PathVariable Long contestId) {
        Map<InscriptionState, Long> stats = adminInscriptionService.getInscriptionStatsByContest(contestId);

        Map<String, Long> response = new HashMap<>();
        response.put("total", stats.values().stream().mapToLong(Long::longValue).sum());

        for (Map.Entry<InscriptionState, Long> entry : stats.entrySet()) {
            response.put(entry.getKey().name().toLowerCase(), entry.getValue());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/report")
    @Operation(summary = "Genera un reporte personalizado de inscripciones")
    public ResponseEntity<List<Map<String, Object>>> generateReport(@RequestBody InscriptionReportRequestDTO reportRequest) {
        List<Map<String, Object>> reportData = adminInscriptionService.generateReport(
            reportRequest.getFields(),
            reportRequest.getFilters(),
            reportRequest.getGroupBy(),
            reportRequest.getSortBy(),
            reportRequest.getSortDirection()
        );
        return ResponseEntity.ok(reportData);
    }
}
