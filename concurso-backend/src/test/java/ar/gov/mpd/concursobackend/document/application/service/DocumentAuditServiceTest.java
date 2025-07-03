package ar.gov.mpd.concursobackend.document.application.service;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.ProcessingStatus;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentAuditEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentAuditSpringRepository;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests para DocumentAuditService
 */
@ExtendWith(MockitoExtension.class)
class DocumentAuditServiceTest {

    @Mock
    private IDocumentAuditSpringRepository auditRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private DocumentAuditService auditService;

    private Document document;
    private UUID userId;
    private UUID actionBy;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        actionBy = UUID.randomUUID();

        // Crear tipo de documento mock
        DocumentType documentType = new DocumentType();
        documentType.setId(new DocumentTypeId(UUID.randomUUID()));
        documentType.setName("Test Document Type");

        // Crear documento mock
        document = new Document();
        document.setId(new DocumentId(UUID.randomUUID()));
        document.setUserId(userId);
        document.setDocumentType(documentType);
        document.setFileName(new DocumentName("test.pdf"));
        document.setFilePath("/path/to/test.pdf");
        document.setStatus(DocumentStatus.APPROVED);
        document.setProcessingStatus(ProcessingStatus.UPLOAD_COMPLETE);
        document.setUploadDate(LocalDateTime.now());
        document.setArchived(false);
        document.setVersion(1);
    }

    @Test
    void recordCreation_WhenValidDocument_ShouldSaveAuditRecord() throws Exception {
        // Arrange
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordCreation(document, actionBy);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository).save(auditCaptor.capture());

        DocumentAuditEntity savedAudit = auditCaptor.getValue();
        assertEquals(document.getId().value(), savedAudit.getDocumentId());
        assertEquals(userId, savedAudit.getUserId());
        assertEquals(DocumentAuditEntity.ActionType.CREATED, savedAudit.getActionType());
        assertEquals(document.getFilePath(), savedAudit.getNewFilePath());
        assertEquals(actionBy, savedAudit.getActionBy());
        assertEquals("Documento creado", savedAudit.getReason());
    }

    @Test
    void recordCreation_WhenExceptionOccurs_ShouldNotThrow() throws Exception {
        // Arrange
        when(objectMapper.writeValueAsString(any())).thenThrow(new RuntimeException("JSON error"));

        // Act & Assert - No debería lanzar excepción
        assertDoesNotThrow(() -> auditService.recordCreation(document, actionBy));
        
        // Verificar que se intentó guardar
        verify(auditRepository).save(any(DocumentAuditEntity.class));
    }

    @Test
    void recordReplacement_WhenValidDocuments_ShouldSaveTwoAuditRecords() throws Exception {
        // Arrange
        Document newDocument = new Document();
        newDocument.setId(new DocumentId(UUID.randomUUID()));
        newDocument.setUserId(userId);
        newDocument.setDocumentType(document.getDocumentType());
        newDocument.setFileName(new DocumentName("new_test.pdf"));
        newDocument.setFilePath("/path/to/new_test.pdf");
        newDocument.setStatus(DocumentStatus.PROCESSING);
        newDocument.setProcessingStatus(ProcessingStatus.UPLOADING);
        newDocument.setUploadDate(LocalDateTime.now());
        newDocument.setArchived(false);
        newDocument.setVersion(2);

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordReplacement(document, newDocument, actionBy);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository, times(2)).save(auditCaptor.capture());

        var savedAudits = auditCaptor.getAllValues();
        
        // Verificar auditoría de documento archivado
        DocumentAuditEntity archiveAudit = savedAudits.get(0);
        assertEquals(document.getId().value(), archiveAudit.getDocumentId());
        assertEquals(DocumentAuditEntity.ActionType.REPLACED, archiveAudit.getActionType());
        assertEquals(document.getFilePath(), archiveAudit.getOldFilePath());
        assertEquals("Documento reemplazado por nueva versión", archiveAudit.getReason());

        // Verificar auditoría de nuevo documento
        DocumentAuditEntity createAudit = savedAudits.get(1);
        assertEquals(newDocument.getId().value(), createAudit.getDocumentId());
        assertEquals(DocumentAuditEntity.ActionType.CREATED, createAudit.getActionType());
        assertEquals(newDocument.getFilePath(), createAudit.getNewFilePath());
        assertEquals("Documento creado como reemplazo", createAudit.getReason());
    }

    @Test
    void recordDeletion_WhenValidDocument_ShouldSaveAuditRecord() throws Exception {
        // Arrange
        String reason = "Usuario eliminó el documento";
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordDeletion(document, actionBy, reason);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository).save(auditCaptor.capture());

        DocumentAuditEntity savedAudit = auditCaptor.getValue();
        assertEquals(document.getId().value(), savedAudit.getDocumentId());
        assertEquals(userId, savedAudit.getUserId());
        assertEquals(DocumentAuditEntity.ActionType.DELETED, savedAudit.getActionType());
        assertEquals(document.getFilePath(), savedAudit.getOldFilePath());
        assertEquals(actionBy, savedAudit.getActionBy());
        assertEquals(reason, savedAudit.getReason());
    }

    @Test
    void recordUpdate_WhenValidDocument_ShouldSaveAuditRecord() throws Exception {
        // Arrange
        String oldFilePath = "/path/to/old_test.pdf";
        String reason = "Documento actualizado";
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordUpdate(document, oldFilePath, actionBy, reason);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository).save(auditCaptor.capture());

        DocumentAuditEntity savedAudit = auditCaptor.getValue();
        assertEquals(document.getId().value(), savedAudit.getDocumentId());
        assertEquals(userId, savedAudit.getUserId());
        assertEquals(DocumentAuditEntity.ActionType.UPDATED, savedAudit.getActionType());
        assertEquals(oldFilePath, savedAudit.getOldFilePath());
        assertEquals(document.getFilePath(), savedAudit.getNewFilePath());
        assertEquals(actionBy, savedAudit.getActionBy());
        assertEquals(reason, savedAudit.getReason());
    }

    @Test
    void recordDeletion_WhenReasonIsNull_ShouldUseDefaultReason() throws Exception {
        // Arrange
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordDeletion(document, actionBy, null);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository).save(auditCaptor.capture());

        DocumentAuditEntity savedAudit = auditCaptor.getValue();
        assertEquals("Documento eliminado", savedAudit.getReason());
    }

    @Test
    void recordUpdate_WhenReasonIsNull_ShouldUseDefaultReason() throws Exception {
        // Arrange
        String oldFilePath = "/path/to/old_test.pdf";
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(auditRepository.save(any(DocumentAuditEntity.class))).thenReturn(new DocumentAuditEntity());

        // Act
        auditService.recordUpdate(document, oldFilePath, actionBy, null);

        // Assert
        ArgumentCaptor<DocumentAuditEntity> auditCaptor = ArgumentCaptor.forClass(DocumentAuditEntity.class);
        verify(auditRepository).save(auditCaptor.capture());

        DocumentAuditEntity savedAudit = auditCaptor.getValue();
        assertEquals("Documento actualizado", savedAudit.getReason());
    }
}
