package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.UpdateInscriptionStepRequest;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UpdateInscriptionStepServiceTest {

    @Mock
    private InscriptionRepository inscriptionRepository;

    @InjectMocks
    private UpdateInscriptionStepService service;

    private UUID testInscriptionId;
    private UUID testUserId;
    private Long testContestId;
    private Inscription testInscription;
    private UpdateInscriptionStepRequest testRequest;

    @BeforeEach
    void setUp() {
        testInscriptionId = UUID.randomUUID();
        testUserId = UUID.randomUUID();
        testContestId = 1L;

        // Configurar inscripción de prueba
        testInscription = Inscription.builder()
                .id(new InscriptionId(testInscriptionId))
                .contestId(new ContestId(testContestId))
                .userId(new UserId(testUserId))
                .state(InscriptionState.PENDING)
                .currentStep(InscriptionStep.INITIAL)
                .createdAt(LocalDateTime.now())
                .inscriptionDate(LocalDateTime.now())
                .build();

        // Configurar solicitud de prueba
        testRequest = UpdateInscriptionStepRequest.builder()
                .step(InscriptionStep.TERMS_ACCEPTANCE)
                .acceptedTerms(true)
                .confirmedPersonalData(false) // Asegurarse de proporcionar este valor
                .build();
    }

    @Test
    void updateStep_ToTermsAcceptance_ShouldUpdateStepAndPreferences() {
        // Arrange
        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.of(testInscription));
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(testInscription);

        testRequest = UpdateInscriptionStepRequest.builder()
                .step(InscriptionStep.TERMS_ACCEPTANCE)
                .acceptedTerms(true)
                .confirmedPersonalData(false)
                .build();

        // Act
        Inscription result = service.updateStep(testInscriptionId, testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(InscriptionStep.TERMS_ACCEPTANCE, result.getCurrentStep());
        assertNotNull(result.getPreferences());
        assertTrue(result.getPreferences().isAcceptedTerms());
        assertFalse(result.getPreferences().isConfirmedPersonalData());
        assertNull(result.getPreferences().getSelectedCircunscripciones());

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository).save(any(Inscription.class));
    }

    @Test
    void updateStep_ToLocationSelection_ShouldUpdateStepAndPreferences() {
        // Arrange
        testInscription.updateStep(InscriptionStep.TERMS_ACCEPTANCE);
        testInscription.updatePreferences(InscriptionPreferences.builder()
                .acceptedTerms(true)
                .confirmedPersonalData(false)
                .selectedCircunscripciones(null)
                .termsAcceptanceDate(LocalDateTime.now())
                .build());

        testRequest = UpdateInscriptionStepRequest.builder()
                .step(InscriptionStep.LOCATION_SELECTION)
                .selectedCircunscripciones(Set.of("Primera", "Segunda"))
                .acceptedTerms(true)
                .confirmedPersonalData(false)
                .build();

        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.of(testInscription));
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(testInscription);

        // Act
        Inscription result = service.updateStep(testInscriptionId, testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(InscriptionStep.LOCATION_SELECTION, result.getCurrentStep());
        assertNotNull(result.getPreferences());
        assertTrue(result.getPreferences().isAcceptedTerms());
        assertFalse(result.getPreferences().isConfirmedPersonalData());
        assertNotNull(result.getPreferences().getSelectedCircunscripciones());
        assertEquals(2, result.getPreferences().getSelectedCircunscripciones().size());
        assertTrue(result.getPreferences().getSelectedCircunscripciones().contains("Primera"));
        assertTrue(result.getPreferences().getSelectedCircunscripciones().contains("Segunda"));

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository).save(any(Inscription.class));
    }

    @Test
    void updateStep_ToDataConfirmation_ShouldUpdateStepAndPreferences() {
        // Arrange
        Set<String> selectedCircunscripciones = new HashSet<>();
        selectedCircunscripciones.add("Primera");
        selectedCircunscripciones.add("Segunda");

        testInscription.updateStep(InscriptionStep.LOCATION_SELECTION);
        testInscription.updatePreferences(InscriptionPreferences.builder()
                .acceptedTerms(true)
                .confirmedPersonalData(false)
                .selectedCircunscripciones(selectedCircunscripciones)
                .termsAcceptanceDate(LocalDateTime.now())
                .build());

        testRequest = UpdateInscriptionStepRequest.builder()
                .step(InscriptionStep.DATA_CONFIRMATION)
                .selectedCircunscripciones(selectedCircunscripciones)
                .acceptedTerms(true)
                .confirmedPersonalData(true)
                .build();

        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.of(testInscription));
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(testInscription);

        // Act
        Inscription result = service.updateStep(testInscriptionId, testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(InscriptionStep.DATA_CONFIRMATION, result.getCurrentStep());
        assertNotNull(result.getPreferences());
        assertTrue(result.getPreferences().isAcceptedTerms());
        assertTrue(result.getPreferences().isConfirmedPersonalData());
        assertNotNull(result.getPreferences().getSelectedCircunscripciones());
        assertEquals(2, result.getPreferences().getSelectedCircunscripciones().size());

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository).save(any(Inscription.class));
    }

    @Test
    void updateStep_ToCompleted_ShouldUpdateStepAndStatus() {
        // Arrange
        Set<String> selectedCircunscripciones = new HashSet<>();
        selectedCircunscripciones.add("Primera");
        selectedCircunscripciones.add("Segunda");

        testInscription.updateStep(InscriptionStep.DATA_CONFIRMATION);
        testInscription.updatePreferences(InscriptionPreferences.builder()
                .acceptedTerms(true)
                .confirmedPersonalData(true)
                .selectedCircunscripciones(selectedCircunscripciones)
                .termsAcceptanceDate(LocalDateTime.now())
                .dataConfirmationDate(LocalDateTime.now())
                .build());

        testRequest = UpdateInscriptionStepRequest.builder()
                .step(InscriptionStep.COMPLETED)
                .selectedCircunscripciones(selectedCircunscripciones)
                .acceptedTerms(true)
                .confirmedPersonalData(true)
                .build();

        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.of(testInscription));

        // Mock para capturar el objeto guardado
        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(invocation -> {
            Inscription saved = invocation.getArgument(0);
            // Asegurarse de que el estado se actualice cuando se guarda
            if (saved.getCurrentStep() == InscriptionStep.COMPLETED) {
                saved.setState(InscriptionState.ACTIVE);
            }
            return saved;
        });

        // Act
        Inscription result = service.updateStep(testInscriptionId, testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(InscriptionStep.COMPLETED, result.getCurrentStep());
        assertEquals(InscriptionState.ACTIVE, result.getState());
        assertNotNull(result.getPreferences());
        assertTrue(result.getPreferences().isAcceptedTerms());
        assertTrue(result.getPreferences().isConfirmedPersonalData());
        assertNotNull(result.getPreferences().getSelectedCircunscripciones());
        assertEquals(2, result.getPreferences().getSelectedCircunscripciones().size());

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository).save(any(Inscription.class));
    }

    @Test
    void updateStep_InscriptionNotFound_ShouldThrowException() {
        // Arrange
        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            service.updateStep(testInscriptionId, testRequest);
        });

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository, never()).save(any(Inscription.class));
    }

    @Test
    void updateStep_BackwardStep_ShouldThrowException() {
        // Arrange
        testInscription.updateStep(InscriptionStep.LOCATION_SELECTION);
        testRequest.setStep(InscriptionStep.TERMS_ACCEPTANCE);

        when(inscriptionRepository.findById(any(UUID.class))).thenReturn(Optional.of(testInscription));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            service.updateStep(testInscriptionId, testRequest);
        });

        verify(inscriptionRepository).findById(any(UUID.class));
        verify(inscriptionRepository, never()).save(any(Inscription.class));
    }
}
