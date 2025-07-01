package ar.gov.mpd.concursobackend.document.application.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Async;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentStorageService documentStorageService;
    private final DocumentMapper documentMapper;
    private final IUserRepository userRepository;

    @Override
    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, InputStream fileContent, UUID userId) {
        log.debug("Uploading document for user: {}", userId);

        DocumentType documentType = findDocumentType(request.getDocumentTypeId());
        String displayFileName = documentType.getName() + ".pdf";

        Document document = Document.create(
                userId,
                documentType,
                new DocumentName(displayFileName),
                request.getContentType(),
                null,
                request.getComments());

        document.setStatus(DocumentStatus.PROCESSING);
        Document savedDocument = documentRepository.save(document);

        storeFileAsync(fileContent, request.getFileName(), userId, savedDocument.getId().value(), documentType.getName());

        return DocumentResponse.builder()
                .id(savedDocument.getId().value().toString())
                .mensaje("Document upload started")
                .documento(documentMapper.toDto(savedDocument))
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
            documentRepository.save(document);
        } catch (DocumentException e) {
            log.error("Error storing file asynchronously", e);
            Document document = documentRepository.findById(new DocumentId(documentId))
                    .orElseThrow(() -> new DocumentException("Document not found"));
            document.setStatus(DocumentStatus.ERROR);
            documentRepository.save(document);
        } catch (Exception e) {
            log.error("Unexpected error storing file asynchronously", e);
            Document document = documentRepository.findById(new DocumentId(documentId))
                    .orElseThrow(() -> new DocumentException("Document not found"));
            document.setStatus(DocumentStatus.ERROR);
            documentRepository.save(document);
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
    public String saveDocument(InputStream inputStream, String filename, UUID documentId, UUID userId)
            throws IOException {
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
}