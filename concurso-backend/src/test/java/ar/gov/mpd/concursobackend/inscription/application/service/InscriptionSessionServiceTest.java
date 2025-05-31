package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionSessionMapper;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionSessionRepository;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InscriptionSessionServiceTest {

    @Mock
    private InscriptionSessionRepository repository;

    @Mock
    private InscriptionSessionMapper mapper;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private InscriptionSessionService service;

    private UUID testUserId;
    private UUID testInscriptionId;
    private UUID testSessionId;
    private Long testContestId;
    private InscriptionSession testSession;
    private InscriptionSessionResponse testSessionResponse;
    private InscriptionSessionRequest testSessionRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testInscriptionId = UUID.randomUUID();
        testSessionId = UUID.randomUUID();
        testContestId = 1L;

        // Configurar datos de prueba
        Map<String, Object> formData = new HashMap<>();
        formData.put("termsAccepted", true);
        formData.put("selectedCircunscripciones", List.of("Primera", "Segunda"));

        testSession = InscriptionSession.builder()
                .id(new InscriptionSessionId(testSessionId))
                .inscriptionId(new InscriptionId(testInscriptionId))
                .contestId(new ContestId(testContestId))
                .userId(new UserId(testUserId))
                .currentStep(InscriptionStep.TERMS_ACCEPTANCE)
                .formData(formData)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        testSessionResponse = InscriptionSessionResponse.builder()
                .id(testSessionId)
                .inscriptionId(testInscriptionId)
                .contestId(testContestId)
                .userId(testUserId)
                .currentStep(InscriptionStep.TERMS_ACCEPTANCE)
                .formData(formData)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        testSessionRequest = new InscriptionSessionRequest();
        testSessionRequest.setInscriptionId(testInscriptionId);
        testSessionRequest.setContestId(testContestId);
        testSessionRequest.setCurrentStep(InscriptionStep.TERMS_ACCEPTANCE);
        testSessionRequest.setFormData(formData);
    }

    @Test
    void saveSession_NewSession_ShouldCreateAndSave() {
        // Arrange
        when(securityUtils.getCurrentUserId()).thenReturn(testUserId.toString());
        when(repository.findByInscriptionId(any(InscriptionId.class))).thenReturn(Optional.empty());
        when(mapper.toDomain(any(InscriptionSessionRequest.class), any(UserId.class))).thenReturn(testSession);
        when(repository.save(any(InscriptionSession.class))).thenReturn(testSession);
        when(mapper.toResponse(any(InscriptionSession.class))).thenReturn(testSessionResponse);

        // Act
        InscriptionSessionResponse result = service.saveSession(testSessionRequest);

        // Assert
        assertNotNull(result);
        assertEquals(testSessionId, result.getId());
        assertEquals(testInscriptionId, result.getInscriptionId());
        assertEquals(testContestId, result.getContestId());
        assertEquals(testUserId, result.getUserId());
        assertEquals(InscriptionStep.TERMS_ACCEPTANCE, result.getCurrentStep());

        verify(repository).findByInscriptionId(any(InscriptionId.class));
        verify(mapper).toDomain(any(InscriptionSessionRequest.class), any(UserId.class));
        verify(repository).save(any(InscriptionSession.class));
        verify(mapper).toResponse(any(InscriptionSession.class));
    }

    @Test
    void saveSession_ExistingSession_ShouldUpdateAndSave() {
        // Arrange
        when(securityUtils.getCurrentUserId()).thenReturn(testUserId.toString());
        when(repository.findByInscriptionId(any(InscriptionId.class))).thenReturn(Optional.of(testSession));
        when(mapper.updateDomain(any(InscriptionSession.class), any(InscriptionSessionRequest.class))).thenReturn(testSession);
        when(repository.save(any(InscriptionSession.class))).thenReturn(testSession);
        when(mapper.toResponse(any(InscriptionSession.class))).thenReturn(testSessionResponse);

        // Act
        InscriptionSessionResponse result = service.saveSession(testSessionRequest);

        // Assert
        assertNotNull(result);
        assertEquals(testSessionId, result.getId());
        assertEquals(testInscriptionId, result.getInscriptionId());

        verify(repository).findByInscriptionId(any(InscriptionId.class));
        verify(mapper).updateDomain(any(InscriptionSession.class), any(InscriptionSessionRequest.class));
        verify(repository).save(any(InscriptionSession.class));
        verify(mapper).toResponse(any(InscriptionSession.class));
    }

    @Test
    void getSessionById_ExistingSession_ShouldReturnSession() {
        // Arrange
        when(repository.findById(any(InscriptionSessionId.class))).thenReturn(Optional.of(testSession));
        when(mapper.toResponse(any(InscriptionSession.class))).thenReturn(testSessionResponse);

        // Act
        Optional<InscriptionSessionResponse> result = service.getSessionById(testSessionId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testSessionId, result.get().getId());
        assertEquals(testInscriptionId, result.get().getInscriptionId());

        verify(repository).findById(any(InscriptionSessionId.class));
        verify(mapper).toResponse(any(InscriptionSession.class));
    }

    @Test
    void getSessionById_NonExistingSession_ShouldReturnEmpty() {
        // Arrange
        when(repository.findById(any(InscriptionSessionId.class))).thenReturn(Optional.empty());

        // Act
        Optional<InscriptionSessionResponse> result = service.getSessionById(testSessionId);

        // Assert
        assertFalse(result.isPresent());
        verify(repository).findById(any(InscriptionSessionId.class));
        verify(mapper, never()).toResponse(any(InscriptionSession.class));
    }

    @Test
    void getSessionByInscriptionId_ExistingSession_ShouldReturnSession() {
        // Arrange
        when(repository.findByInscriptionId(any(InscriptionId.class))).thenReturn(Optional.of(testSession));
        when(mapper.toResponse(any(InscriptionSession.class))).thenReturn(testSessionResponse);

        // Act
        Optional<InscriptionSessionResponse> result = service.getSessionByInscriptionId(testInscriptionId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testSessionId, result.get().getId());
        assertEquals(testInscriptionId, result.get().getInscriptionId());

        verify(repository).findByInscriptionId(any(InscriptionId.class));
        verify(mapper).toResponse(any(InscriptionSession.class));
    }

    @Test
    void getSessionByContestId_ExistingSession_ShouldReturnSession() {
        // Arrange
        when(securityUtils.getCurrentUserId()).thenReturn(testUserId.toString());
        when(repository.findByUserIdAndContestId(any(UserId.class), any(ContestId.class))).thenReturn(Optional.of(testSession));
        when(mapper.toResponse(any(InscriptionSession.class))).thenReturn(testSessionResponse);

        // Act
        Optional<InscriptionSessionResponse> result = service.getSessionByContestId(testContestId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testSessionId, result.get().getId());
        assertEquals(testContestId, result.get().getContestId());

        verify(repository).findByUserIdAndContestId(any(UserId.class), any(ContestId.class));
        verify(mapper).toResponse(any(InscriptionSession.class));
    }

    @Test
    void deleteSession_ShouldCallRepository() {
        // Act
        service.deleteSession(testSessionId);

        // Assert
        verify(repository).deleteById(any(InscriptionSessionId.class));
    }

    @Test
    void deleteSessionByInscriptionId_ExistingSession_ShouldDeleteSession() {
        // Arrange
        when(repository.findByInscriptionId(any(InscriptionId.class))).thenReturn(Optional.of(testSession));

        // Act
        service.deleteSessionByInscriptionId(testInscriptionId);

        // Assert
        verify(repository).findByInscriptionId(any(InscriptionId.class));
        verify(repository).deleteById(any(InscriptionSessionId.class));
    }

    @Test
    void deleteSessionByInscriptionId_NonExistingSession_ShouldNotDeleteAnything() {
        // Arrange
        when(repository.findByInscriptionId(any(InscriptionId.class))).thenReturn(Optional.empty());

        // Act
        service.deleteSessionByInscriptionId(testInscriptionId);

        // Assert
        verify(repository).findByInscriptionId(any(InscriptionId.class));
        verify(repository, never()).deleteById(any(InscriptionSessionId.class));
    }

    @Test
    void deleteExpiredSessions_ShouldCallRepository() {
        // Arrange
        when(repository.deleteExpiredSessions()).thenReturn(5);

        // Act
        int result = service.deleteExpiredSessions();

        // Assert
        assertEquals(5, result);
        verify(repository).deleteExpiredSessions();
    }
}
