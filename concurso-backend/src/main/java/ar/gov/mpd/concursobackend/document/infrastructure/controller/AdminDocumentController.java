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
@RequestMapping("/api/admin/documentos")
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
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
     * DTO para anotación de documento
     */
    public static class DocumentAnnotationRequest {
        private String texto;
        private double posicionX;
        private double posicionY;

        public DocumentAnnotationRequest() {}

        public DocumentAnnotationRequest(String texto, double posicionX, double posicionY) {
            this.texto = texto;
            this.posicionX = posicionX;
            this.posicionY = posicionY;
        }

        public String getTexto() { return texto; }
        public void setTexto(String texto) { this.texto = texto; }
        public double getPosicionX() { return posicionX; }
        public void setPosicionX(double posicionX) { this.posicionX = posicionX; }
        public double getPosicionY() { return posicionY; }
        public void setPosicionY(double posicionY) { this.posicionY = posicionY; }
    }

    /**
     * DTO para respuesta de anotación
     */
    public static class DocumentAnnotationResponse {
        private String id;
        private String documentoId;
        private String texto;
        private double posicionX;
        private double posicionY;
        private String creadoPor;
        private LocalDateTime fechaCreacion;

        public DocumentAnnotationResponse() {}

        public DocumentAnnotationResponse(String id, String documentoId, String texto, double posicionX, double posicionY, String creadoPor, LocalDateTime fechaCreacion) {
            this.id = id;
            this.documentoId = documentoId;
            this.texto = texto;
            this.posicionX = posicionX;
            this.posicionY = posicionY;
            this.creadoPor = creadoPor;
            this.fechaCreacion = fechaCreacion;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getDocumentoId() { return documentoId; }
        public void setDocumentoId(String documentoId) { this.documentoId = documentoId; }
        public String getTexto() { return texto; }
        public void setTexto(String texto) { this.texto = texto; }
        public double getPosicionX() { return posicionX; }
        public void setPosicionX(double posicionX) { this.posicionX = posicionX; }
        public double getPosicionY() { return posicionY; }
        public void setPosicionY(double posicionY) { this.posicionY = posicionY; }
        public String getCreadoPor() { return creadoPor; }
        public void setCreadoPor(String creadoPor) { this.creadoPor = creadoPor; }
        public LocalDateTime getFechaCreacion() { return fechaCreacion; }
        public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    }

    /**
     * Obtiene documentos con filtros y paginación
     */
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Obtiene documentos con filtros y paginación")
    public ResponseEntity<PagedDocumentResponse> getDocuments(
            @Parameter(description = "Estado del documento") @RequestParam(required = false) String estado,
            @Parameter(description = "ID del tipo de documento") @RequestParam(required = false) String tipoDocumentoId,
            @Parameter(description = "ID del usuario") @RequestParam(required = false) String usuarioId,
            @Parameter(description = "Fecha desde") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @Parameter(description = "Fecha hasta") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta,
            @Parameter(description = "Término de búsqueda") @RequestParam(required = false) String busqueda,
            @Parameter(description = "Número de página") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo de ordenamiento") @RequestParam(defaultValue = "fechaCarga") String sort,
            @Parameter(description = "Dirección de ordenamiento") @RequestParam(defaultValue = "desc") String direction) {

        try {
            log.debug("Obteniendo documentos - página: {}, tamaño: {}, filtros: estado={}, tipo={}, usuario={}", 
                     page, size, estado, tipoDocumentoId, usuarioId);

            // Crear filtros
            DocumentFilters filters = new DocumentFilters();
            filters.setEstado(estado);
            filters.setTipoDocumentoId(tipoDocumentoId);
            filters.setUsuarioId(usuarioId);
            filters.setFechaDesde(fechaDesde);
            filters.setFechaHasta(fechaHasta);
            filters.setBusqueda(busqueda);

            PagedDocumentResponse response = adminDocumentService.getDocuments(filters, page, size, sort, direction);
            
            log.debug("Documentos obtenidos exitosamente - total: {}, página: {}", response.getTotalElements(), page);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al obtener documentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene estadísticas de documentos
     */
    @GetMapping("/estadisticas")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Obtiene estadísticas de documentos")
    public ResponseEntity<DocumentStatistics> getDocumentStatistics() {
        try {
            log.debug("Obteniendo estadísticas de documentos");
            
            DocumentStatistics statistics = adminDocumentService.getDocumentStatistics();
            
            log.debug("Estadísticas obtenidas - total: {}, pendientes: {}, aprobados: {}, rechazados: {}", 
                     statistics.getTotalDocumentos(), statistics.getPendientes(), 
                     statistics.getAprobados(), statistics.getRechazados());
            
            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("Error al obtener estadísticas de documentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Aprueba un documento
     */
    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Aprueba un documento")
    public ResponseEntity<DocumentDto> approveDocument(@PathVariable String id) {
        try {
            log.info("Aprobando documento: {}", id);

            String currentUserIdStr = securityUtils.getCurrentUserId();
            if (currentUserIdStr == null) {
                log.error("Usuario no autenticado al intentar aprobar documento");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UUID adminId = UUID.fromString(currentUserIdStr);
            DocumentDto approvedDocument = adminDocumentService.approveDocument(id, adminId);

            log.info("Documento {} aprobado exitosamente por admin {}", id, adminId);
            return ResponseEntity.ok(approvedDocument);

        } catch (IllegalArgumentException e) {
            log.error("Documento no encontrado: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al aprobar documento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Rechaza un documento
     */
    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Rechaza un documento")
    public ResponseEntity<DocumentDto> rejectDocument(
            @PathVariable String id,
            @Valid @RequestBody RejectDocumentRequest request) {
        
        try {
            log.info("Rechazando documento: {} con motivo: {}", id, request.getMotivo());

            if (request.getMotivo() == null || request.getMotivo().trim().isEmpty()) {
                log.error("Motivo de rechazo requerido para documento: {}", id);
                return ResponseEntity.badRequest().build();
            }

            String currentUserIdStr = securityUtils.getCurrentUserId();
            if (currentUserIdStr == null) {
                log.error("Usuario no autenticado al intentar rechazar documento");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UUID adminId = UUID.fromString(currentUserIdStr);
            DocumentDto rejectedDocument = adminDocumentService.rejectDocument(id, request.getMotivo().trim(), adminId);

            log.info("Documento {} rechazado exitosamente por admin {}", id, adminId);
            return ResponseEntity.ok(rejectedDocument);

        } catch (IllegalArgumentException e) {
            log.error("Documento no encontrado: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al rechazar documento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Agrega una anotación a un documento
     * Nota: Esta es una implementación básica. En una implementación completa,
     * se necesitaría una entidad separada para almacenar anotaciones.
     */
    @PostMapping("/{id}/anotaciones")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Agrega una anotación a un documento")
    public ResponseEntity<DocumentAnnotationResponse> addDocumentAnnotation(
            @PathVariable String id,
            @Valid @RequestBody DocumentAnnotationRequest request) {
        
        try {
            log.info("Agregando anotación al documento: {}", id);

            String currentUserIdStr = securityUtils.getCurrentUserId();
            if (currentUserIdStr == null) {
                log.error("Usuario no autenticado al intentar agregar anotación");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Por ahora, retornamos una respuesta simulada ya que no tenemos la entidad de anotaciones
            // En una implementación completa, se guardaría en base de datos
            DocumentAnnotationResponse annotation = new DocumentAnnotationResponse(
                UUID.randomUUID().toString(),
                id,
                request.getTexto(),
                request.getPosicionX(),
                request.getPosicionY(),
                currentUserIdStr,
                LocalDateTime.now()
            );

            log.info("Anotación agregada exitosamente al documento: {}", id);
            return ResponseEntity.ok(annotation);

        } catch (Exception e) {
            log.error("Error al agregar anotación al documento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * Revierte un documento a estado PENDING
     */
    @PatchMapping("/{id}/revertir")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Revierte un documento a estado PENDING")
    public ResponseEntity<DocumentDto> revertDocument(@PathVariable String id) {
        try {
            log.info("Revirtiendo documento: {}", id);

            String currentUserIdStr = securityUtils.getCurrentUserId();
            if (currentUserIdStr == null) {
                log.error("Usuario no autenticado al intentar revertir documento");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UUID adminId = UUID.fromString(currentUserIdStr);
            DocumentDto revertedDocument = adminDocumentService.revertDocument(id, adminId);

            log.info("Documento {} revertido exitosamente por admin {}", id, adminId);
            return ResponseEntity.ok(revertedDocument);

        } catch (IllegalArgumentException e) {
            log.error("Documento no encontrado: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al revertir documento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint de salud para verificar que el controlador está funcionando
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Verifica el estado del controlador de administración de documentos")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "AdminDocumentController",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
