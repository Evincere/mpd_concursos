package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.dto.QueuedDocumentStatus;
import ar.gov.mpd.concursobackend.document.application.service.DocumentQueueService;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Controlador para la gestión de la cola de procesamiento de documentos.
 */
@RestController
@RequestMapping("/api/documentos/queue")
@RequiredArgsConstructor
@CrossOrigin(origins = "${spring.mvc.cors.allowed-origins}")
@Slf4j
public class DocumentQueueController {

    private final DocumentQueueService documentQueueService;
    private final SecurityUtils securityUtils;

    /**
     * Encola un documento para su procesamiento asíncrono.
     *
     * @param file Archivo a procesar
     * @param documentTypeId ID del tipo de documento
     * @param comments Comentarios opcionales
     * @return ID de la tarea en cola
     */
    @PostMapping("/enqueue")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<String> enqueueDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoDocumentoId") String documentTypeId,
            @RequestParam(value = "comentarios", required = false) String comments) {

        try {
            log.debug("Encolando documento para procesamiento asíncrono: {}", file.getOriginalFilename());

            // Obtener ID del usuario actual
            UUID userId = UUID.fromString(securityUtils.getCurrentUserId());

            // Crear solicitud de carga
            DocumentUploadRequest request = DocumentUploadRequest.builder()
                    .documentTypeId(documentTypeId)
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .comments(comments)
                    .build();

            // Encolar documento
            String queueId = documentQueueService.enqueueDocument(
                    request,
                    file.getBytes(),
                    userId);

            return ResponseEntity.ok(queueId);
        } catch (IOException e) {
            log.error("Error al leer el archivo", e);
            return ResponseEntity.badRequest().body("Error al leer el archivo: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error al encolar documento", e);
            return ResponseEntity.badRequest().body("Error al encolar documento: " + e.getMessage());
        }
    }

    /**
     * Encola múltiples documentos para su procesamiento asíncrono.
     *
     * @param files Archivos a procesar
     * @param documentTypeIds IDs de los tipos de documentos (en el mismo orden que los archivos)
     * @param comments Comentarios opcionales (en el mismo orden que los archivos)
     * @return Lista de IDs de las tareas en cola
     */
    @PostMapping("/enqueue-multiple")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<String>> enqueueMultipleDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("tipoDocumentoIds") String[] documentTypeIds,
            @RequestParam(value = "comentarios", required = false) String[] comments) {

        try {
            log.debug("Encolando {} documentos para procesamiento asíncrono", files.length);

            // Validar que el número de archivos y tipos de documento coincidan
            if (files.length != documentTypeIds.length) {
                return ResponseEntity.badRequest().body(List.of("El número de archivos y tipos de documento no coinciden"));
            }

            // Obtener ID del usuario actual
            UUID userId = UUID.fromString(securityUtils.getCurrentUserId());

            // Lista para almacenar los IDs de las tareas en cola
            List<String> queueIds = new ArrayList<>();

            // Procesar cada archivo
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                String documentTypeId = documentTypeIds[i];
                String comment = (comments != null && i < comments.length) ? comments[i] : null;

                // Crear solicitud de carga
                DocumentUploadRequest request = DocumentUploadRequest.builder()
                        .documentTypeId(documentTypeId)
                        .fileName(file.getOriginalFilename())
                        .contentType(file.getContentType())
                        .comments(comment)
                        .build();

                // Encolar documento
                String queueId = documentQueueService.enqueueDocument(
                        request,
                        file.getBytes(),
                        userId);

                queueIds.add(queueId);
            }

            return ResponseEntity.ok(queueIds);
        } catch (IOException e) {
            log.error("Error al leer los archivos", e);
            return ResponseEntity.badRequest().body(List.of("Error al leer los archivos: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error al encolar documentos", e);
            return ResponseEntity.badRequest().body(List.of("Error al encolar documentos: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el estado de un documento en cola.
     *
     * @param queueId ID de la tarea en cola
     * @return Estado del documento en cola
     */
    @GetMapping("/status/{queueId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<QueuedDocumentStatus> getDocumentStatus(@PathVariable("queueId") String queueId) {
        QueuedDocumentStatus status = documentQueueService.getDocumentStatus(queueId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Obtiene el estado de múltiples documentos en cola.
     *
     * @param queueIds Lista de IDs de tareas en cola
     * @return Lista de estados de documentos en cola
     */
    @PostMapping("/status-multiple")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<QueuedDocumentStatus>> getMultipleDocumentStatus(@RequestBody List<String> queueIds) {
        List<QueuedDocumentStatus> statuses = new ArrayList<>();
        for (String queueId : queueIds) {
            QueuedDocumentStatus status = documentQueueService.getDocumentStatus(queueId);
            if (status != null) {
                statuses.add(status);
            }
        }
        return ResponseEntity.ok(statuses);
    }
}
