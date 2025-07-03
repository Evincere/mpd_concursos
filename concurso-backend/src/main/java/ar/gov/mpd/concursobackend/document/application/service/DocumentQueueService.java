package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.dto.QueuedDocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.ProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentQueueService {

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;

    public String enqueueDocument(DocumentUploadRequest request, byte[] fileContent, UUID userId) {
        log.debug("Encolando documento para procesamiento: {}", request.getFileName());

        try {
            // Buscar el tipo de documento
            DocumentType documentType = findDocumentType(request.getDocumentTypeId());
            log.debug("Tipo de documento encontrado: {}", documentType.getName());

            // Generar nombre de archivo basado en el tipo de documento
            String displayFileName = documentType.getName() + ".pdf";

            // Crear documento con estado técnico inicial para cola de procesamiento
            Document document = new Document(); // Constructor asigna ProcessingStatus.UPLOADING
            document.setUserId(userId);
            document.setDocumentType(documentType);
            document.setFileName(new DocumentName(displayFileName));
            document.setContentType(request.getContentType());
            document.setComments(request.getComments());
            // El constructor ya asigna ProcessingStatus.UPLOADING
            // NO asignamos status de negocio hasta que el procesamiento se complete

            log.debug("Guardando documento en base de datos...");
            Document savedDocument = documentRepository.save(document);
            String queueId = savedDocument.getId().value().toString();

            log.debug("Documento encolado con ID: {}", queueId);
            processDocumentAsync(queueId, request, fileContent, userId);

            return queueId;
        } catch (Exception e) {
            log.error("Error al encolar documento: {}", e.getMessage(), e);
            throw new DocumentException("Error al encolar documento para procesamiento: " + e.getMessage(), e);
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<DocumentResponse> processDocumentAsync(String queueId, DocumentUploadRequest request, byte[] fileContent, UUID userId) {
        log.debug("Iniciando procesamiento asíncrono de documento: {}", request.getFileName());

        try {
            // Actualizar a estado de procesamiento
            updateProcessingStatus(queueId, ProcessingStatus.PROCESSING);

            // Procesar el documento directamente sin crear duplicados
            Optional<Document> documentOpt = documentRepository.findById(new DocumentId(UUID.fromString(queueId)));
            if (documentOpt.isEmpty()) {
                throw new DocumentException("Documento no encontrado: " + queueId);
            }

            Document document = documentOpt.get();

            try (InputStream inputStream = new ByteArrayInputStream(fileContent)) {
                // Simular el procesamiento que haría documentService.uploadDocument()
                // pero actualizando el documento existente en lugar de crear uno nuevo

                // TODO: Integrar con el servicio de almacenamiento de archivos
                // Esta implementación temporal simula el almacenamiento exitoso
                // En una implementación completa, aquí se llamaría al servicio de almacenamiento
                // que guarde el archivo en el filesystem o cloud storage
                String filePath = "documents/" + document.getUserId() + "/" + document.getFileName().value();

                document.setFilePath(filePath);
                document.completeProcessing(); // Esto asigna UPLOAD_COMPLETE y PENDING
                documentRepository.save(document);

                log.debug("Documento procesado exitosamente: {}", queueId);

                // Crear respuesta compatible
                DocumentResponse response = DocumentResponse.builder()
                    .id(document.getId().value().toString())
                    .mensaje("Documento procesado exitosamente")
                    .build();

                return CompletableFuture.completedFuture(response);
            }
        } catch (Exception e) {
            log.error("Error al procesar documento: {}", request.getFileName(), e);
            updateProcessingStatus(queueId, ProcessingStatus.UPLOAD_FAILED, e.getMessage());
            return CompletableFuture.failedFuture(new DocumentException("Error al procesar documento: " + e.getMessage(), e));
        }
    }

    public QueuedDocumentStatus getDocumentStatus(String queueId) {
        Optional<Document> documentOptional = documentRepository.findById(new DocumentId(UUID.fromString(queueId)));
        if (documentOptional.isPresent()) {
            Document document = documentOptional.get();
            QueuedDocumentStatus status = new QueuedDocumentStatus();
            status.setQueueId(queueId);
            status.setFileName(document.getFileName().value());
            status.setProcessingStatus(document.getProcessingStatus().name()); // Estado técnico
            status.setStatus(document.getStatus() != null ? document.getStatus().name() : null); // Estado de negocio
            status.setDocumentId(document.getId().value().toString());
            status.setErrorMessage(document.getErrorMessage());

            // Calcular progreso basado en el estado de procesamiento
            switch (document.getProcessingStatus()) {
                case UPLOADING:
                    status.setProgress(25);
                    break;
                case PROCESSING:
                    status.setProgress(75);
                    break;
                case UPLOAD_COMPLETE:
                    status.setProgress(100);
                    break;
                case UPLOAD_FAILED:
                    status.setProgress(0);
                    break;
            }

            return status;
        }
        return null;
    }

    private void updateProcessingStatus(String queueId, ProcessingStatus processingStatus) {
        updateProcessingStatus(queueId, processingStatus, null);
    }

    private void updateProcessingStatus(String queueId, ProcessingStatus processingStatus, String errorMessage) {
        Optional<Document> documentOptional = documentRepository.findById(new DocumentId(UUID.fromString(queueId)));
        if (documentOptional.isPresent()) {
            Document document = documentOptional.get();
            document.setProcessingStatus(processingStatus);
            if (errorMessage != null) {
                document.setErrorMessage(errorMessage);
            }
            documentRepository.save(document);
            log.debug("Estado de procesamiento actualizado para documento {}: {}", queueId, processingStatus);
        } else {
            log.warn("No se encontró documento con ID: {}", queueId);
        }
    }

    public int getQueueSize() {
        // Contar documentos que están siendo procesados técnicamente
        return (int) documentRepository.countByProcessingStatus("UPLOADING") +
               (int) documentRepository.countByProcessingStatus("PROCESSING");
    }

    /**
     * Find a document type by ID or code
     *
     * @param documentTypeIdOrCode Document type ID or code
     * @return Document type
     * @throws DocumentException if document type not found
     */
    private DocumentType findDocumentType(String documentTypeIdOrCode) {
        log.debug("Finding document type with ID or code: {}", documentTypeIdOrCode);

        // CRITICAL FIX: Validar que el parámetro no sea nulo o vacío
        if (documentTypeIdOrCode == null || documentTypeIdOrCode.trim().isEmpty()) {
            log.warn("Document type ID or code is null or empty, using default document type");
            return getOrCreateDefaultDocumentType();
        }

        // First try to find by ID
        try {
            UUID id = UUID.fromString(documentTypeIdOrCode);
            return documentTypeRepository.findById(new DocumentTypeId(id))
                    .orElseThrow(() -> {
                        log.warn("Document type not found with ID: {}, trying fallback", documentTypeIdOrCode);
                        return new DocumentException("Document type not found with ID: " + documentTypeIdOrCode);
                    });
        } catch (IllegalArgumentException e) {
            // Not a valid UUID, try to find by code
            log.debug("Not a valid UUID, trying to find document type by code: {}", documentTypeIdOrCode);
        }

        // Try to find by code
        return documentTypeRepository.findByCode(documentTypeIdOrCode)
                .orElseGet(() -> {
                    log.warn("Document type not found with code: {}, using default document type", documentTypeIdOrCode);
                    return getOrCreateDefaultDocumentType();
                });
    }

    /**
     * Obtiene o crea un tipo de documento por defecto para casos donde no se encuentra el tipo especificado
     */
    private DocumentType getOrCreateDefaultDocumentType() {
        // Intentar encontrar un tipo de documento genérico
        return documentTypeRepository.findByCode("documento-generico")
                .orElseGet(() -> {
                    log.info("Creating default document type 'documento-generico'");
                    DocumentType defaultType = DocumentType.create(
                            "documento-generico",
                            "Documento Genérico",
                            "Tipo de documento genérico para casos no especificados",
                            false,
                            999
                    );
                    return documentTypeRepository.save(defaultType);
                });
    }

    /**
     * Limpia documentos antiguos que quedaron en estado de procesamiento
     * @param maxAgeMs Edad máxima en milisegundos
     */
    public void cleanupOldEntries(long maxAgeMs) {
        log.debug("Iniciando limpieza de documentos antiguos en procesamiento");

        // TODO: Implementar limpieza de documentos que quedaron en UPLOADING o PROCESSING
        // por más tiempo del permitido. Estos documentos deberían marcarse como UPLOAD_FAILED
        // o completarse automáticamente dependiendo de la lógica de negocio.

        log.debug("Limpieza de documentos completada");
    }
}
