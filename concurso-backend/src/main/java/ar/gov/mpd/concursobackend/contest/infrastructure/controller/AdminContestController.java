package ar.gov.mpd.concursobackend.contest.infrastructure.controller;

import ar.gov.mpd.concursobackend.contest.application.ContestService;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestUpdateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestStatsResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDateCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDateUpdateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestRequirementCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestRequirementUpdateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.mapper.ContestMapper;
import ar.gov.mpd.concursobackend.contest.application.validator.ContestValidator;
import ar.gov.mpd.concursobackend.shared.infrastructure.dto.PageResponse;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestDateDTO;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestRequirementDTO;
import ar.gov.mpd.concursobackend.contest.application.ContestDateService;
import ar.gov.mpd.concursobackend.contest.application.ContestRequirementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/contests")
@RequiredArgsConstructor
@Tag(name = "Admin Contests", description = "Endpoints para la gestión administrativa de concursos")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContestController {

    private final ContestService contestService;
    private final ContestMapper contestMapper;
    private final ContestValidator contestValidator;
    private final ContestDateService contestDateService;
    private final ContestRequirementService contestRequirementService;

    @GetMapping
    @Operation(summary = "Obtiene todos los concursos con filtros y paginación")
    public ResponseEntity<PageResponse<ContestResponse>> getAllContests(
            @Parameter(description = "Término de búsqueda") @RequestParam(required = false) String search,
            @Parameter(description = "Estado del concurso") @RequestParam(required = false) String status,
            @Parameter(description = "Departamento") @RequestParam(required = false) String department,
            @Parameter(description = "Cargo") @RequestParam(required = false) String position,
            @Parameter(description = "Categoría") @RequestParam(required = false) String category,
            @Parameter(description = "Fecha de inicio") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Fecha de fin") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Número de página") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo de ordenamiento") @RequestParam(defaultValue = "id") String sort,
            @Parameter(description = "Dirección de ordenamiento") @RequestParam(defaultValue = "DESC") String direction) {

        // Crear objeto de filtros
        ContestFilters filters = ContestFilters.builder()
                .search(search)
                .status(status)
                .department(department)
                .position(position)
                .category(category)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        // Crear objeto de paginación
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        // Obtener concursos paginados
        Page<Contest> contestsPage = contestService.getContestsPaged(filters, pageable);

        // Mapear a DTOs
        List<ContestResponse> contestResponses = contestsPage.getContent().stream()
                .map(contestMapper::toResponse)
                .collect(Collectors.toList());

        PageResponse<ContestResponse> response = PageResponse.<ContestResponse>builder()
                .content(contestResponses)
                .totalElements(contestsPage.getTotalElements())
                .totalPages(contestsPage.getTotalPages())
                .size(contestsPage.getSize())
                .number(contestsPage.getNumber())
                .first(contestsPage.isFirst())
                .last(contestsPage.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtiene un concurso por su ID")
    public ResponseEntity<ContestResponse> getContestById(@PathVariable Long id) {
        Contest contest = contestService.getContestById(id);
        ContestResponse response = contestMapper.toResponse(contest);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Crea un nuevo concurso")
    public ResponseEntity<?> createContest(@Valid @RequestBody ContestCreateRequest request) {
        // Validar request
        List<String> validationErrors = contestValidator.validateCreateRequest(request);
        if (!validationErrors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("errors", validationErrors));
        }

        Contest contest = contestMapper.fromCreateRequest(request);
        Contest savedContest = contestService.createContest(contest);
        ContestResponse response = contestMapper.toResponse(savedContest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualiza un concurso existente")
    public ResponseEntity<ContestResponse> updateContest(
            @PathVariable Long id,
            @Valid @RequestBody ContestUpdateRequest request) {
        Contest contest = contestMapper.fromUpdateRequest(request);
        contest.setId(id);
        Contest updatedContest = contestService.updateContest(contest);
        ContestResponse response = contestMapper.toResponse(updatedContest);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cambia el estado de un concurso")
    public ResponseEntity<ContestResponse> changeContestStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Contest updatedContest = contestService.changeContestStatus(id, status);
            ContestResponse response = contestMapper.toResponse(updatedContest);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/valid-next-states")
    @Operation(summary = "Obtiene los estados válidos siguientes para un concurso")
    public ResponseEntity<Set<String>> getValidNextStates(@PathVariable Long id) {
        try {
            Set<ContestStatus> validStates = contestService.getValidNextStates(id);
            Set<String> stateNames = validStates.stream()
                .map(ContestStatus::name)
                .collect(java.util.stream.Collectors.toSet());
            return ResponseEntity.ok(stateNames);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/allows-inscriptions")
    @Operation(summary = "Verifica si un concurso permite inscripciones")
    public ResponseEntity<Boolean> allowsInscriptions(@PathVariable Long id) {
        try {
            boolean allows = contestService.allowsInscriptions(id);
            return ResponseEntity.ok(allows);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Elimina un concurso (solo si está en estado DRAFT)")
    public ResponseEntity<Void> deleteContest(@PathVariable Long id) {
        contestService.deleteContest(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtiene estadísticas de concursos")
    public ResponseEntity<ContestStatsResponse> getContestStats() {
        ContestStatsResponse stats = contestService.getContestStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/departments")
    @Operation(summary = "Obtiene la lista de departamentos disponibles")
    public ResponseEntity<List<String>> getDepartments() {
        List<String> departments = contestService.getAvailableDepartments();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/categories")
    @Operation(summary = "Obtiene la lista de categorías disponibles")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = contestService.getAvailableCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/positions")
    @Operation(summary = "Obtiene la lista de cargos disponibles")
    public ResponseEntity<List<String>> getPositions() {
        List<String> positions = contestService.getAvailablePositions();
        return ResponseEntity.ok(positions);
    }

    // Endpoints para fechas de concursos
    @GetMapping("/{id}/dates")
    @Operation(summary = "Obtiene todas las fechas importantes de un concurso")
    public ResponseEntity<List<ContestDateDTO>> getContestDates(@PathVariable Long id) {
        List<ContestDateDTO> dates = contestDateService.getContestDates(id);
        return ResponseEntity.ok(dates);
    }

    @PostMapping("/{id}/dates")
    @Operation(summary = "Crea una nueva fecha importante para un concurso")
    public ResponseEntity<ContestDateDTO> createContestDate(
            @PathVariable Long id,
            @Valid @RequestBody ContestDateCreateRequest request) {
        ContestDateDTO createdDate = contestDateService.createContestDate(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDate);
    }

    @PutMapping("/{id}/dates/{dateId}")
    @Operation(summary = "Actualiza una fecha importante existente")
    public ResponseEntity<ContestDateDTO> updateContestDate(
            @PathVariable Long id,
            @PathVariable Long dateId,
            @Valid @RequestBody ContestDateUpdateRequest request) {
        ContestDateDTO updatedDate = contestDateService.updateContestDate(dateId, request);
        return ResponseEntity.ok(updatedDate);
    }

    @DeleteMapping("/{id}/dates/{dateId}")
    @Operation(summary = "Elimina una fecha importante")
    public ResponseEntity<Void> deleteContestDate(
            @PathVariable Long id,
            @PathVariable Long dateId) {
        contestDateService.deleteContestDate(dateId);
        return ResponseEntity.noContent().build();
    }

    // Endpoints para requisitos de concursos
    @GetMapping("/{id}/requirements")
    @Operation(summary = "Obtiene todos los requisitos de un concurso")
    public ResponseEntity<List<ContestRequirementDTO>> getContestRequirements(@PathVariable Long id) {
        List<ContestRequirementDTO> requirements = contestRequirementService.getContestRequirements(id);
        return ResponseEntity.ok(requirements);
    }

    @PostMapping("/{id}/requirements")
    @Operation(summary = "Crea un nuevo requisito para un concurso")
    public ResponseEntity<ContestRequirementDTO> createContestRequirement(
            @PathVariable Long id,
            @Valid @RequestBody ContestRequirementCreateRequest request) {
        ContestRequirementDTO createdRequirement = contestRequirementService.createRequirement(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRequirement);
    }

    @PutMapping("/{id}/requirements/{requirementId}")
    @Operation(summary = "Actualiza un requisito existente")
    public ResponseEntity<ContestRequirementDTO> updateContestRequirement(
            @PathVariable Long id,
            @PathVariable Long requirementId,
            @Valid @RequestBody ContestRequirementUpdateRequest request) {
        ContestRequirementDTO updatedRequirement = contestRequirementService.updateRequirement(requirementId, request);
        return ResponseEntity.ok(updatedRequirement);
    }

    @DeleteMapping("/{id}/requirements/{requirementId}")
    @Operation(summary = "Elimina un requisito")
    public ResponseEntity<Void> deleteContestRequirement(
            @PathVariable Long id,
            @PathVariable Long requirementId) {
        contestRequirementService.deleteRequirement(requirementId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/requirements/categories")
    @Operation(summary = "Obtiene las categorías de requisitos disponibles")
    public ResponseEntity<List<String>> getRequirementCategories(@PathVariable Long id) {
        List<String> categories = contestRequirementService.getAvailableCategories(id);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}/requirements/document-types")
    @Operation(summary = "Obtiene los tipos de documento disponibles")
    public ResponseEntity<List<String>> getRequirementDocumentTypes(@PathVariable Long id) {
        List<String> documentTypes = contestRequirementService.getAvailableDocumentTypes(id);
        return ResponseEntity.ok(documentTypes);
    }

    // Endpoint global para obtener todas las fechas
    @GetMapping("/dates")
    @Operation(summary = "Obtiene todas las fechas importantes de todos los concursos")
    public ResponseEntity<List<ContestDateDTO>> getAllContestDates(
            @Parameter(description = "Fecha de inicio del rango") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Fecha de fin del rango") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<ContestDateDTO> dates;

        if (startDate != null && endDate != null) {
            dates = contestDateService.getAllContestDatesInRange(startDate, endDate);
        } else {
            dates = contestDateService.getAllContestDates();
        }

        return ResponseEntity.ok(dates);
    }

    // Endpoints globales para tipos y categorías
    @GetMapping("/date-types")
    @Operation(summary = "Obtiene todos los tipos de fechas disponibles")
    public ResponseEntity<List<String>> getAllDateTypes() {
        List<String> dateTypes = List.of(
            "INSCRIPCION_INICIO",
            "INSCRIPCION_FIN",
            "EVALUACION_INICIO",
            "EVALUACION_FIN",
            "ENTREVISTA",
            "PUBLICACION_RESULTADOS",
            "OTRO"
        );
        return ResponseEntity.ok(dateTypes);
    }

    @GetMapping("/requirement-categories")
    @Operation(summary = "Obtiene todas las categorías de requisitos disponibles")
    public ResponseEntity<List<String>> getAllRequirementCategories() {
        List<String> categories = List.of(
            "EDUCACION",
            "PROFESIONAL",
            "ANTECEDENTES",
            "EXPERIENCIA",
            "CONOCIMIENTOS",
            "CAPACITACION",
            "CERTIFICACIONES"
        );
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/document-types")
    @Operation(summary = "Obtiene todos los tipos de documento disponibles")
    public ResponseEntity<List<String>> getAllDocumentTypes() {
        List<String> documentTypes = List.of(
            "titulo-universitario",
            "certificado-profesional",
            "antecedentes-penales",
            "certificado-ley-micaela",
            "dni-frente",
            "dni-dorso",
            "cuil",
            "curriculum-vitae"
        );
        return ResponseEntity.ok(documentTypes);
    }

    @GetMapping("/requirement-templates")
    @Operation(summary = "Obtiene todas las plantillas de requisitos disponibles")
    public ResponseEntity<List<Object>> getAllRequirementTemplates() {
        // Por ahora retornamos una lista vacía
        // TODO: Implementar sistema de plantillas de requisitos
        return ResponseEntity.ok(List.of());
    }
}
