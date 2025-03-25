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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentStorageService documentStorageService;
    private final DocumentMapper documentMapper;

    @Override
    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, InputStream fileContent, UUID userId)
            throws IOException {
        log.debug("Uploading document for user: {}", userId);

        DocumentType documentType = documentTypeRepository
                .findById(new DocumentTypeId(UUID.fromString(request.getDocumentTypeId())))
                .orElseThrow(() -> new DocumentException("Document type not found"));

        Document document = Document.create(
                userId,
                documentType,
                new DocumentName(request.getFileName()),
                request.getContentType(),
                null,
                request.getComments());

        // Store the file
        String filePath = documentStorageService.storeFile(fileContent, request.getFileName(), userId,
                document.getId().value());
        document.setFilePath(filePath);

        // Save document metadata
        Document savedDocument = documentRepository.save(document);
        log.debug("Document saved: {}", savedDocument);

        return DocumentResponse.builder()
                .id(savedDocument.getId().value().toString())
                .mensaje("Document uploaded successfully")
                .documento(documentMapper.toDto(savedDocument))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto> getUserDocuments(UUID userId) {
        log.debug("Getting documents for user: {}", userId);

        List<Document> documents = documentRepository.findByUserId(userId);
        return documentMapper.toDtoList(documents);
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

            // Crear o recuperar el tipo de documento para certificados laborales
            DocumentType documentType;
            try {
                log.debug("Buscando tipo de documento 'Certificado Laboral'");
                // En lugar de intentar convertir un string a UUID, mejor buscar por nombre
                // directamente
                documentType = documentTypeRepository.findAll().stream()
                        .filter(type -> "Certificado Laboral".equals(type.getName()))
                        .findFirst()
                        .orElseGet(() -> {
                            // Crear nuevo tipo de documento con los valores adecuados
                            log.debug("Tipo de documento 'Certificado Laboral' no encontrado, creando uno nuevo");
                            DocumentType newType = new DocumentType(
                                    "Certificado Laboral",
                                    "Certificado de experiencia laboral",
                                    false,
                                    1);
                            return documentTypeRepository.save(newType);
                        });
                log.debug("Tipo de documento encontrado/creado: {}", documentType);
            } catch (Exception e) {
                log.error("Error al obtener el tipo de documento: {}", e.getMessage(), e);
                // Crear un nuevo tipo de documento como fallback
                log.debug("Creando un nuevo tipo de documento como fallback debido al error");
                DocumentType newType = new DocumentType(
                        "Certificado Laboral",
                        "Certificado de experiencia laboral",
                        false,
                        1);
                documentType = documentTypeRepository.save(newType);
                log.debug("Tipo de documento fallback creado: {}", documentType);
            }

            // Create document entity
            log.debug("Creando entidad Document");
            Document document = Document.create(
                    userId,
                    documentType,
                    new DocumentName(filename),
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

                // Usar un nuevo InputStream a partir de los bytes copiados
                try (InputStream copiedStream = new java.io.ByteArrayInputStream(fileBytes)) {
                    // AHORA SI guardamos en el disco
                    filePath = documentStorageService.storeFile(copiedStream, filename, userId,
                            document.getId().value());
                    
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