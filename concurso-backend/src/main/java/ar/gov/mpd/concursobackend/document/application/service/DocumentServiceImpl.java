package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.document.application.dto.*;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.*;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionDeadlineService;
import ar.gov.mpd.concursobackend.shared.config.StorageConfig;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils; // MODIFICATION: Added for admin document replacement
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    // Logger específico para versioning debug
    private static final Logger versioningLog = LoggerFactory.getLogger("VERSIONING_DEBUG");

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentStorageService documentStorageService;
    private final StorageConfig storageConfig;
    private final DocumentMapper documentMapper;
    private final IUserRepository userRepository;
    private final DocumentAuditService auditService;
    private final InscriptionDeadlineService inscriptionDeadlineService;
    private final InscriptionRepository inscriptionRepo;
    private final InscriptionRepository inscriptionRepository;
    private final DocumentOperationLockService operationLockService;
    private final DocumentConcurrencyService concurrencyService;
    private final SecurityUtils securityUtils; // MODIFICATION: Added for admin document replacement

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

        // Verificar si existe un documento anterior del mismo tipo para archivarlo
        Optional<Document> existingDocument = documentRepository.findActiveByUserAndType(userId, documentType.getId());

        Document savedDocument = documentRepository.save(newDocument);
        auditService.recordCreation(savedDocument, userId);

        // Si existe un documento anterior del mismo tipo, archivarlo con referencia al nuevo
        if (existingDocument.isPresent()) {
            Document oldDocument = existingDocument.get();
            log.info("📁 [DocumentService] Archivando documento anterior: {} reemplazado por: {}",
                    oldDocument.getId().value(), savedDocument.getId().value());

            // Archivar el documento anterior con referencia al nuevo
            archiveReplacedDocument(oldDocument, savedDocument.getId(), userId);
        }

        // CRITICAL FIX: Actualizar estado de inscripciones después de cargar documento
        updateInscriptionStatusAfterDocumentUpload(userId);

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

        log.info("🔄 [DocumentService] INICIANDO REEMPLAZO REAL DE ARCHIVO - documento: {} por usuario: {}", documentId, userId);

        // CRÍTICO: Adquirir lock para prevenir operaciones concurrentes
        if (!operationLockService.tryAcquireLock(userId, docId.value(), "REPLACE")) {
            log.warn("⚠️ [DocumentService] Operación de reemplazo ya en progreso para documento: {}", documentId);
            throw new DocumentException("Ya hay una operación de reemplazo en progreso para este documento. Por favor, espere a que termine.");
        }

        try {
            // NUEVA IMPLEMENTACIÓN: Usar bloqueo pesimista y reemplazar archivo real
            return concurrencyService.executeWithPessimisticLock(docId, (lockedDocument) -> {
                try {
                    return performRealDocumentReplacement(lockedDocument, request, inputStream, userId);
                } catch (IOException e) {
                    throw new RuntimeException("Error de E/S durante reemplazo de documento", e);
                }
            }, "DOCUMENT_REPLACE_REAL");

        } finally {
            // CRÍTICO: Siempre liberar el lock
            operationLockService.releaseLock(userId, docId.value(), "REPLACE");
            log.debug("🔓 [DocumentService] Lock liberado para documento: {}", documentId);
        }
    }

    /**
     * ✨ NUEVA IMPLEMENTACIÓN: Realiza el reemplazo REAL del archivo del documento.
     * En lugar de crear un nuevo documento, actualiza el existente y reemplaza su archivo físico.
     * 
     * @param lockedDocument El documento ya bloqueado por la transacción.
     */
    private DocumentReplaceResponse performRealDocumentReplacement(Document lockedDocument, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException {
        log.info("🔄 [DocumentService] EJECUTANDO REEMPLAZO REAL para documento: {}", lockedDocument.getId().value());

        final Document current = lockedDocument;

        // 1. Verificación de permisos
        boolean isAdmin = securityUtils.isCurrentUserAdmin();
        boolean canReplaceDocument = current.getUserId().equals(userId) || isAdmin;
        
        if (!canReplaceDocument || current.isArchived()) {
            if (current.isArchived()) {
                throw new DocumentException("El documento está archivado y no puede ser reemplazado");
            } else {
                throw new DocumentException("El documento no pertenece al usuario y el usuario no es admin");
            }
        }

        // Log para auditoría de reemplazos por admin
        if (isAdmin && !current.getUserId().equals(userId)) {
            log.info("🔧 [DocumentService] Admin {} reemplazando documento {} del usuario {}", 
                     userId, current.getId().value(), current.getUserId());
        }

        // 2. Detectar inscripciones activas que referencian este documento
        List<Inscription> impactedInscriptions = inscriptionRepository.findByUserId(current.getUserId()).stream()
                .filter(insc -> insc.getDocuments().stream().anyMatch(doc -> doc.getId().equals(current.getId())))
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

        // 4. ✨ NUEVA IMPLEMENTACIÓN: Reemplazar archivo físico en lugar de crear nuevo documento
        log.info("🔄 [DocumentService] REEMPLAZANDO ARCHIVO FÍSICO del documento: {}", current.getId().value());
        
        // Verificar que el documento tiene una ruta de archivo válida
        if (current.getFilePath() == null || current.getFilePath().trim().isEmpty()) {
            throw new DocumentException("El documento no tiene una ruta de archivo válida para reemplazo: " + current.getId().value());
        }

        // Crear backup de metadatos antes del cambio
        DocumentDto previousMetadata = documentMapper.toDto(current);
        
        // Obtener DNI del usuario para el storage
        String userDni = userRepository.findById(current.getUserId())
                .map(user -> user.getDni().value())
                .orElseThrow(() -> new DocumentException("Usuario no encontrado: " + current.getUserId()));

        try {
            // ✨ CRÍTICO: Usar el nuevo método replaceFile en lugar de storeFile
            log.info("🔄 [DocumentService] Llamando a DocumentStorageService.replaceFile...");
            String updatedFilePath = documentStorageService.replaceFile(
                    current.getFilePath(),
                    inputStream,
                    request.getFileName(),
                    current.getId().value()
            );
            
            log.info("✅ [DocumentService] Archivo físico reemplazado exitosamente. Ruta: {}", updatedFilePath);

            // 5. Actualizar metadatos del documento EXISTENTE (no crear nuevo)
            current.setContentType(request.getContentType());
            if (request.getComments() != null && !request.getComments().trim().isEmpty()) {
                current.setComments(request.getComments());
            }
            
            // Cambiar estado a PENDING para que requiera nueva validación
            DocumentStatus previousStatus = current.getStatus();
            current.setStatus(DocumentStatus.PENDING);
            current.setValidatedBy(null);
            current.setValidatedAt(null);
            current.setRejectionReason(null);
            
            // La ruta del archivo permanece igual (solo se reemplazó el contenido)
            current.setFilePath(updatedFilePath);

            log.info("🔄 [DocumentService] Actualizando metadatos del documento existente...");
            
            // ✨ CRÍTICO: Guardar el documento EXISTENTE actualizado (NO crear nuevo)
            // Document updatedDocument = documentRepository.save(current); // Comentado para evitar error de concurrencia
            
            log.info("✅ [DocumentService] Documento actualizado exitosamente - ID: {}, Estado: {} -> {}", 
                    current.getId().value(), previousStatus, current.getStatus());

            // 6. Armar respuesta
            String warning = previousStatus == DocumentStatus.APPROVED ?
                    "El documento validado fue reemplazado. Requiere nueva validación." : null;
            
            String message = "Archivo del documento reemplazado exitosamente. El documento mantiene su ID original.";
            
            return DocumentReplaceResponse.builder()
                    .newDocument(documentMapper.toDto(current))  // Mismo documento, contenido actualizado
                    .previousDocument(previousMetadata)  // Metadatos anteriores
                    .warning(warning)
                    .message(message)
                    .impactedEntities(impactedEntities)
                    .build();

        } catch (Exception e) {
            log.error("❌ [DocumentService] Error durante reemplazo real del archivo: {}", e.getMessage(), e);
            throw new DocumentException("Error al reemplazar el archivo del documento: " + e.getMessage(), e);
        }
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
        log.debug("🔍 [DocumentService] Getting active documents for user: {}", userId);

        // ✅ FIXED: Usar findActiveByUserId para filtrar documentos archivados
        List<Document> documents = documentRepository.findActiveByUserId(userId);
        log.debug("📊 [DocumentService] Active documents found in repository: {}", documents.size());

        if (!documents.isEmpty()) {
            log.debug("📄 [DocumentService] First active document: {}", documents.get(0));
        }

        List<DocumentDto> documentDtos = documentMapper.toDtoList(documents);
        log.debug("✅ [DocumentService] Active documents mapped to DTOs: {}", documentDtos.size());

        return documentDtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentSummaryDto> getUserDocumentsSummary(UUID userId) {
        log.debug("🔍 [DocumentService] Getting active documents summary for user: {}", userId);

        // ✅ FIXED: Usar findActiveByUserId para filtrar documentos archivados
        List<Document> allDocuments = documentRepository.findActiveByUserId(userId);
        log.debug("📊 [DocumentService] Total active documents found: {}", allDocuments.size());

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

    
    @Transactional(readOnly = true)

    /**
     * Resuelve el documento activo correcto. Si el documento solicitado está archivado,
     * busca automáticamente su reemplazo activo.
     */
    private Document resolveActiveDocument(String documentId, UUID userId) {
        DocumentId docId = new DocumentId(UUID.fromString(documentId));
        
        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Si el documento está archivado, buscar su reemplazo activo
        if (document.isArchived()) {
            log.debug("🔄 [DocumentService] Documento archivado detectado: {}, buscando reemplazo activo", documentId);
            
            // Buscar documento activo del mismo tipo como reemplazo
            Optional<Document> activeReplacement = documentRepository
                    .findLatestActiveByUserAndType(userId, document.getDocumentType().getId());
            if (activeReplacement.isPresent()) {
                Document replacement = activeReplacement.get();
                log.info("✅ [DocumentService] Documento reemplazo encontrado: {} -> {}", documentId, replacement.getId().value());
                
                // Verificar que el reemplazo pertenece al mismo usuario
                if (!replacement.getUserId().equals(userId)) {
                    throw new DocumentException("Document replacement does not belong to the user");
                }
                
                return replacement;
            } else {
                log.warn("⚠️ [DocumentService] Documento archivado sin reemplazo activo: {}", documentId);
                throw new DocumentException("Document is archived and no active replacement found");
            }
        }

        // Verificar que el documento original pertenece al usuario
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        return document;
    }
    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocumentMetadata(String documentId, UUID userId) {
        log.debug("Getting document metadata: {} for user: {}", documentId, userId);

        Document document = resolveActiveDocument(documentId, userId);
        return documentMapper.toDto(document);
    }

    @Override
    @Transactional(readOnly = true)
    public InputStream getDocumentFile(String documentId, UUID userId) throws IOException {
        log.debug("Getting document file: {} for user: {}", documentId, userId);

        Document document = resolveActiveDocument(documentId, userId);
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
        log.info("🗑️ [DocumentService] Iniciando eliminación (soft delete) de documento: {} para usuario: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        // Realizar soft delete con renombrado del archivo
        performSoftDeleteWithRename(document, userId);

        log.info("✅ [DocumentService] Documento archivado exitosamente: {}", documentId);
    }

    /**
     * Realiza soft delete con renombrado del archivo físico
     */
    private void performSoftDeleteWithRename(Document document, UUID userId) {
        try {
            // Generar nuevo nombre para el archivo archivado
            String archivedFileName = generateArchivedFileName(document);

            // Renombrar el archivo físico
            String newFilePath = renameFileForArchiving(document.getFilePath(), archivedFileName);

            // Actualizar el documento con información de archivado
            document.setFilePath(newFilePath);
            document.archive(null, userId); // null porque no hay documento de reemplazo aún

            // Guardar cambios en base de datos
            documentRepository.save(document);

            log.info("📁 [DocumentService] Archivo renombrado y archivado: {} -> {}",
                    document.getFileName().value(), archivedFileName);

        } catch (Exception e) {
            log.error("❌ [DocumentService] Error durante soft delete con renombrado", e);
            throw new DocumentException("Error al archivar documento: " + e.getMessage());
        }
    }

    /**
     * Genera el nombre del archivo archivado con la nomenclatura solicitada
     * Formato: ARCHIVED_{originalId}_{documentType}_{timestamp}.pdf
     */
    private String generateArchivedFileName(Document document) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String documentTypeCode = document.getDocumentType().getCode();
        String originalId = document.getId().value().toString();

        return String.format("ARCHIVED_%s_%s_%s.pdf",
                originalId, documentTypeCode, timestamp);
    }

    /**
     * Renombra el archivo físico para archivado
     */
    private String renameFileForArchiving(String originalFilePath, String archivedFileName) {
        try {
            // FIX: Construir la ruta completa correctamente
            // El originalFilePath ya incluye "documents/" desde la BD
            Path basePath = storageConfig.getBasePath(); // /app/storage
            Path originalPath = basePath.resolve(originalFilePath); // /app/storage/documents/26598410/archivo.pdf
            Path archivedPath = originalPath.getParent().resolve(archivedFileName);

            // Verificar que el archivo original existe
            if (!Files.exists(originalPath)) {
                log.warn("⚠️ [DocumentService] Archivo original no encontrado: {}", originalFilePath);
                return originalFilePath; // Mantener path original si no existe el archivo
            }

            // Renombrar archivo
            Files.move(originalPath, archivedPath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar el nuevo path relativo
            return storageConfig.getBasePath().relativize(archivedPath).toString();

        } catch (IOException e) {
            log.error("❌ [DocumentService] Error renombrando archivo: {} -> {}", originalFilePath, archivedFileName, e);
            throw new DocumentException("Error al renombrar archivo para archivado: " + e.getMessage());
        }
    }

    /**
     * Archiva un documento reemplazado con referencia al nuevo documento
     */
    private void archiveReplacedDocument(Document oldDocument, DocumentId newDocumentId, UUID userId) {
        try {
            // Generar nuevo nombre para el archivo archivado incluyendo el ID del nuevo documento
            String archivedFileName = generateArchivedFileNameWithReplacement(oldDocument, newDocumentId);

            // Renombrar el archivo físico
            String newFilePath = renameFileForArchiving(oldDocument.getFilePath(), archivedFileName);

            // Actualizar el documento con información de archivado
            oldDocument.setFilePath(newFilePath);
            oldDocument.archive(newDocumentId, userId);

            // Guardar cambios en base de datos
            documentRepository.save(oldDocument);

            log.info("📁 [DocumentService] Documento archivado exitosamente: {} -> {} (reemplazado por: {})",
                    oldDocument.getFileName().value(), archivedFileName, newDocumentId.value());

        } catch (Exception e) {
            log.error("❌ [DocumentService] Error archivando documento reemplazado: {}", oldDocument.getId().value(), e);
            // No lanzar excepción para no interrumpir la carga del nuevo documento
        }
    }

    /**
     * Genera el nombre del archivo archivado incluyendo el ID del documento de reemplazo
     * Formato: ARCHIVED_{originalId}_{documentType}_{replacedById}_{timestamp}.pdf
     */
    private String generateArchivedFileNameWithReplacement(Document document, DocumentId replacedById) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String documentTypeCode = document.getDocumentType().getCode();
        String originalId = document.getId().value().toString();
        String replacedByIdStr = replacedById.value().toString();

        return String.format("ARCHIVED_%s_%s_%s_%s.pdf",
                originalId, documentTypeCode, replacedByIdStr, timestamp);
    }

    @Override
    @Transactional
    public DocumentDto updateDocumentStatus(String documentId, String status) {
        log.debug("Updating document status: {} to: {}", documentId, status);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        document.setStatus(DocumentStatus.valueOf(status.toUpperCase()));
        Document updatedDocument = documentRepository.save(document);

        return documentMapper.toDto(document);
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

        // MODIFICATION: Allow admin users to check replace documents from any user
        boolean isAdmin = securityUtils.isCurrentUserAdmin();
        boolean canReplaceDocument = current.getUserId().equals(userId) || isAdmin;
        
        if (!canReplaceDocument || current.isArchived()) {
            if (current.isArchived()) {
                throw new DocumentException("Document is archived and cannot be replaced");
            } else {
                throw new DocumentException("Document does not belong to user and user is not admin");
            }
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

    /**
     * CRITICAL FIX: Actualiza el estado de las inscripciones del usuario después de cargar un documento
     * Verifica si ahora tiene todos los documentos requeridos y actualiza el estado correspondiente
     */
    private void updateInscriptionStatusAfterDocumentUpload(UUID userId) {
        try {
            log.info("🔄 [DocumentService] Actualizando estado de inscripciones para usuario: {}", userId);

            // Buscar inscripciones activas del usuario que puedan necesitar actualización
            List<Inscription> userInscriptions = inscriptionRepo.findByUserId(userId);
            log.info("🔍 [DocumentService] Encontradas {} inscripciones para usuario {}", userInscriptions.size(), userId);

            for (Inscription inscription : userInscriptions) {
                log.info("📋 [DocumentService] Procesando inscripción {} con estado: {}", inscription.getId(), inscription.getState());

                // Solo actualizar inscripciones que estén en estado COMPLETED_PENDING_DOCS
                if (inscription.getState() == InscriptionState.COMPLETED_PENDING_DOCS) {

                    // Obtener tipos de documentos requeridos dinámicamente
                    Set<String> requiredDocumentTypes = documentTypeRepository.findAllActive()
                            .stream()
                            .filter(ar.gov.mpd.concursobackend.document.domain.model.DocumentType::isRequired)
                            .map(ar.gov.mpd.concursobackend.document.domain.model.DocumentType::getCode)
                            .collect(java.util.stream.Collectors.toSet());

                    log.info("📄 [DocumentService] Tipos de documentos requeridos: {}", requiredDocumentTypes);

                    // Verificar si ahora tiene todos los documentos requeridos
                    boolean hasAllRequiredDocuments = inscription.hasAllRequiredDocuments(requiredDocumentTypes);

                    log.info("✅ [DocumentService] Inscripción {} - Documentos completos: {}",
                            inscription.getId(), hasAllRequiredDocuments);

                    // Actualizar estado usando el servicio especializado
                    inscriptionDeadlineService.updateInscriptionDocumentationStatus(inscription, hasAllRequiredDocuments);

                    log.info("🔄 [DocumentService] Estado de inscripción {} actualizado. Documentos completos: {}",
                            inscription.getId(), hasAllRequiredDocuments);
                }
            }

        } catch (Exception e) {
            // No fallar la operación principal si la actualización de estado falla
            log.warn("Error al actualizar estado de inscripciones después de cargar documento para usuario {}: {}",
                    userId, e.getMessage());
        }
    }
}