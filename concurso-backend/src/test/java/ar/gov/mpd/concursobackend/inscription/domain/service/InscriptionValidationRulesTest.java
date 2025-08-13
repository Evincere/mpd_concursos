package ar.gov.mpd.concursobackend.inscription.domain.service;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para InscriptionValidationRules
 * Verifica que las reglas centralizadas de validación funcionen correctamente
 */
class InscriptionValidationRulesTest {
    
    private InscriptionValidationRules validationRules;
    
    @BeforeEach
    void setUp() {
        validationRules = new InscriptionValidationRules();
    }
    
    @Test
    void validatePreferences_WhenAllValid_ShouldReturnNoErrors() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Primera", "Tercera"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .termsAcceptanceDate(LocalDateTime.now())
            .dataConfirmationDate(LocalDateTime.now())
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertTrue(errors.isEmpty(), "No debería haber errores para preferencias válidas");
        assertTrue(validationRules.arePreferencesComplete(preferences), "Las preferencias deberían estar completas");
    }
    
    @Test
    void validatePreferences_WhenNull_ShouldReturnError() {
        // Act
        List<String> errors = validationRules.validatePreferences(null);
        
        // Assert
        assertEquals(1, errors.size());
        assertEquals("Las preferencias de inscripción son requeridas", errors.get(0));
    }
    
    @Test
    void validatePreferences_WhenCentroDeVidaEmpty_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("")
            .selectedCircunscripciones(Set.of("Primera"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("centro de vida")));
    }
    
    @Test
    void validatePreferences_WhenCentroDeVidaTooShort_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Corto")
            .selectedCircunscripciones(Set.of("Primera"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("al menos 10 caracteres")));
    }
    
    @Test
    void validatePreferences_WhenNoCircunscripciones_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of())
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("al menos una circunscripción")));
    }
    
    @Test
    void validatePreferences_WhenTermsNotAccepted_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Primera"))
            .acceptedTerms(false)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("términos y condiciones")));
    }
    
    @Test
    void validatePreferences_WhenDataNotConfirmed_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Primera"))
            .acceptedTerms(true)
            .confirmedPersonalData(false)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("datos personales")));
    }
    
    @Test
    void validatePreferences_WhenValidSegundaCircunscripcionWithDepartments_ShouldReturnNoErrors() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Primera", "Segunda:San Rafael", "Segunda:General Alvear"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertTrue(errors.isEmpty(), "No debería haber errores para departamentos válidos de Segunda Circunscripción");
    }
    
    @Test
    void validatePreferences_WhenInvalidDepartmentForSegunda_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Segunda:Departamento Inexistente"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("Departamento inválido")));
    }
    
    @Test
    void validatePreferences_WhenDepartmentForNonSegunda_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Primera:San Rafael"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("no permite selección de departamentos")));
    }
    
    @Test
    void validatePreferences_WhenInvalidCircunscripcion_ShouldReturnError() {
        // Arrange
        InscriptionPreferences preferences = InscriptionPreferences.builder()
            .centroDeVida("Calle Falsa 123, Ciudad, Mendoza")
            .selectedCircunscripciones(Set.of("Quinta"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .build();
        
        // Act
        List<String> errors = validationRules.validatePreferences(preferences);
        
        // Assert
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(error -> error.contains("Circunscripción inválida")));
    }
    
    @Test
    void getRequiredDocumentTypes_ShouldReturnExpectedTypes() {
        // Act
        Set<String> requiredTypes = validationRules.getRequiredDocumentTypes();
        
        // Assert
        assertEquals(5, requiredTypes.size());
        assertTrue(requiredTypes.contains("dni-frontal"));
        assertTrue(requiredTypes.contains("dni-dorso"));
        assertTrue(requiredTypes.contains("cuil"));
        assertTrue(requiredTypes.contains("antecedentes-penales"));
        assertTrue(requiredTypes.contains("certificado-profesional"));
    }
    
    @Test
    void getDocumentTypeDisplayName_ShouldReturnCorrectNames() {
        // Act & Assert
        assertEquals("DNI (frente)", validationRules.getDocumentTypeDisplayName("dni-frontal"));
        assertEquals("DNI (dorso)", validationRules.getDocumentTypeDisplayName("dni-dorso"));
        assertEquals("Constancia de CUIL", validationRules.getDocumentTypeDisplayName("cuil"));
        assertEquals("Certificado de antecedentes penales", validationRules.getDocumentTypeDisplayName("antecedentes-penales"));
        assertEquals("Certificado profesional", validationRules.getDocumentTypeDisplayName("certificado-profesional"));
        assertEquals("unknown-type", validationRules.getDocumentTypeDisplayName("unknown-type"));
    }
}
