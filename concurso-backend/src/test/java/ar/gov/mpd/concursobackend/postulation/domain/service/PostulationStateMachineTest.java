package ar.gov.mpd.concursobackend.postulation.domain.service;

import ar.gov.mpd.concursobackend.postulation.domain.enums.PostulationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Postulation State Machine Tests")
class PostulationStateMachineTest {

    private PostulationStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new PostulationStateMachine();
    }

    @Test
    @DisplayName("Should allow valid transitions from ACTIVE")
    void shouldAllowValidTransitionsFromActive() {
        assertTrue(stateMachine.canTransition(PostulationStatus.ACTIVE, PostulationStatus.PENDING));
        assertTrue(stateMachine.canTransition(PostulationStatus.ACTIVE, PostulationStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should reject invalid transitions from ACTIVE")
    void shouldRejectInvalidTransitionsFromActive() {
        assertFalse(stateMachine.canTransition(PostulationStatus.ACTIVE, PostulationStatus.APPROVED));
        assertFalse(stateMachine.canTransition(PostulationStatus.ACTIVE, PostulationStatus.REJECTED));
    }

    @Test
    @DisplayName("Should allow valid transitions from PENDING")
    void shouldAllowValidTransitionsFromPending() {
        assertTrue(stateMachine.canTransition(PostulationStatus.PENDING, PostulationStatus.APPROVED));
        assertTrue(stateMachine.canTransition(PostulationStatus.PENDING, PostulationStatus.REJECTED));
        assertTrue(stateMachine.canTransition(PostulationStatus.PENDING, PostulationStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should not allow transitions from final states")
    void shouldNotAllowTransitionsFromFinalStates() {
        assertFalse(stateMachine.canTransition(PostulationStatus.APPROVED, PostulationStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(PostulationStatus.REJECTED, PostulationStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(PostulationStatus.CANCELLED, PostulationStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should validate transitions and throw exception for invalid ones")
    void shouldValidateTransitionsAndThrowException() {
        assertDoesNotThrow(() -> stateMachine.validateTransition(PostulationStatus.ACTIVE, PostulationStatus.PENDING));
        
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> stateMachine.validateTransition(PostulationStatus.APPROVED, PostulationStatus.ACTIVE));
        
        assertTrue(exception.getMessage().contains("Invalid postulation state transition"));
    }

    @Test
    @DisplayName("Should return correct valid next states")
    void shouldReturnCorrectValidNextStates() {
        Set<PostulationStatus> activeNextStates = stateMachine.getValidNextStates(PostulationStatus.ACTIVE);
        assertEquals(2, activeNextStates.size());
        assertTrue(activeNextStates.contains(PostulationStatus.PENDING));
        assertTrue(activeNextStates.contains(PostulationStatus.CANCELLED));

        Set<PostulationStatus> pendingNextStates = stateMachine.getValidNextStates(PostulationStatus.PENDING);
        assertEquals(3, pendingNextStates.size());
        assertTrue(pendingNextStates.contains(PostulationStatus.APPROVED));
        assertTrue(pendingNextStates.contains(PostulationStatus.REJECTED));
        assertTrue(pendingNextStates.contains(PostulationStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should correctly identify final states")
    void shouldCorrectlyIdentifyFinalStates() {
        assertTrue(stateMachine.isFinalState(PostulationStatus.APPROVED));
        assertTrue(stateMachine.isFinalState(PostulationStatus.REJECTED));
        assertTrue(stateMachine.isFinalState(PostulationStatus.CANCELLED));
        assertFalse(stateMachine.isFinalState(PostulationStatus.ACTIVE));
        assertFalse(stateMachine.isFinalState(PostulationStatus.PENDING));
    }

    @Test
    @DisplayName("Should correctly identify states allowing document upload")
    void shouldCorrectlyIdentifyStatesAllowingDocumentUpload() {
        assertTrue(stateMachine.allowsDocumentUpload(PostulationStatus.ACTIVE));
        assertFalse(stateMachine.allowsDocumentUpload(PostulationStatus.PENDING));
        assertFalse(stateMachine.allowsDocumentUpload(PostulationStatus.APPROVED));
        assertFalse(stateMachine.allowsDocumentUpload(PostulationStatus.REJECTED));
    }

    @Test
    @DisplayName("Should correctly identify states allowing admin review")
    void shouldCorrectlyIdentifyStatesAllowingAdminReview() {
        assertTrue(stateMachine.allowsAdminReview(PostulationStatus.PENDING));
        assertFalse(stateMachine.allowsAdminReview(PostulationStatus.ACTIVE));
        assertFalse(stateMachine.allowsAdminReview(PostulationStatus.APPROVED));
        assertFalse(stateMachine.allowsAdminReview(PostulationStatus.REJECTED));
    }

    @Test
    @DisplayName("Should correctly identify resumable states")
    void shouldCorrectlyIdentifyResumableStates() {
        assertTrue(stateMachine.isResumable(PostulationStatus.ACTIVE));
        assertFalse(stateMachine.isResumable(PostulationStatus.PENDING));
        assertFalse(stateMachine.isResumable(PostulationStatus.APPROVED));
        assertFalse(stateMachine.isResumable(PostulationStatus.REJECTED));
    }

    @Test
    @DisplayName("Should correctly identify states requiring admin action")
    void shouldCorrectlyIdentifyStatesRequiringAdminAction() {
        assertTrue(stateMachine.requiresAdminAction(PostulationStatus.PENDING));
        assertFalse(stateMachine.requiresAdminAction(PostulationStatus.ACTIVE));
        assertFalse(stateMachine.requiresAdminAction(PostulationStatus.APPROVED));
        assertFalse(stateMachine.requiresAdminAction(PostulationStatus.REJECTED));
    }

    @Test
    @DisplayName("Should provide status descriptions")
    void shouldProvideStatusDescriptions() {
        String activeDescription = stateMachine.getStatusDescription(PostulationStatus.ACTIVE);
        assertNotNull(activeDescription);
        assertTrue(activeDescription.contains("proceso"));

        String pendingDescription = stateMachine.getStatusDescription(PostulationStatus.PENDING);
        assertNotNull(pendingDescription);
        assertTrue(pendingDescription.contains("pendiente"));

        String approvedDescription = stateMachine.getStatusDescription(PostulationStatus.APPROVED);
        assertNotNull(approvedDescription);
        assertTrue(approvedDescription.contains("aprobada"));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValuesGracefully() {
        assertFalse(stateMachine.canTransition(null, PostulationStatus.ACTIVE));
        assertFalse(stateMachine.canTransition(PostulationStatus.ACTIVE, null));
        assertFalse(stateMachine.canTransition(null, null));
    }

    @Test
    @DisplayName("Should return all statuses")
    void shouldReturnAllStatuses() {
        Set<PostulationStatus> allStatuses = stateMachine.getAllStatuses();
        assertFalse(allStatuses.isEmpty());
        assertTrue(allStatuses.contains(PostulationStatus.ACTIVE));
        assertTrue(allStatuses.contains(PostulationStatus.PENDING));
        assertTrue(allStatuses.contains(PostulationStatus.APPROVED));
        assertTrue(allStatuses.contains(PostulationStatus.REJECTED));
        assertTrue(allStatuses.contains(PostulationStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should return non-final statuses")
    void shouldReturnNonFinalStatuses() {
        Set<PostulationStatus> nonFinalStatuses = stateMachine.getNonFinalStatuses();
        assertTrue(nonFinalStatuses.contains(PostulationStatus.ACTIVE));
        assertTrue(nonFinalStatuses.contains(PostulationStatus.PENDING));
        assertFalse(nonFinalStatuses.contains(PostulationStatus.APPROVED));
        assertFalse(nonFinalStatuses.contains(PostulationStatus.REJECTED));
        assertFalse(nonFinalStatuses.contains(PostulationStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should test PostulationStatus enum methods")
    void shouldTestPostulationStatusEnumMethods() {
        // Test isActive
        assertTrue(PostulationStatus.ACTIVE.isActive());
        assertFalse(PostulationStatus.PENDING.isActive());

        // Test isFinalState
        assertTrue(PostulationStatus.APPROVED.isFinalState());
        assertTrue(PostulationStatus.REJECTED.isFinalState());
        assertTrue(PostulationStatus.CANCELLED.isFinalState());
        assertFalse(PostulationStatus.ACTIVE.isFinalState());

        // Test allowsModifications
        assertTrue(PostulationStatus.ACTIVE.allowsModifications());
        assertFalse(PostulationStatus.PENDING.allowsModifications());

        // Test isSuccessful
        assertTrue(PostulationStatus.APPROVED.isSuccessful());
        assertFalse(PostulationStatus.REJECTED.isSuccessful());
    }

    @Test
    @DisplayName("Should test PostulationStatus fromString method")
    void shouldTestPostulationStatusFromString() {
        assertEquals(PostulationStatus.ACTIVE, PostulationStatus.fromString("ACTIVE"));
        assertEquals(PostulationStatus.PENDING, PostulationStatus.fromString("pending"));
        assertEquals(PostulationStatus.APPROVED, PostulationStatus.fromString("Approved"));

        assertThrows(IllegalArgumentException.class, () -> PostulationStatus.fromString("INVALID"));
        assertThrows(IllegalArgumentException.class, () -> PostulationStatus.fromString(""));
    }
}
