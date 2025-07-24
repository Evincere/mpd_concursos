package ar.gov.mpd.concursobackend.contest.domain.service;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Contest State Machine Tests")
class ContestStateMachineTest {

    private ContestStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new ContestStateMachine();
    }

    @Test
    @DisplayName("Should allow valid transitions from DRAFT")
    void shouldAllowValidTransitionsFromDraft() {
        assertTrue(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.SCHEDULED));
        assertTrue(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should reject invalid transitions from DRAFT")
    void shouldRejectInvalidTransitionsFromDraft() {
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.INSCRIPTION_OPEN));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.FINISHED));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.ARCHIVED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PUBLISHED")
    void shouldAllowValidTransitionsFromPublished() {
        assertTrue(stateMachine.canTransition(ContestStatus.PUBLISHED, ContestStatus.INSCRIPTION_OPEN));
        assertTrue(stateMachine.canTransition(ContestStatus.PUBLISHED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from INSCRIPTION_OPEN")
    void shouldAllowValidTransitionsFromInscriptionOpen() {
        assertTrue(stateMachine.canTransition(ContestStatus.INSCRIPTION_OPEN, ContestStatus.PAUSED));
        assertTrue(stateMachine.canTransition(ContestStatus.INSCRIPTION_OPEN, ContestStatus.INSCRIPTION_CLOSED));
        assertTrue(stateMachine.canTransition(ContestStatus.INSCRIPTION_OPEN, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PAUSED")
    void shouldAllowValidTransitionsFromPaused() {
        assertTrue(stateMachine.canTransition(ContestStatus.PAUSED, ContestStatus.PUBLISHED));
        assertTrue(stateMachine.canTransition(ContestStatus.PAUSED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from INSCRIPTION_CLOSED")
    void shouldAllowValidTransitionsFromInscriptionClosed() {
        assertTrue(stateMachine.canTransition(ContestStatus.INSCRIPTION_CLOSED, ContestStatus.IN_EVALUATION));
        assertTrue(stateMachine.canTransition(ContestStatus.INSCRIPTION_CLOSED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from FINISHED")
    void shouldAllowValidTransitionsFromFinished() {
        assertTrue(stateMachine.canTransition(ContestStatus.FINISHED, ContestStatus.ARCHIVED));
    }

    @Test
    @DisplayName("Should not allow transitions from final states")
    void shouldNotAllowTransitionsFromFinalStates() {
        assertFalse(stateMachine.canTransition(ContestStatus.CANCELLED, ContestStatus.INSCRIPTION_OPEN));
        assertFalse(stateMachine.canTransition(ContestStatus.ARCHIVED, ContestStatus.INSCRIPTION_OPEN));
    }

    @Test
    @DisplayName("Should validate transitions and throw exception for invalid ones")
    void shouldValidateTransitionsAndThrowException() {
        assertDoesNotThrow(() -> stateMachine.validateTransition(ContestStatus.DRAFT, ContestStatus.PUBLISHED));
        
        IllegalStateException exception = assertThrows(IllegalStateException.class,
            () -> stateMachine.validateTransition(ContestStatus.DRAFT, ContestStatus.INSCRIPTION_OPEN));
        
        assertTrue(exception.getMessage().contains("Invalid contest state transition"));
    }

    @Test
    @DisplayName("Should return correct valid next states")
    void shouldReturnCorrectValidNextStates() {
        Set<ContestStatus> draftNextStates = stateMachine.getValidNextStates(ContestStatus.DRAFT);
        assertEquals(2, draftNextStates.size());
        assertTrue(draftNextStates.contains(ContestStatus.PUBLISHED));
        assertTrue(draftNextStates.contains(ContestStatus.CANCELLED));

        Set<ContestStatus> inscriptionOpenNextStates = stateMachine.getValidNextStates(ContestStatus.INSCRIPTION_OPEN);
        assertEquals(3, inscriptionOpenNextStates.size());
        assertTrue(inscriptionOpenNextStates.contains(ContestStatus.PAUSED));
        assertTrue(inscriptionOpenNextStates.contains(ContestStatus.INSCRIPTION_CLOSED));
        assertTrue(inscriptionOpenNextStates.contains(ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should correctly identify final states")
    void shouldCorrectlyIdentifyFinalStates() {
        assertTrue(stateMachine.isFinalState(ContestStatus.CANCELLED));
        assertTrue(stateMachine.isFinalState(ContestStatus.ARCHIVED));
        assertFalse(stateMachine.isFinalState(ContestStatus.DRAFT));
        assertFalse(stateMachine.isFinalState(ContestStatus.INSCRIPTION_OPEN));
    }

    @Test
    @DisplayName("Should correctly identify states that allow inscriptions")
    void shouldCorrectlyIdentifyStatesAllowingInscriptions() {
        // Estados que permiten inscripciones
        assertTrue(stateMachine.allowsInscriptions(ContestStatus.PUBLISHED));
        assertTrue(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_OPEN));

        // Estados que NO permiten inscripciones
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.DRAFT));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_PENDING));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_CLOSED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.IN_EVALUATION));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.RESULTS_PUBLISHED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.FINISHED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.CANCELLED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.ARCHIVED));
    }

    @Test
    @DisplayName("Should correctly identify active statuses")
    void shouldCorrectlyIdentifyActiveStatuses() {
        assertTrue(stateMachine.isActiveStatus(ContestStatus.INSCRIPTION_OPEN));
        assertTrue(stateMachine.isActiveStatus(ContestStatus.PUBLISHED));
        assertFalse(stateMachine.isActiveStatus(ContestStatus.DRAFT));
        assertFalse(stateMachine.isActiveStatus(ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should provide status descriptions")
    void shouldProvideStatusDescriptions() {
        String draftDescription = stateMachine.getStatusDescription(ContestStatus.DRAFT);
        assertNotNull(draftDescription);
        assertTrue(draftDescription.contains("preparación"));

        String inscriptionOpenDescription = stateMachine.getStatusDescription(ContestStatus.INSCRIPTION_OPEN);
        assertNotNull(inscriptionOpenDescription);
        assertTrue(inscriptionOpenDescription.contains("abiertas"));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValuesGracefully() {
        assertFalse(stateMachine.canTransition(null, ContestStatus.INSCRIPTION_OPEN));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, null));
        assertFalse(stateMachine.canTransition(null, null));
    }

    @Test
    @DisplayName("Should support IN_EVALUATION state transitions")
    void shouldSupportInEvaluationStateTransitions() {
        assertTrue(stateMachine.canTransition(ContestStatus.IN_EVALUATION, ContestStatus.RESULTS_PUBLISHED));
        assertTrue(stateMachine.canTransition(ContestStatus.IN_EVALUATION, ContestStatus.CANCELLED));
        assertFalse(stateMachine.canTransition(ContestStatus.IN_EVALUATION, ContestStatus.INSCRIPTION_OPEN));
    }

    @Test
    @DisplayName("Should return all statuses")
    void shouldReturnAllStatuses() {
        Set<ContestStatus> allStatuses = stateMachine.getAllStatuses();
        assertFalse(allStatuses.isEmpty());
        assertTrue(allStatuses.contains(ContestStatus.DRAFT));
        assertTrue(allStatuses.contains(ContestStatus.INSCRIPTION_OPEN));
        assertTrue(allStatuses.contains(ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should return non-final statuses")
    void shouldReturnNonFinalStatuses() {
        Set<ContestStatus> nonFinalStatuses = stateMachine.getNonFinalStatuses();
        assertTrue(nonFinalStatuses.contains(ContestStatus.DRAFT));
        assertTrue(nonFinalStatuses.contains(ContestStatus.INSCRIPTION_OPEN));
        assertFalse(nonFinalStatuses.contains(ContestStatus.CANCELLED));
        assertFalse(nonFinalStatuses.contains(ContestStatus.ARCHIVED));
    }
}
