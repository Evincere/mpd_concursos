package ar.gov.mpd.concursobackend.education.unit;

import ar.gov.mpd.concursobackend.education.domain.model.EducationType;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for Education enum mapping and business rules validation
 * Tests the corrected enum mappings and business logic
 */
class EducationEnumMappingTest {

    @Test
    @DisplayName("Should map all education types bidirectionally")
    void shouldMapAllEducationTypesBidirectionally() {
        // Test that all domain enum values have corresponding persistence mappings
        for (EducationType domainType : EducationType.values()) {
            // Verify that getPersistenceType() doesn't throw exception
            EducationRecordEntity.EducationType persistenceType = domainType.getPersistenceType();
            assertThat(persistenceType).isNotNull();
            
            // Verify bidirectional mapping
            EducationType mappedBack = EducationType.fromPersistenceType(persistenceType);
            assertThat(mappedBack).isEqualTo(domainType);
        }
    }

    @Test
    @DisplayName("Should map all education statuses bidirectionally")
    void shouldMapAllEducationStatusesBidirectionally() {
        for (EducationStatus domainStatus : EducationStatus.values()) {
            // Verify that getPersistenceStatus() doesn't throw exception
            EducationRecordEntity.EducationStatus persistenceStatus = domainStatus.getPersistenceStatus();
            assertThat(persistenceStatus).isNotNull();
            
            // Verify bidirectional mapping
            EducationStatus mappedBack = EducationStatus.fromPersistenceStatus(persistenceStatus);
            assertThat(mappedBack).isEqualTo(domainStatus);
        }
    }

    @Test
    @DisplayName("Should validate education type display names according to business rules")
    void shouldValidateEducationTypeDisplayNames() {
        // Verify that display names match business requirements exactly
        assertThat(EducationType.HIGHER_EDUCATION_CAREER.getDisplayName())
                .isEqualTo("Carrera de Nivel Superior");
        
        assertThat(EducationType.UNDERGRADUATE_CAREER.getDisplayName())
                .isEqualTo("Carrera de grado");
        
        assertThat(EducationType.POSTGRADUATE_SPECIALIZATION.getDisplayName())
                .isEqualTo("Posgrado: especialización");
        
        assertThat(EducationType.POSTGRADUATE_MASTERS.getDisplayName())
                .isEqualTo("Posgrado: maestría");
        
        assertThat(EducationType.POSTGRADUATE_DOCTORATE.getDisplayName())
                .isEqualTo("Posgrado: doctorado");
        
        assertThat(EducationType.DIPLOMA.getDisplayName())
                .isEqualTo("Diplomatura");
        
        assertThat(EducationType.TRAINING_COURSE.getDisplayName())
                .isEqualTo("Curso de Capacitación");
        
        assertThat(EducationType.SCIENTIFIC_ACTIVITY.getDisplayName())
                .isEqualTo("Actividad Científica (investigación y/o difusión)");
    }

    @Test
    @DisplayName("Should validate education status display names")
    void shouldValidateEducationStatusDisplayNames() {
        assertThat(EducationStatus.IN_PROGRESS.getDisplayName())
                .isEqualTo("en proceso");
        
        assertThat(EducationStatus.COMPLETED.getDisplayName())
                .isEqualTo("finalizado");
    }

    @Test
    @DisplayName("Should validate scientific activity type display names")
    void shouldValidateScientificActivityTypeDisplayNames() {
        assertThat(ScientificActivityType.RESEARCH.getDisplayName())
                .isEqualTo("investigación");
        
        assertThat(ScientificActivityType.PRESENTATION.getDisplayName())
                .isEqualTo("ponencia");
        
        assertThat(ScientificActivityType.PUBLICATION.getDisplayName())
                .isEqualTo("publicación");
    }

    @Test
    @DisplayName("Should validate corrected scientific activity role display names")
    void shouldValidateCorrectedScientificActivityRoleDisplayNames() {
        // Test the corrected role values according to business rules
        assertThat(ScientificActivityRole.ASSISTANT_PARTICIPANT.getDisplayName())
                .isEqualTo("ayudante-participante");
        
        assertThat(ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER.getDisplayName())
                .isEqualTo("autor-disertante-panelista-exponente");
    }

    @Test
    @DisplayName("Should find education types by display name")
    void shouldFindEducationTypesByDisplayName() {
        // Test that fromDisplayName works correctly for all types
        for (EducationType type : EducationType.values()) {
            EducationType found = EducationType.fromDisplayName(type.getDisplayName());
            assertThat(found).isEqualTo(type);
        }
    }

    @Test
    @DisplayName("Should find education statuses by display name")
    void shouldFindEducationStatusesByDisplayName() {
        // Test that fromDisplayName works correctly for all statuses
        for (EducationStatus status : EducationStatus.values()) {
            EducationStatus found = EducationStatus.fromDisplayName(status.getDisplayName());
            assertThat(found).isEqualTo(status);
        }
    }

    @Test
    @DisplayName("Should find scientific activity types by display name")
    void shouldFindScientificActivityTypesByDisplayName() {
        // Test that fromDisplayName works correctly for all activity types
        for (ScientificActivityType type : ScientificActivityType.values()) {
            ScientificActivityType found = ScientificActivityType.fromDisplayName(type.getDisplayName());
            assertThat(found).isEqualTo(type);
        }
    }

    @Test
    @DisplayName("Should find scientific activity roles by display name")
    void shouldFindScientificActivityRolesByDisplayName() {
        // Test that fromDisplayName works correctly for all roles
        for (ScientificActivityRole role : ScientificActivityRole.values()) {
            ScientificActivityRole found = ScientificActivityRole.fromDisplayName(role.getDisplayName());
            assertThat(found).isEqualTo(role);
        }
    }

    @Test
    @DisplayName("Should throw exception for invalid education type display name")
    void shouldThrowExceptionForInvalidEducationTypeDisplayName() {
        assertThatThrownBy(() -> EducationType.fromDisplayName("Invalid Type"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de educación inválido");
    }

    @Test
    @DisplayName("Should throw exception for invalid education status display name")
    void shouldThrowExceptionForInvalidEducationStatusDisplayName() {
        assertThatThrownBy(() -> EducationStatus.fromDisplayName("Invalid Status"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Estado de educación inválido");
    }

    @Test
    @DisplayName("Should throw exception for invalid scientific activity type display name")
    void shouldThrowExceptionForInvalidScientificActivityTypeDisplayName() {
        assertThatThrownBy(() -> ScientificActivityType.fromDisplayName("Invalid Activity"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de actividad científica inválido");
    }

    @Test
    @DisplayName("Should throw exception for invalid scientific activity role display name")
    void shouldThrowExceptionForInvalidScientificActivityRoleDisplayName() {
        assertThatThrownBy(() -> ScientificActivityRole.fromDisplayName("Invalid Role"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rol de actividad científica inválido");
    }

    @Test
    @DisplayName("Should validate specific business rule mappings")
    void shouldValidateSpecificBusinessRuleMappings() {
        // Test specific mappings according to corrected business rules
        
        // Higher Education Career should map to TECHNICAL_DEGREE
        assertThat(EducationType.HIGHER_EDUCATION_CAREER.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.TECHNICAL_DEGREE);
        
        // Undergraduate Career should map to UNIVERSITY_DEGREE
        assertThat(EducationType.UNDERGRADUATE_CAREER.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.UNIVERSITY_DEGREE);
        
        // Postgraduate Specialization should map to POSTGRADUATE_DEGREE
        assertThat(EducationType.POSTGRADUATE_SPECIALIZATION.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.POSTGRADUATE_DEGREE);
        
        // Masters should map to MASTER_DEGREE
        assertThat(EducationType.POSTGRADUATE_MASTERS.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.MASTER_DEGREE);
        
        // Doctorate should map to DOCTORAL_DEGREE
        assertThat(EducationType.POSTGRADUATE_DOCTORATE.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.DOCTORAL_DEGREE);
        
        // Scientific Activity should map to SCIENTIFIC_ACTIVITY
        assertThat(EducationType.SCIENTIFIC_ACTIVITY.getPersistenceType())
                .isEqualTo(EducationRecordEntity.EducationType.SCIENTIFIC_ACTIVITY);
    }

    @Test
    @DisplayName("Should validate that all enum values are covered")
    void shouldValidateAllEnumValuesAreCovered() {
        // Ensure we have the expected number of enum values
        assertThat(EducationType.values()).hasSize(9);
        assertThat(EducationStatus.values()).hasSize(2);
        assertThat(ScientificActivityType.values()).hasSize(3);
        assertThat(ScientificActivityRole.values()).hasSize(2);
    }

    @Test
    @DisplayName("Should validate enum consistency after corrections")
    void shouldValidateEnumConsistencyAfterCorrections() {
        // This test validates that our corrections maintain consistency
        
        // All domain types should have persistence mappings
        for (EducationType domainType : EducationType.values()) {
            assertThat(domainType.getPersistenceType()).isNotNull();
            assertThat(domainType.getDisplayName()).isNotBlank();
        }
        
        // All domain statuses should have persistence mappings
        for (EducationStatus domainStatus : EducationStatus.values()) {
            assertThat(domainStatus.getPersistenceStatus()).isNotNull();
            assertThat(domainStatus.getDisplayName()).isNotBlank();
        }
        
        // All scientific activity types should have display names
        for (ScientificActivityType activityType : ScientificActivityType.values()) {
            assertThat(activityType.getDisplayName()).isNotBlank();
        }
        
        // All scientific activity roles should have display names
        for (ScientificActivityRole activityRole : ScientificActivityRole.values()) {
            assertThat(activityRole.getDisplayName()).isNotBlank();
        }
    }
}
