package ar.gov.mpd.concursobackend.inscription.infrastructure.controller;

import ar.gov.mpd.concursobackend.inscription.application.dto.CompletenessValidationResult;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionCompletenessValidationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests para InscriptionValidationController
 */
@WebMvcTest(InscriptionValidationController.class)
class InscriptionValidationControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private InscriptionCompletenessValidationService completenessValidationService;
    
    private UUID testInscriptionId;
    
    @BeforeEach
    void setUp() {
        testInscriptionId = UUID.randomUUID();
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void validateCompleteness_WhenInscriptionComplete_ShouldReturnCompleteResult() throws Exception {
        // Arrange
        CompletenessValidationResult completeResult = CompletenessValidationResult.builder()
            .complete(true)
            .centroDeVida("Calle Falsa 123, Mendoza")
            .selectedCircunscripciones(Set.of("Primera", "Segunda"))
            .acceptedTerms(true)
            .confirmedPersonalData(true)
            .issues(List.of())
            .missingDocuments(List.of())
            .hasAllRequiredDocuments(true)
            .message("Su inscripción está completa y puede ser finalizada")
            .statusCode("COMPLETE")
            .build();
        
        when(completenessValidationService.validateCompleteness(any(UUID.class)))
            .thenReturn(completeResult);
        
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/{inscriptionId}/completeness", testInscriptionId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complete").value(true))
            .andExpect(jsonPath("$.centroDeVida").value("Calle Falsa 123, Mendoza"))
            .andExpect(jsonPath("$.selectedCircunscripciones").isArray())
            .andExpect(jsonPath("$.acceptedTerms").value(true))
            .andExpect(jsonPath("$.confirmedPersonalData").value(true))
            .andExpect(jsonPath("$.hasAllRequiredDocuments").value(true))
            .andExpect(jsonPath("$.statusCode").value("COMPLETE"));
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void validateCompleteness_WhenInscriptionIncomplete_ShouldReturnIncompleteResult() throws Exception {
        // Arrange
        CompletenessValidationResult incompleteResult = CompletenessValidationResult.builder()
            .complete(false)
            .centroDeVida(null)
            .selectedCircunscripciones(Set.of())
            .acceptedTerms(false)
            .confirmedPersonalData(false)
            .issues(List.of("Debe especificar su centro de vida", "Debe seleccionar al menos una circunscripción"))
            .missingDocuments(List.of("DNI (frente)", "DNI (dorso)"))
            .hasAllRequiredDocuments(false)
            .message("Su inscripción requiere completar los siguientes elementos")
            .statusCode("INCOMPLETE")
            .build();
        
        when(completenessValidationService.validateCompleteness(any(UUID.class)))
            .thenReturn(incompleteResult);
        
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/{inscriptionId}/completeness", testInscriptionId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complete").value(false))
            .andExpect(jsonPath("$.issues").isArray())
            .andExpect(jsonPath("$.issues.length()").value(2))
            .andExpect(jsonPath("$.missingDocuments").isArray())
            .andExpect(jsonPath("$.missingDocuments.length()").value(2))
            .andExpect(jsonPath("$.hasAllRequiredDocuments").value(false))
            .andExpect(jsonPath("$.statusCode").value("INCOMPLETE"));
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void validateCompleteness_WhenInscriptionNotFound_ShouldReturn404() throws Exception {
        // Arrange
        CompletenessValidationResult notFoundResult = CompletenessValidationResult.builder()
            .complete(false)
            .message("Inscripción no encontrada")
            .statusCode("NOT_FOUND")
            .issues(List.of("La inscripción especificada no existe"))
            .build();
        
        when(completenessValidationService.validateCompleteness(any(UUID.class)))
            .thenReturn(notFoundResult);
        
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/{inscriptionId}/completeness", testInscriptionId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void validateCompleteness_WhenForbidden_ShouldReturn403() throws Exception {
        // Arrange
        CompletenessValidationResult forbiddenResult = CompletenessValidationResult.builder()
            .complete(false)
            .message("No tiene permisos para validar esta inscripción")
            .statusCode("FORBIDDEN")
            .issues(List.of("No tiene permisos para acceder a esta inscripción"))
            .build();
        
        when(completenessValidationService.validateCompleteness(any(UUID.class)))
            .thenReturn(forbiddenResult);
        
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/{inscriptionId}/completeness", testInscriptionId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void healthCheck_ShouldReturnOk() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/health")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(content().string("Inscription validation service is healthy"));
    }
    
    @Test
    void validateCompleteness_WhenNotAuthenticated_ShouldReturn401() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/inscriptions/validation/{inscriptionId}/completeness", testInscriptionId)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }
}
