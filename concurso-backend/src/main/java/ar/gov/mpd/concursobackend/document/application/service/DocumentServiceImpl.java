package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentSummaryDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentVersionDto;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.infrastructure.debug.VersioningDebugLogger;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentReplaceResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentReplaceRequest;
import ar.gov.mpd.concursobackend.document.domain.valueObject.ProcessingStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    // Logger específico para versioning debug
    private static final Logger versioningLog = LoggerFactory.getLogger("VERSIONING_DEBUG");

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentStorageService documentStorageService;
    private final DocumentMapper documentMapper;
    private final IUserRepository userRepository;
    private final DocumentAuditService auditService;
    private final InscriptionRepository inscriptionRepository;
    private final DocumentOperationLockService operationLockService;
    private final DocumentConcurrencyService concurrencyService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, InputStream fileContent, UUID userId) {
        return uploadDocumentWithDuplicateCheck(request, fileContent, userId, false);
    }

    /**
     * Upload document with duplicate checking and replacement option
     */
    @Transactional
    public DocumentResponse uploadDocumentWithDuplicateCheck(
            DocumentUploadRequest request,
            InputStream fileContent,
            UUID userId,
            boolean replaceExisting) {

        log.debug("Uploading document for user: {} with replaceExisting: {}", userId, replaceExisting);

        DocumentType documentType = findDocumentType(request.getDocumentTypeId());

        // Crear nuevo documento
        String displayFileName = documentType.getName() + ".pdf";
        Document newDocument = Document.create(
                userId,
                documentType,
                new DocumentName(displayFileName),
                request.getContentType(),
                null,
                request.getComments()
        );

        // CRITICAL FIX: Guardar archivo ANTES del save para consistencia con reemplazo
        String userDni = userRepository.findById(userId)
                .map(user -> user.getDni().value())
                .orElseThrow(() -> new DocumentException("Usuario no encontrado: " + userId));

        String filePath = documentStorageService.storeFile(fileContent, request.getFileName(), userId,
                newDocument.getId().value(), userDni, documentType.getName());

        newDocument.setFilePath(filePath);
        newDocument.setStatus(DocumentStatus.PENDING);

        versioningLog.error("💾 [UPLOAD] BEFORE_SAVE_WITH_FILEPATH | ID: {} | FilePath: {}",
            newDocument.getId().value(), filePath);

        Document savedDocument = documentRepository.save(newDocument);
        auditService.recordCreation(savedDocument, userId);

        return DocumentResponse.builder()
                .id(savedDocument.getId().value().toString())
                .mensaje("Document upload started")
                .documento(documentMapper.toDto(savedDocument))
                .build();
    }

    @Override
    @Transactional
    public DocumentReplaceResponse replaceDocument(String documentId, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException {
        final DocumentId docId = new DocumentId(UUID.fromString(documentId));

        log.info("🔄 [DocumentService] Iniciando reemplazo de documento: {} por usuario: {}", documentId, userId);

        // CRÍTICO: Adquirir lock para prevenir operaciones concurrentes
        if (!operationLockService.tryAcquireLock(userId, docId.value(), "REPLACE")) {
            log.warn("⚠️ [DocumentService] Operación de reemplazo ya en progreso para documento: {}", documentId);
            throw new DocumentException("Ya hay una operación de reemplazo en progreso para este documento. Por favor, espere a que termine.");
        }

        try {
            // CRITICAL FIX: Usar bloqueo pesimista y pasar el documento bloqueado a la operación
            return concurrencyService.executeWithPessimisticLock(docId, (lockedDocument) -> {
                try {
                    return performDocumentReplacement(lockedDocument, request, inputStream, userId);
                } catch (IOException e) {
                    throw new RuntimeException("Error de E/S durante reemplazo de documento", e);
                }
            }, "DOCUMENT_REPLACE_PESSIMISTIC");

        } finally {
            // CRÍTICO: Siempre liberar el lock
            operationLockService.releaseLock(userId, docId.value(), "REPLACE");
            log.debug("🔓 [DocumentService] Lock liberado para documento: {}", documentId);
        }
    }

    /**
     * Realiza el reemplazo efectivo del documento.
     * Este método es llamado dentro del contexto de manejo de concurrencia.
     * @param lockedDocument El documento ya bloqueado por la transacción.
     */
    private DocumentReplaceResponse performDocumentReplacement(Document lockedDocument, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException {
        log.debug("📋 [DocumentService] Ejecutando reemplazo efectivo para documento: {}", lockedDocument.getId().value());

        // CRITICAL FIX: No recargar. Usar la entidad ya bloqueada y cargada.
        // Document current = concurrencyService.reloadDocumentSafely(docId);
        final Document current = lockedDocument;

        if (!current.getUserId().equals(userId) || current.isArchived()) {
            throw new DocumentException("Document does not belong to user or is archived");
        }

        // 2. Detectar inscripciones activas que referencian este documento
        final Document currentDocument = current;
        List<Inscription> impactedInscriptions = inscriptionRepository.findByUserId(userId).stream()
                .filter(insc -> insc.getDocuments().stream().anyMatch(doc -> doc.getId().equals(currentDocument.getId())))
                .filter(insc -> insc.getState() == InscriptionState.ACTIVE || insc.getState() == InscriptionState.PENDING)
                .toList();
        List<String> impactedEntities = impactedInscriptions.stream()
                .map(insc -> String.format("Inscripción en concurso '%s' (estado: %s)",
                        insc.getContest() != null ? insc.getContest().getTitle() : "-",
                        insc.getState().name()))
                .toList();

        // 3. Si el documento está validado y no se fuerza el reemplazo, advertir y abortar
        if (current.getStatus() == DocumentStatus.APPROVED && !request.isForceReplace()) {
            log.info("⚠️ [DocumentService] Documento validado requiere confirmación para reemplazo: {}", current.getId().value());
            return DocumentReplaceResponse.builder()
                    .newDocument(null)
                    .previousDocument(documentMapper.toDto(current))
                    .warning("El documento está validado y será reemplazado. Esto puede afectar inscripciones activas.")
                    .message("Debe confirmar el reemplazo. Consulte el detalle de impacto.")
                    .impactedEntities(impactedEntities)
                    .build();
        }

        // 4. Archivar documento actual
        log.debug("📦 [DocumentService] Archivando documento actual: {}", current.getId().value());
        current.archive(current.getId(), userId);

        // CRITICAL FIX: Con locks pesimistas, usar flush() en lugar de save() para evitar conflictos de versioning
        entityManager.flush();

        // 5. Crear nuevo documento (versión activa)
        versioningLog.error("═══════════════════════════════════════════════════════════════");
        versioningLog.error("🎯 [SERVICE] INICIANDO OPERACIÓN: CREAR DOCUMENTO DE REEMPLAZO");
        versioningLog.error("═══════════════════════════════════════════════════════════════");

        log.debug("📄 [DocumentService] Creando nuevo documento para reemplazar: {}", current.getId().value());
        DocumentType documentType = current.getDocumentType();
        String displayFileName = documentType.getName() + ".pdf";

        Document newDoc = Document.create(
                userId,
                documentType,
                new DocumentName(displayFileName),
                request.getContentType(),
                null,
                request.getComments()
        );

        versioningLog.error("🆕 [SERVICE] DOC_CREATE   | ID: {} | Operation: REPLACEMENT_DOCUMENT | Replacing: {}",
            newDoc.getId().value(), current.getId().value());

        newDoc.setReplacedDocumentId(current.getId());
        newDoc.setStatus(DocumentStatus.PENDING);
        newDoc.setProcessingStatus(ProcessingStatus.UPLOAD_COMPLETE);

        // Obtener DNI del usuario para el almacenamiento
        String userDni = userRepository.findById(userId)
                .map(user -> user.getDni().value())
                .orElseThrow(() -> new DocumentException("Usuario no encontrado: " + userId));

        // Guardar archivo
        String filePath = documentStorageService.storeFile(inputStream, request.getFileName(), userId, newDoc.getId().value(), userDni, documentType.getName());
        newDoc.setFilePath(filePath);

        // LOGGING CRÍTICO: Antes del save
        versioningLog.error("💾 [SERVICE] BEFORE_SAVE  | ID: {} | File: {}",
            newDoc.getId().value(), newDoc.getFileName().value());

        Document savedDoc = documentRepository.save(newDoc);

        // LOGGING CRÍTICO: Después del save
        versioningLog.error("💾 [SERVICE] AFTER_SAVE   | ID: {} | File: {}",
            savedDoc.getId().value(), savedDoc.getFileName().value());

        versioningLog.error("═══════════════════════════════════════════════════════════════");
        versioningLog.error("🏁 [SERVICE] FINALIZANDO OPERACIÓN: CREAR DOCUMENTO DE REEMPLAZO");
        versioningLog.error("═══════════════════════════════════════════════════════════════");

        log.info("✅ [DocumentService] Documento reemplazado exitosamente - Anterior: {}, Nuevo: {}",
                current.getId().value(), savedDoc.getId().value());

        // 6. Armar respuesta
        String warning = current.getStatus() == DocumentStatus.APPROVED ?
                "El documento validado fue reemplazado. Las inscripciones activas pueden requerir nueva validación." : null;
        String message = "Documento reemplazado exitosamente.";
        return DocumentReplaceResponse.builder()
                .newDocument(documentMapper.toDto(newDoc))
                .previousDocument(documentMapper.toDto(current))
                .warning(warning)
                .message(message)
                .impactedEntities(impactedEntities)
                .build();
    }

    @Async
    public void storeFileAsync(InputStream fileContent, String originalFilename, UUID userId, UUID documentId, String documentTypeName) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new DocumentException("User not found"));
            String userDni = user.getDni().value();

            String filePath = documentStorageService.storeFile(fileContent, originalFilename, userId, documentId, userDni, documentTypeName);

            Document document = documentRepository.findById(new DocumentId(documentId))
                    .orElseThrow(() -> new DocumentException("Document not found"));

            document.setFilePath(filePath);
            document.setStatus(DocumentStatus.PENDING);

            versioningLog.error("💾 [ASYNC] UPDATING_FILEPATH | ID: {} | FilePath: {} | Status: PENDING",
                documentId, filePath);

            try {
                documentRepository.save(document);
            } catch (ObjectOptimisticLockingFailureException e) {
                log.warn("Document update failed due to optimistic locking conflict during file storage: {}", e.getMessage());
                // Recargar el documento y reintentar
                Document reloadedDocument = documentRepository.findById(new DocumentId(documentId))
                        .orElseThrow(() -> new DocumentException("Document not found"));
                reloadedDocument.setFilePath(filePath);
                reloadedDocument.setStatus(DocumentStatus.PENDING);
                documentRepository.save(reloadedDocument);
            }
        } catch (DocumentException e) {
            log.error("Error storing file asynchronously", e);
            updateDocumentStatusSafely(documentId, DocumentStatus.ERROR);
        } catch (Exception e) {
            log.error("Unexpected error storing file asynchronously", e);
            updateDocumentStatusSafely(documentId, DocumentStatus.ERROR);
        }
    }

    /**
     * Actualiza el estado de un documento de manera segura, manejando errores de concurrencia
     */
    private void updateDocumentStatusSafely(UUID documentId, DocumentStatus status) {
        try {
            Document document = documentRepository.findById(new DocumentId(documentId))
                    .orElseThrow(() -> new DocumentException("Document not found"));
            document.setStatus(status);
            documentRepository.save(document);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.warn("Failed to update document status due to optimistic locking conflict: {}", e.getMessage());
            // Reintentar una vez más
            try {
                Document reloadedDocument = documentRepository.findById(new DocumentId(documentId))
                        .orElseThrow(() -> new DocumentException("Document not found"));
                reloadedDocument.setStatus(status);
                documentRepository.save(reloadedDocument);
            } catch (Exception retryException) {
                log.error("Failed to update document status after retry: {}", retryException.getMessage());
            }
        } catch (Exception e) {
            log.error("Unexpected error updating document status: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto> getUserDocuments(UUID userId) {
        log.debug("🔍 [DocumentService] Getting documents for user: {}", userId);

        List<Document> documents = documentRepository.findByUserId(userId);
        log.debug("📊 [DocumentService] Documents found in repository: {}", documents.size());

        if (!documents.isEmpty()) {
            log.debug("📄 [DocumentService] First document: {}", documents.get(0));
        }

        List<DocumentDto> documentDtos = documentMapper.toDtoList(documents);
        log.debug("✅ [DocumentService] Documents mapped to DTOs: {}", documentDtos.size());

        return documentDtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentSummaryDto> getUserDocumentsSummary(UUID userId) {
        log.debug("🔍 [DocumentService] Getting documents summary for user: {}", userId);

        List<Document> allDocuments = documentRepository.findByUserId(userId);
        log.debug("📊 [DocumentService] Total documents found: {}", allDocuments.size());

        // Agrupar documentos por tipo
        Map<UUID, List<Document>> documentsByType = allDocuments.stream()
                .collect(Collectors.groupingBy(doc -> doc.getDocumentType().getId().value()));

        List<DocumentSummaryDto> summaries = new ArrayList<>();

        for (Map.Entry<UUID, List<Document>> entry : documentsByType.entrySet()) {
            List<Document> documentsOfType = entry.getValue();

            // Ordenar por fecha de carga (más reciente primero)
            documentsOfType.sort(Comparator.comparing(Document::getUploadDate).reversed());

            Document mostRecent = documentsOfType.get(0);
            List<Document> previousVersions = documentsOfType.subList(1, documentsOfType.size());

            // Crear DTO del documento más reciente
            DocumentDto mostRecentDto = documentMapper.toDto(mostRecent);

            // Crear DTOs de versiones anteriores
            List<DocumentVersionDto> versionDtos = previousVersions.stream()
                    .map(this::createVersionDto)
                    .collect(Collectors.toList());

            // Crear el summary
            DocumentSummaryDto summary = DocumentSummaryDto.builder()
                    .id(mostRecentDto.getId())
                    .tipoDocumentoId(mostRecentDto.getTipoDocumentoId())
                    .tipoDocumento(mostRecentDto.getTipoDocumento())
                    .nombreArchivo(mostRecentDto.getNombreArchivo())
                    .contentType(mostRecentDto.getContentType())
                    .estado(mostRecentDto.getEstado())
                    .comentarios(mostRecentDto.getComentarios())
                    .fechaCarga(mostRecentDto.getFechaCarga())
                    .validadoPor(mostRecentDto.getValidadoPor())
                    .fechaValidacion(mostRecentDto.getFechaValidacion())
                    .motivoRechazo(mostRecentDto.getMotivoRechazo())
                    .totalVersiones(documentsOfType.size())
                    .versionActual(1) // El más reciente es siempre versión 1
                    .tieneVersionesAnteriores(!previousVersions.isEmpty())
                    .versionesAnteriores(versionDtos)
                    .esDocumentoActivo(true)
                    .estadoDetallado(determineDetailedStatus(mostRecent))
                    .build();

            summaries.add(summary);
        }

        // Ordenar por nombre del tipo de documento
        summaries.sort(Comparator.comparing(s -> s.getTipoDocumento().getNombre()));

        log.debug("✅ [DocumentService] Document summaries created: {}", summaries.size());
        return summaries;
    }

    private DocumentVersionDto createVersionDto(Document document) {
        return DocumentVersionDto.builder()
                .id(document.getId().value().toString())
                .nombreArchivo(document.getFileName().value())
                .estado(document.getStatus().name())
                .fechaCarga(document.getUploadDate())
                .comentarios(document.getComments())
                .numeroVersion(0) // Se calculará después si es necesario
                .esArchivado(document.isArchived())
                .fechaArchivado(document.getArchivedAt())
                .archivedBy(document.getArchivedBy() != null ? document.getArchivedBy().toString() : null)
                .build();
    }

    private String determineDetailedStatus(Document document) {
        if (document.isArchived()) {
            return "Archivado";
        }

        switch (document.getStatus()) {
            case PENDING:
                return "En revisión";
            case APPROVED:
                return "Aprobado";
            case REJECTED:
                return "Rechazado";
            default:
                return "Activo";
        }
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

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocumentMetadata(String documentId, UUID userId) {
        log.debug("Getting document metadata: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        return documentMapper.toDto(document);
    }

    @Override
    @Transactional(readOnly = true)
    public InputStream getDocumentFile(String documentId, UUID userId) throws IOException {
        log.debug("Getting document file: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        return documentStorageService.getFile(document.getFilePath());
    }

    @Override
    @Transactional
    public DocumentResponse updateDocument(String documentId, DocumentUploadRequest request, InputStream inputStream, UUID userId) throws IOException {
        log.debug("Updating document: {} for user: {}", documentId, userId);

        // Find existing document
        Document existingDocument = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!existingDocument.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        // Delete old file from storage
        try {
            documentStorageService.deleteFile(existingDocument.getFilePath());
        } catch (Exception e) {
            log.warn("Could not delete old file from storage: {}", existingDocument.getFilePath(), e);
        }

        // Get user DNI for storage organization
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DocumentException("User not found"));
        String userDni = user.getDni().value();

        // Use existing document type if not provided in request
        DocumentType documentType = existingDocument.getDocumentType();
        if (request.getDocumentTypeId() != null && !request.getDocumentTypeId().isEmpty()) {
            documentType = findDocumentType(request.getDocumentTypeId());
        }

        // Generate display filename based on document type
        String displayFileName = documentType.getName() + ".pdf";

        // Store the new file
        String newFilePath = documentStorageService.storeFile(inputStream, request.getFileName(), userId,
                existingDocument.getId().value(), userDni, documentType.getName());

        // Update document metadata
        existingDocument.setFileName(new DocumentName(displayFileName));
        existingDocument.setContentType(request.getContentType());
        existingDocument.setFilePath(newFilePath);
        if (request.getComments() != null) {
            existingDocument.setComments(request.getComments());
        }

        // Save updated document
        Document updatedDocument = documentRepository.save(existingDocument);
        log.debug("Document updated: {}", updatedDocument);

        return DocumentResponse.builder()
                .id(updatedDocument.getId().value().toString())
                .mensaje("Document updated successfully")
                .documento(documentMapper.toDto(updatedDocument))
                .build();
    }

    @Override
    @Transactional
    public void deleteDocument(String documentId, UUID userId) {
        log.debug("Deleting document: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        // Delete the file
        documentStorageService.deleteFile(document.getFilePath());

        // Delete the document metadata
        documentRepository.deleteById(document.getId());
    }

    @Override
    @Transactional
    public DocumentDto updateDocumentStatus(String documentId, String status) {
        log.debug("Updating document status: {} to: {}", documentId, status);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        document.setStatus(DocumentStatus.valueOf(status.toUpperCase()));
        Document updatedDocument = documentRepository.save(document);

        return documentMapper.toDto(updatedDocument);
    }

    @Override
    @Transactional
    public String saveDocument(InputStream inputStream, String filename, UUID documentId, UUID userId) throws IOException {
        log.debug("=== INICIO saveDocument ===");
        log.info("Guardando documento con id: {} para usuario: {}", documentId, userId);
        log.info("Nombre del archivo: {}", filename);

        try {
            // Verificar que el input stream no sea nulo
            if (inputStream == null) {
                log.error("ERROR CRÍTICO: El InputStream proporcionado es NULL");
                throw new DocumentException("El InputStream es nulo, no se puede procesar el documento");
            }

            int bytesDisponibles;
            try {
                bytesDisponibles = inputStream.available();
                log.info("InputStream disponible: {} bytes", bytesDisponibles);
                if (bytesDisponibles == 0) {
                    log.warn("ADVERTENCIA: El InputStream está vacío (0 bytes disponibles)");
                }
            } catch (IOException e) {
                log.error("Error al verificar disponibilidad del InputStream: {}", e.getMessage(), e);
                throw new DocumentException("Error al leer el InputStream", e);
            }

            // Obtener el tipo de documento para certificados laborales
            DocumentType documentType;
            try {
                log.debug("Buscando tipo de documento 'certificado-laboral'");
                documentType = findDocumentType("certificado-laboral");
                log.debug("Tipo de documento encontrado: {}", documentType);
            } catch (DocumentException e) {
                log.warn("Tipo de documento 'certificado-laboral' no encontrado, creando uno nuevo");
                // Crear un nuevo tipo de documento
                DocumentType newType = DocumentType.create(
                        "certificado-laboral",
                        "Certificado Laboral",
                        "Certificado de experiencia laboral",
                        false,
                        1);
                documentType = documentTypeRepository.save(newType);
                log.debug("Tipo de documento creado: {}", documentType);
            }

            // Create document entity
            log.debug("Creando entidad Document");
            // Generar nombre de archivo basado en el tipo de documento
            String displayFileName = documentType.getName() + ".pdf";

            Document document = Document.create(
                    userId,
                    documentType,
                    new DocumentName(displayFileName),
                    "application/pdf", // Assuming PDF for work experience certificates
                    null,
                    "Certificado de experiencia laboral");

            // IMPORTANTE: Asegurarse de que el ID del documento sea correcto
            if (documentId != null) {
                log.debug("Estableciendo ID personalizado para el documento: {}", documentId);
                document.setId(new DocumentId(documentId));
            }

            log.info("ID del documento que se va a guardar: {}", document.getId().value());

            // Store the file
            log.info("Almacenando el archivo físico con documentStorageService.storeFile");
            String filePath;
            try {
                // Crear una copia del stream en memoria para evitar problemas de streaming
                byte[] fileBytes;
                try {
                    // Leer todo el contenido del stream en un array de bytes
                    fileBytes = inputStream.readAllBytes();
                    log.info("Contenido leído del InputStream: {} bytes", fileBytes.length);

                    if (fileBytes.length == 0) {
                        log.error("ERROR: El archivo está vacío (0 bytes)");
                        throw new DocumentException("El archivo está vacío (0 bytes)");
                    }
                } catch (IOException e) {
                    log.error("Error al leer bytes del InputStream: {}", e.getMessage(), e);
                    throw new DocumentException("No se pudo leer el contenido del archivo", e);
                }

                // Get user DNI for storage organization
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new DocumentException("User not found"));
                String userDni = user.getDni().value();
                String documentTypeName = documentType.getName();

                // Usar un nuevo InputStream a partir de los bytes copiados
                try (InputStream copiedStream = new java.io.ByteArrayInputStream(fileBytes)) {
                    // AHORA SI guardamos en el disco
                    filePath = documentStorageService.storeFile(copiedStream, filename, userId,
                            document.getId().value(), userDni, documentTypeName);

                    if (filePath == null || filePath.isEmpty()) {
                        log.error("ERROR: La ruta del archivo retornada por storeFile es nula o vacía");
                        throw new DocumentException("Error al guardar el archivo: ruta vacía");
                    }

                    log.info("Archivo almacenado correctamente en: {}", filePath);

                    // Verificar que el archivo realmente existe en el disco
                    Path storagePath = Paths.get(filePath);
                    if (!Files.exists(storagePath)) {
                        log.error("ERROR: El archivo no existe en la ruta especificada: {}", storagePath);
                    } else {
                        log.info("VERIFICADO: El archivo existe en disco: {}, tamaño: {} bytes",
                                storagePath, Files.size(storagePath));
                    }
                }
            } catch (Exception e) {
                log.error("Error al almacenar el archivo: {}", e.getMessage(), e);
                throw new DocumentException("No se pudo almacenar el archivo físico: " + e.getMessage(), e);
            }

            // Actualizar la entidad con la ruta del archivo
            document.setFilePath(filePath);
            log.debug("FilePath asignado a la entidad Document: {}", filePath);

            // Save document metadata
            log.debug("Guardando metadatos del documento en la base de datos");
            Document savedDocument;
            try {
                savedDocument = documentRepository.save(document);
                log.info("Documento guardado con éxito: {}", savedDocument);
                if (savedDocument == null) {
                    log.error("ERROR: El documento guardado es NULL");
                    throw new DocumentException("Error al guardar el documento: resultado nulo");
                }
            } catch (Exception e) {
                log.error("Error al guardar metadatos del documento: {}", e.getMessage(), e);
                throw new DocumentException("No se pudieron guardar los metadatos del documento: " + e.getMessage(), e);
            }

            // Return the document URL for reference
            String documentUrl = "/api/documentos/" + savedDocument.getId().value() + "/file";
            log.info("URL del documento generada: {}", documentUrl);
            log.info("=== FIN saveDocument (ÉXITO) ===");
            return documentUrl;
        } catch (Exception e) {
            log.error("Error durante el proceso de guardar documento: {}", e.getMessage(), e);
            log.info("=== FIN saveDocument (ERROR) ===");
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentReplaceResponse checkReplaceDocument(String documentId, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException {
        final DocumentId docId = new DocumentId(UUID.fromString(documentId));
        log.info("🔍 [DocumentService] Verificando reemplazo de documento: {} por usuario: {}", documentId, userId);

        final Document current = documentRepository.findById(docId)
                .orElseThrow(() -> new DocumentException("Document not found"));

        if (!current.getUserId().equals(userId) || current.isArchived()) {
            throw new DocumentException("Document does not belong to user or is archived");
        }

        List<Inscription> impactedInscriptions = inscriptionRepository.findByUserId(userId).stream()
                .filter(insc -> insc.getDocuments().stream().anyMatch(doc -> doc.getId().equals(current.getId())))
                .filter(insc -> insc.getState() == InscriptionState.ACTIVE || insc.getState() == InscriptionState.PENDING)
                .toList();
        List<String> impactedEntities = impactedInscriptions.stream()
                .map(insc -> String.format("Inscripción en concurso '%s' (estado: %s)",
                        insc.getContest() != null ? insc.getContest().getTitle() : "-",
                        insc.getState().name()))
                .toList();

        if (current.getStatus() == DocumentStatus.APPROVED) {
            log.info("⚠️ [DocumentService] Documento validado requiere confirmación para reemplazo: {}", current.getId().value());
            return DocumentReplaceResponse.builder()
                    .newDocument(null)
                    .previousDocument(documentMapper.toDto(current))
                    .warning("El documento está validado y será reemplazado. Esto puede afectar inscripciones activas.")
                    .message("Debe confirmar el reemplazo. Consulte el detalle de impacto.")
                    .impactedEntities(impactedEntities)
                    .build();
        }

        return DocumentReplaceResponse.builder()
                .newDocument(null)
                .previousDocument(documentMapper.toDto(current))
                .warning(null)
                .message("El documento puede ser reemplazado sin advertencias.")
                .impactedEntities(Collections.emptyList())
                .build();
    }
}