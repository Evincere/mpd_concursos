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
        assertTrue(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.PUBLISHED));
        assertTrue(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should reject invalid transitions from DRAFT")
    void shouldRejectInvalidTransitionsFromDraft() {
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.FINISHED));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, ContestStatus.ARCHIVED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PUBLISHED")
    void shouldAllowValidTransitionsFromPublished() {
        assertTrue(stateMachine.canTransition(ContestStatus.PUBLISHED, ContestStatus.ACTIVE));
        assertTrue(stateMachine.canTransition(ContestStatus.PUBLISHED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from ACTIVE")
    void shouldAllowValidTransitionsFromActive() {
        assertTrue(stateMachine.canTransition(ContestStatus.ACTIVE, ContestStatus.PAUSED));
        assertTrue(stateMachine.canTransition(ContestStatus.ACTIVE, ContestStatus.CLOSED));
        assertTrue(stateMachine.canTransition(ContestStatus.ACTIVE, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PAUSED")
    void shouldAllowValidTransitionsFromPaused() {
        assertTrue(stateMachine.canTransition(ContestStatus.PAUSED, ContestStatus.ACTIVE));
        assertTrue(stateMachine.canTransition(ContestStatus.PAUSED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from CLOSED")
    void shouldAllowValidTransitionsFromClosed() {
        assertTrue(stateMachine.canTransition(ContestStatus.CLOSED, ContestStatus.FINISHED));
        assertTrue(stateMachine.canTransition(ContestStatus.CLOSED, ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from FINISHED")
    void shouldAllowValidTransitionsFromFinished() {
        assertTrue(stateMachine.canTransition(ContestStatus.FINISHED, ContestStatus.ARCHIVED));
    }

    @Test
    @DisplayName("Should not allow transitions from final states")
    void shouldNotAllowTransitionsFromFinalStates() {
        assertFalse(stateMachine.canTransition(ContestStatus.CANCELLED, ContestStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(ContestStatus.ARCHIVED, ContestStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should validate transitions and throw exception for invalid ones")
    void shouldValidateTransitionsAndThrowException() {
        assertDoesNotThrow(() -> stateMachine.validateTransition(ContestStatus.DRAFT, ContestStatus.PUBLISHED));
        
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> stateMachine.validateTransition(ContestStatus.DRAFT, ContestStatus.ACTIVE));
        
        assertTrue(exception.getMessage().contains("Invalid contest state transition"));
    }

    @Test
    @DisplayName("Should return correct valid next states")
    void shouldReturnCorrectValidNextStates() {
        Set<ContestStatus> draftNextStates = stateMachine.getValidNextStates(ContestStatus.DRAFT);
        assertEquals(2, draftNextStates.size());
        assertTrue(draftNextStates.contains(ContestStatus.PUBLISHED));
        assertTrue(draftNextStates.contains(ContestStatus.CANCELLED));

        Set<ContestStatus> activeNextStates = stateMachine.getValidNextStates(ContestStatus.ACTIVE);
        assertEquals(3, activeNextStates.size());
        assertTrue(activeNextStates.contains(ContestStatus.PAUSED));
        assertTrue(activeNextStates.contains(ContestStatus.CLOSED));
        assertTrue(activeNextStates.contains(ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should correctly identify final states")
    void shouldCorrectlyIdentifyFinalStates() {
        assertTrue(stateMachine.isFinalState(ContestStatus.CANCELLED));
        assertTrue(stateMachine.isFinalState(ContestStatus.ARCHIVED));
        assertFalse(stateMachine.isFinalState(ContestStatus.DRAFT));
        assertFalse(stateMachine.isFinalState(ContestStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should correctly identify states that allow inscriptions")
    void shouldCorrectlyIdentifyStatesAllowingInscriptions() {
        // Estados que permiten inscripciones
        assertTrue(stateMachine.allowsInscriptions(ContestStatus.PUBLISHED));
        assertTrue(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_OPEN));

        // Estados legacy que permiten inscripciones (deprecados)
        assertTrue(stateMachine.allowsInscriptions(ContestStatus.ACTIVE));

        // Estados que NO permiten inscripciones
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.DRAFT));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_PENDING));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.INSCRIPTION_CLOSED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.IN_EVALUATION));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.RESULTS_PUBLISHED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.FINISHED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.CANCELLED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.ARCHIVED));

        // Estados legacy que NO permiten inscripciones
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.CLOSED));
        assertFalse(stateMachine.allowsInscriptions(ContestStatus.IN_PROGRESS));
    }

    @Test
    @DisplayName("Should correctly identify active statuses")
    void shouldCorrectlyIdentifyActiveStatuses() {
        assertTrue(stateMachine.isActiveStatus(ContestStatus.ACTIVE));
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

        String activeDescription = stateMachine.getStatusDescription(ContestStatus.ACTIVE);
        assertNotNull(activeDescription);
        assertTrue(activeDescription.contains("activo"));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValuesGracefully() {
        assertFalse(stateMachine.canTransition(null, ContestStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(ContestStatus.DRAFT, null));
        assertFalse(stateMachine.canTransition(null, null));
    }

    @Test
    @DisplayName("Should support legacy IN_PROGRESS state")
    void shouldSupportLegacyInProgressState() {
        assertTrue(stateMachine.canTransition(ContestStatus.IN_PROGRESS, ContestStatus.CLOSED));
        assertTrue(stateMachine.canTransition(ContestStatus.IN_PROGRESS, ContestStatus.CANCELLED));
        assertFalse(stateMachine.canTransition(ContestStatus.IN_PROGRESS, ContestStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should return all statuses")
    void shouldReturnAllStatuses() {
        Set<ContestStatus> allStatuses = stateMachine.getAllStatuses();
        assertFalse(allStatuses.isEmpty());
        assertTrue(allStatuses.contains(ContestStatus.DRAFT));
        assertTrue(allStatuses.contains(ContestStatus.ACTIVE));
        assertTrue(allStatuses.contains(ContestStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should return non-final statuses")
    void shouldReturnNonFinalStatuses() {
        Set<ContestStatus> nonFinalStatuses = stateMachine.getNonFinalStatuses();
        assertTrue(nonFinalStatuses.contains(ContestStatus.DRAFT));
        assertTrue(nonFinalStatuses.contains(ContestStatus.ACTIVE));
        assertFalse(nonFinalStatuses.contains(ContestStatus.CANCELLED));
        assertFalse(nonFinalStatuses.contains(ContestStatus.ARCHIVED));
    }
}
