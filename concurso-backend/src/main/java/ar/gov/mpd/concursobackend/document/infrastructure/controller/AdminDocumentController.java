package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.service.AdminDocumentService;
import ar.gov.mpd.concursobackend.document.application.service.AdminDocumentService.AdminDocumentDto;
import ar.gov.mpd.concursobackend.document.application.service.AdminDocumentService.DocumentStatistics;
import ar.gov.mpd.concursobackend.document.application.service.AdminDocumentService.DocumentFilters;
import ar.gov.mpd.concursobackend.document.application.service.AdminDocumentService.PagedDocumentResponse;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Controlador REST para administración de documentos
 * Proporciona endpoints específicos para administradores
 */
@RestController
@RequestMapping("/api/admin/documents")
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com", "https://vps-4778464-x.dattaweb.com:9003"}, allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Documents", description = "API para administración de documentos")
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;
    private final SecurityUtils securityUtils;

    /**
     * DTO para solicitud de rechazo de documento
     */
    public static class RejectDocumentRequest {
        private String motivo;

        public RejectDocumentRequest() {}

        public RejectDocumentRequest(String motivo) {
            this.motivo = motivo;
        }

        public String getMotivo() { return motivo; }
        public void setMotivo(String motivo) { this.motivo = motivo; }
    }

    /**
     * Lista documentos con filtros y paginación para administradores
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar documentos para administración",
               description = "Lista todos los documentos con filtros avanzados para administradores")
    public ResponseEntity<PagedDocumentResponse> getDocuments(
        @Parameter(description = "Número de página (base 0)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "20") int size,
        @Parameter(description = "Filtrar por título") @RequestParam(required = false) String titulo,
        @Parameter(description = "Filtrar por tipo de documento") @RequestParam(required = false) String tipo,
        @Parameter(description = "Filtrar por estado") @RequestParam(required = false) String estado,
        @Parameter(description = "Filtrar por usuario") @RequestParam(required = false) String usuario,
        @Parameter(description = "Fecha desde") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
        @Parameter(description = "Fecha hasta") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta,
        @Parameter(description = "Campo de ordenación") @RequestParam(defaultValue = "fechaCreacion") String sortBy,
        @Parameter(description = "Dirección de ordenación") @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        DocumentFilters filters = // CORREGIR ORDEN DE PARAMETROS
        // titulo, tipo, estado, usuario, fechaDesde, fechaHasta
        // pero constructor espera: estado, tipoDocumentoId, busqueda, usuarioId, fechaDesde, fechaHasta
        new DocumentFilters(
            estado, tipo, titulo, usuario, fechaDesde, fechaHasta);

        PagedDocumentResponse response = adminDocumentService.getDocumentsWithFilters(
            page, size, filters, sortBy, sortDir);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene un documento específico por su ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener documento por ID",
               description = "Obtiene los detalles completos de un documento específico")
    public ResponseEntity<AdminDocumentDto> getDocumentById(@PathVariable UUID id) {
        try {
            AdminDocumentDto document = adminDocumentService.getDocumentById(id);
            return ResponseEntity.ok(document);
        } catch (RuntimeException e) {
            log.warn("Documento no encontrado: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Actualiza un documento existente
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar documento",
               description = "Actualiza los datos de un documento existente")
    public ResponseEntity<AdminDocumentDto> updateDocument(
        @PathVariable UUID id,
        @Valid @RequestBody DocumentDto documentDto
    ) {
        try {
            AdminDocumentDto updatedDocument = adminDocumentService.updateDocument(id, documentDto);
            return ResponseEntity.ok(updatedDocument);
        } catch (RuntimeException e) {
            log.warn("Error al actualizar documento {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Aprueba un documento
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Aprobar documento",
               description = "Marca un documento como aprobado")
    public ResponseEntity<Map<String, String>> approveDocument(@PathVariable UUID id) {
        try {
            String adminUsername = securityUtils.getCurrentUsername();
            adminDocumentService.approveDocument(id.toString(), UUID.fromString(securityUtils.getCurrentUserId()));
            log.info("Documento {} aprobado por admin {}", id, adminUsername);
            return ResponseEntity.ok(Map.of("message", "Documento aprobado exitosamente"));
        } catch (RuntimeException e) {
            log.warn("Error al aprobar documento {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Rechaza un documento con motivo
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rechazar documento",
               description = "Rechaza un documento con un motivo específico")
    public ResponseEntity<Map<String, String>> rejectDocument(
        @PathVariable UUID id,
        @Valid @RequestBody RejectDocumentRequest request
    ) {
        try {
            String adminUsername = securityUtils.getCurrentUsername();
            adminDocumentService.rejectDocument(id.toString(), request.getMotivo(), UUID.fromString(securityUtils.getCurrentUserId()));
            log.info("Documento {} rechazado por admin {} con motivo: {}", 
                    id, adminUsername, request.getMotivo());
            return ResponseEntity.ok(Map.of("message", "Documento rechazado exitosamente"));
        } catch (RuntimeException e) {
            log.warn("Error al rechazar documento {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Elimina (archiva) un documento
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar documento",
               description = "Archiva lógicamente un documento y elimina el archivo físico si existe")
    public ResponseEntity<Map<String, String>> deleteDocument(@PathVariable UUID id) {
        try {
            String adminUsername = securityUtils.getCurrentUsername();
            adminDocumentService.deleteDocument(id, adminUsername);
            log.info("Documento {} eliminado (archivado) por admin {}", id, adminUsername);
            return ResponseEntity.ok(Map.of("message", "Documento eliminado exitosamente"));
        } catch (RuntimeException e) {
            log.warn("Error al eliminar documento {}: {}", id, e.getMessage());
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtiene estadísticas de documentos
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Estadísticas de documentos",
               description = "Obtiene estadísticas generales sobre los documentos del sistema")
    public ResponseEntity<DocumentStatistics> getDocumentStatistics() {
        DocumentStatistics stats = adminDocumentService.getDocumentStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Búsqueda avanzada de documentos
     */
    @PostMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Búsqueda avanzada",
               description = "Realiza una búsqueda avanzada de documentos con criterios complejos")
    public ResponseEntity<PagedDocumentResponse> searchDocuments(
        @Parameter(description = "Número de página") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "20") int size,
        @Parameter(description = "Texto de búsqueda") @RequestParam(required = false) String searchText,
        @Valid @RequestBody(required = false) DocumentFilters filters
    ) {
        if (filters == null) {
            filters = // CORREGIR ORDEN DE PARAMETROS
        // titulo, tipo, estado, usuario, fechaDesde, fechaHasta
        // pero constructor espera: estado, tipoDocumentoId, busqueda, usuarioId, fechaDesde, fechaHasta
        new DocumentFilters();
        }
        if (searchText != null) {
            filters.setBusqueda(searchText);
        }

        PagedDocumentResponse response = adminDocumentService.getDocuments(
            filters, page, size, "uploadDate", "desc");

        return ResponseEntity.ok(response);
    }

    /**
     * Revierte un documento a estado PENDING
     */
    @PostMapping("/{id}/revert")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Revertir documento a PENDING",
               description = "Revierte un documento aprobado o rechazado de vuelta a estado PENDING")
    public ResponseEntity<Map<String, String>> revertDocument(@PathVariable UUID id) {
        try {
            String adminUsername = securityUtils.getCurrentUsername();
            adminDocumentService.revertDocument(id.toString(), UUID.fromString(securityUtils.getCurrentUserId()));
            log.info("Documento {} revertido a PENDING por admin {}", id, adminUsername);
            return ResponseEntity.ok(Map.of("message", "Documento revertido a PENDING exitosamente"));
        } catch (RuntimeException e) {
            log.warn("Error al revertir documento {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
