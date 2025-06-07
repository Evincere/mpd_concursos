package ar.gov.mpd.concursobackend.inscription.domain.service;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Inscription State Machine Tests")
class InscriptionStateMachineTest {

    private InscriptionStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new InscriptionStateMachine();
    }

    @Test
    @DisplayName("Should allow valid transitions from ACTIVE")
    void shouldAllowValidTransitionsFromActive() {
        assertTrue(stateMachine.canTransition(InscriptionState.ACTIVE, InscriptionState.COMPLETED_WITH_DOCS));
        assertTrue(stateMachine.canTransition(InscriptionState.ACTIVE, InscriptionState.COMPLETED_PENDING_DOCS));
        assertTrue(stateMachine.canTransition(InscriptionState.ACTIVE, InscriptionState.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from COMPLETED_WITH_DOCS")
    void shouldAllowValidTransitionsFromCompletedWithDocs() {
        assertTrue(stateMachine.canTransition(InscriptionState.COMPLETED_WITH_DOCS, InscriptionState.PENDING));
        assertTrue(stateMachine.canTransition(InscriptionState.COMPLETED_WITH_DOCS, InscriptionState.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from COMPLETED_PENDING_DOCS")
    void shouldAllowValidTransitionsFromCompletedPendingDocs() {
        assertTrue(stateMachine.canTransition(InscriptionState.COMPLETED_PENDING_DOCS, InscriptionState.COMPLETED_WITH_DOCS));
        assertTrue(stateMachine.canTransition(InscriptionState.COMPLETED_PENDING_DOCS, InscriptionState.FROZEN));
        assertTrue(stateMachine.canTransition(InscriptionState.COMPLETED_PENDING_DOCS, InscriptionState.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PENDING")
    void shouldAllowValidTransitionsFromPending() {
        assertTrue(stateMachine.canTransition(InscriptionState.PENDING, InscriptionState.APPROVED));
        assertTrue(stateMachine.canTransition(InscriptionState.PENDING, InscriptionState.REJECTED));
        assertTrue(stateMachine.canTransition(InscriptionState.PENDING, InscriptionState.CANCELLED));
    }

    @Test
    @DisplayName("Should allow valid transitions from FROZEN")
    void shouldAllowValidTransitionsFromFrozen() {
        assertTrue(stateMachine.canTransition(InscriptionState.FROZEN, InscriptionState.REJECTED));
    }

    @Test
    @DisplayName("Should not allow transitions from final states")
    void shouldNotAllowTransitionsFromFinalStates() {
        assertFalse(stateMachine.canTransition(InscriptionState.APPROVED, InscriptionState.ACTIVE));
        assertFalse(stateMachine.canTransition(InscriptionState.REJECTED, InscriptionState.ACTIVE));
        assertFalse(stateMachine.canTransition(InscriptionState.CANCELLED, InscriptionState.ACTIVE));
    }

    @Test
    @DisplayName("Should validate transitions and throw exception for invalid ones")
    void shouldValidateTransitionsAndThrowException() {
        assertDoesNotThrow(() -> stateMachine.validateTransition(InscriptionState.ACTIVE, InscriptionState.COMPLETED_WITH_DOCS));
        
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> stateMachine.validateTransition(InscriptionState.APPROVED, InscriptionState.ACTIVE));
        
        assertTrue(exception.getMessage().contains("Invalid inscription state transition"));
    }

    @Test
    @DisplayName("Should correctly identify states allowing document upload")
    void shouldCorrectlyIdentifyStatesAllowingDocumentUpload() {
        assertTrue(stateMachine.allowsDocumentUpload(InscriptionState.ACTIVE));
        assertTrue(stateMachine.allowsDocumentUpload(InscriptionState.COMPLETED_PENDING_DOCS));
        assertFalse(stateMachine.allowsDocumentUpload(InscriptionState.PENDING));
        assertFalse(stateMachine.allowsDocumentUpload(InscriptionState.APPROVED));
    }

    @Test
    @DisplayName("Should correctly identify resumable states")
    void shouldCorrectlyIdentifyResumableStates() {
        assertTrue(stateMachine.isResumable(InscriptionState.ACTIVE));
        assertTrue(stateMachine.isResumable(InscriptionState.COMPLETED_PENDING_DOCS));
        assertFalse(stateMachine.isResumable(InscriptionState.PENDING));
        assertFalse(stateMachine.isResumable(InscriptionState.APPROVED));
    }

    @Test
    @DisplayName("Should correctly identify states allowing admin review")
    void shouldCorrectlyIdentifyStatesAllowingAdminReview() {
        assertTrue(stateMachine.allowsAdminReview(InscriptionState.PENDING));
        assertFalse(stateMachine.allowsAdminReview(InscriptionState.ACTIVE));
        assertFalse(stateMachine.allowsAdminReview(InscriptionState.APPROVED));
    }

    @Test
    @DisplayName("Should correctly identify states requiring admin action")
    void shouldCorrectlyIdentifyStatesRequiringAdminAction() {
        assertTrue(stateMachine.requiresAdminAction(InscriptionState.PENDING));
        assertFalse(stateMachine.requiresAdminAction(InscriptionState.ACTIVE));
        assertFalse(stateMachine.requiresAdminAction(InscriptionState.APPROVED));
    }

    @Test
    @DisplayName("Should correctly identify states ready for validation")
    void shouldCorrectlyIdentifyStatesReadyForValidation() {
        assertTrue(stateMachine.isReadyForValidation(InscriptionState.COMPLETED_WITH_DOCS));
        assertFalse(stateMachine.isReadyForValidation(InscriptionState.ACTIVE));
        assertFalse(stateMachine.isReadyForValidation(InscriptionState.COMPLETED_PENDING_DOCS));
    }

    @Test
    @DisplayName("Should correctly identify states with pending documentation")
    void shouldCorrectlyIdentifyStatesWithPendingDocumentation() {
        assertTrue(stateMachine.hasPendingDocumentation(InscriptionState.COMPLETED_PENDING_DOCS));
        assertFalse(stateMachine.hasPendingDocumentation(InscriptionState.COMPLETED_WITH_DOCS));
        assertFalse(stateMachine.hasPendingDocumentation(InscriptionState.ACTIVE));
    }

    @Test
    @DisplayName("Should provide correct automatic state transitions")
    void shouldProvideCorrectAutomaticStateTransitions() {
        // ACTIVE with all documents should go to COMPLETED_WITH_DOCS
        assertEquals(InscriptionState.COMPLETED_WITH_DOCS, 
            stateMachine.getNextAutomaticState(InscriptionState.ACTIVE, true));
        
        // ACTIVE without all documents should go to COMPLETED_PENDING_DOCS
        assertEquals(InscriptionState.COMPLETED_PENDING_DOCS, 
            stateMachine.getNextAutomaticState(InscriptionState.ACTIVE, false));
        
        // COMPLETED_WITH_DOCS should auto-transition to PENDING
        assertEquals(InscriptionState.PENDING, 
            stateMachine.getNextAutomaticState(InscriptionState.COMPLETED_WITH_DOCS, true));
        
        // FROZEN should auto-transition to REJECTED
        assertEquals(InscriptionState.REJECTED, 
            stateMachine.getNextAutomaticState(InscriptionState.FROZEN, false));
    }

    @Test
    @DisplayName("Should correctly determine when auto-transition should occur")
    void shouldCorrectlyDetermineWhenAutoTransitionShouldOccur() {
        assertTrue(stateMachine.shouldAutoTransition(InscriptionState.ACTIVE, true));
        assertTrue(stateMachine.shouldAutoTransition(InscriptionState.ACTIVE, false));
        assertTrue(stateMachine.shouldAutoTransition(InscriptionState.COMPLETED_WITH_DOCS, true));
        assertTrue(stateMachine.shouldAutoTransition(InscriptionState.FROZEN, false));
        
        assertFalse(stateMachine.shouldAutoTransition(InscriptionState.PENDING, true));
        assertFalse(stateMachine.shouldAutoTransition(InscriptionState.APPROVED, true));
    }

    @Test
    @DisplayName("Should provide status descriptions")
    void shouldProvideStatusDescriptions() {
        String activeDescription = stateMachine.getStatusDescription(InscriptionState.ACTIVE);
        assertNotNull(activeDescription);
        assertTrue(activeDescription.contains("proceso"));

        String pendingDescription = stateMachine.getStatusDescription(InscriptionState.PENDING);
        assertNotNull(pendingDescription);
        assertTrue(pendingDescription.contains("pendiente"));
    }

    @Test
    @DisplayName("Should correctly identify final states")
    void shouldCorrectlyIdentifyFinalStates() {
        assertTrue(stateMachine.isFinalState(InscriptionState.APPROVED));
        assertTrue(stateMachine.isFinalState(InscriptionState.REJECTED));
        assertTrue(stateMachine.isFinalState(InscriptionState.CANCELLED));
        assertFalse(stateMachine.isFinalState(InscriptionState.ACTIVE));
        assertFalse(stateMachine.isFinalState(InscriptionState.PENDING));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValuesGracefully() {
        assertFalse(stateMachine.canTransition(null, InscriptionState.ACTIVE));
        assertFalse(stateMachine.canTransition(InscriptionState.ACTIVE, null));
        assertFalse(stateMachine.canTransition(null, null));
    }

    @Test
    @DisplayName("Should return correct valid next states")
    void shouldReturnCorrectValidNextStates() {
        Set<InscriptionState> activeNextStates = stateMachine.getValidNextStates(InscriptionState.ACTIVE);
        assertEquals(3, activeNextStates.size());
        assertTrue(activeNextStates.contains(InscriptionState.COMPLETED_WITH_DOCS));
        assertTrue(activeNextStates.contains(InscriptionState.COMPLETED_PENDING_DOCS));
        assertTrue(activeNextStates.contains(InscriptionState.CANCELLED));

        Set<InscriptionState> pendingNextStates = stateMachine.getValidNextStates(InscriptionState.PENDING);
        assertEquals(3, pendingNextStates.size());
        assertTrue(pendingNextStates.contains(InscriptionState.APPROVED));
        assertTrue(pendingNextStates.contains(InscriptionState.REJECTED));
        assertTrue(pendingNextStates.contains(InscriptionState.CANCELLED));
    }
}
