package ar.gov.mpd.concursobackend.document.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.ProcessingStatus;

/**
 * Unit tests para DocumentDuplicateService
 */
@ExtendWith(MockitoExtension.class)
class DocumentDuplicateServiceTest {

    @Mock
    private IDocumentRepository documentRepository;

    @Mock
    private DocumentAuditService auditService;

    @InjectMocks
    private DocumentDuplicateService duplicateService;

    private UUID userId;
    private String documentTypeId;
    private Document existingDocument;
    private Document newDocument;
    private DocumentType documentType;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        documentTypeId = UUID.randomUUID().toString();
        
        // Crear tipo de documento mock
        documentType = new DocumentType();
        documentType.setId(new DocumentTypeId(UUID.fromString(documentTypeId)));
        documentType.setName("Test Document Type");

        // Crear documento existente
        existingDocument = new Document();
        existingDocument.setId(new DocumentId(UUID.randomUUID()));
        existingDocument.setUserId(userId);
        existingDocument.setDocumentType(documentType);
        existingDocument.setFileName(new DocumentName("existing.pdf"));
        existingDocument.setStatus(DocumentStatus.APPROVED);
        existingDocument.setProcessingStatus(ProcessingStatus.UPLOAD_COMPLETE);
        existingDocument.setUploadDate(LocalDateTime.now().minusDays(1));
        existingDocument.setArchived(false);
        existingDocument.setVersion(1);

        // Crear nuevo documento
        newDocument = new Document();
        newDocument.setId(new DocumentId(UUID.randomUUID()));
        newDocument.setUserId(userId);
        newDocument.setDocumentType(documentType);
        newDocument.setFileName(new DocumentName("new.pdf"));
        newDocument.setStatus(DocumentStatus.PROCESSING);
        newDocument.setProcessingStatus(ProcessingStatus.UPLOADING);
        newDocument.setUploadDate(LocalDateTime.now());
        newDocument.setArchived(false);
        newDocument.setVersion(1);
    }

    @Test
    void findExistingDocument_WhenDocumentExists_ShouldReturnDocument() {
        // Arrange
        when(documentRepository.findActiveByUserAndType(eq(userId), any(DocumentTypeId.class)))
                .thenReturn(Optional.of(existingDocument));

        // Act
        Optional<Document> result = duplicateService.findExistingDocument(userId, documentTypeId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(existingDocument.getId(), result.get().getId());
        verify(documentRepository).findActiveByUserAndType(eq(userId), any(DocumentTypeId.class));
    }

    @Test
    void findExistingDocument_WhenDocumentNotExists_ShouldReturnEmpty() {
        // Arrange
        when(documentRepository.findActiveByUserAndType(eq(userId), any(DocumentTypeId.class)))
                .thenReturn(Optional.empty());

        // Act
        Optional<Document> result = duplicateService.findExistingDocument(userId, documentTypeId);

        // Assert
        assertFalse(result.isPresent());
        verify(documentRepository).findActiveByUserAndType(eq(userId), any(DocumentTypeId.class));
    }

    @Test
    void findExistingDocument_WhenInvalidDocumentTypeId_ShouldReturnEmpty() {
        // Act
        Optional<Document> result = duplicateService.findExistingDocument(userId, "invalid-uuid");

        // Assert
        assertFalse(result.isPresent());
        verify(documentRepository, never()).findActiveByUserAndType(any(), any());
    }

    @Test
    void replaceDocument_WhenValidDocuments_ShouldReturnSuccessResult() {
        // Arrange
        when(documentRepository.save(any(Document.class)))
                .thenReturn(existingDocument) // Para el documento archivado
                .thenReturn(newDocument);     // Para el nuevo documento
        
        doNothing().when(auditService).recordReplacement(any(), any(), any());

        // Act
        DocumentDuplicateService.DocumentReplacementResult result = 
                duplicateService.replaceDocument(existingDocument, newDocument, userId);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(newDocument, result.getNewDocument());
        assertEquals(existingDocument, result.getArchivedDocument());
        assertEquals("Documento reemplazado exitosamente", result.getMessage());
        
        // Verificar que el documento existente fue archivado
        assertTrue(existingDocument.isArchived());
        assertEquals(newDocument.getId(), existingDocument.getReplacedDocumentId());
        
        verify(documentRepository, times(2)).save(any(Document.class));
        verify(auditService).recordReplacement(existingDocument, newDocument, userId);
    }

    @Test
    void canReplaceDocument_WhenValidDocument_ShouldReturnTrue() {
        // Act
        boolean result = duplicateService.canReplaceDocument(existingDocument, userId);

        // Assert
        assertTrue(result);
    }

    @Test
    void canReplaceDocument_WhenNullDocument_ShouldReturnFalse() {
        // Act
        boolean result = duplicateService.canReplaceDocument(null, userId);

        // Assert
        assertFalse(result);
    }

    @Test
    void canReplaceDocument_WhenDifferentUser_ShouldReturnFalse() {
        // Arrange
        UUID differentUserId = UUID.randomUUID();

        // Act
        boolean result = duplicateService.canReplaceDocument(existingDocument, differentUserId);

        // Assert
        assertFalse(result);
    }

    @Test
    void canReplaceDocument_WhenDocumentArchived_ShouldReturnFalse() {
        // Arrange
        existingDocument.setArchived(true);

        // Act
        boolean result = duplicateService.canReplaceDocument(existingDocument, userId);

        // Assert
        assertFalse(result);
    }

    @Test
    void canReplaceDocument_WhenDocumentNotComplete_ShouldReturnFalse() {
        // Arrange
        existingDocument.setProcessingStatus(ProcessingStatus.UPLOADING);

        // Act
        boolean result = duplicateService.canReplaceDocument(existingDocument, userId);

        // Assert
        assertFalse(result);
    }

    @Test
    void replaceDocument_WhenExceptionOccurs_ShouldThrowDocumentReplacementException() {
        // Arrange
        when(documentRepository.save(any(Document.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            duplicateService.replaceDocument(existingDocument, newDocument, userId);
        });
    }
}
