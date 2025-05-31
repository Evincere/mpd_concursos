package ar.gov.mpd.concursobackend.inscription.infrastructure.controller;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class InscriptionSessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID testInscriptionId;
    private Long testContestId;
    private InscriptionSessionRequest testSessionRequest;
    private String authToken;

    @BeforeEach
    void setUp() {
        testInscriptionId = UUID.randomUUID();
        testContestId = 1L;

        // Configurar datos de prueba
        Map<String, Object> formData = new HashMap<>();
        formData.put("termsAccepted", true);
        formData.put("selectedCircunscripciones", List.of("Primera", "Segunda"));

        testSessionRequest = new InscriptionSessionRequest();
        testSessionRequest.setInscriptionId(testInscriptionId);
        testSessionRequest.setContestId(testContestId);
        testSessionRequest.setCurrentStep(InscriptionStep.TERMS_ACCEPTANCE);
        testSessionRequest.setFormData(formData);

        // En un entorno de prueba, podemos usar un token fijo
        authToken = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3VhcmlvMSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJ1c2VySWQiOiI0NDQ0NDQ0NC00NDQ0LTQ0NDQtNDQ0NC00NDQ0NDQ0NDQ0NDQiLCJpYXQiOjE2MTYxNjE2MTYsImV4cCI6MTYxNjE2MTYxN30.XYZ";
    }

    @Test
    @WithMockUser(username = "usuario1")
    void saveSession_ShouldCreateAndReturnSession() throws Exception {
        // Act
        MvcResult result = mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk())
                .andReturn();

        // Assert
        InscriptionSessionResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        assertNotNull(response);
        assertEquals(testInscriptionId, response.getInscriptionId());
        assertEquals(testContestId, response.getContestId());
        assertEquals(InscriptionStep.TERMS_ACCEPTANCE, response.getCurrentStep());
        assertNotNull(response.getId());

        // Verificar que podemos recuperar la sesión guardada
        mockMvc.perform(get("/api/inscription-sessions/{id}", response.getId())
                        .header("Authorization", authToken))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void getSessionById_ExistingSession_ShouldReturnSession() throws Exception {
        // Arrange - Primero crear una sesión
        MvcResult createResult = mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk())
                .andReturn();

        InscriptionSessionResponse createdSession = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        // Act
        MvcResult result = mockMvc.perform(get("/api/inscription-sessions/{id}", createdSession.getId())
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        // Assert
        InscriptionSessionResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        assertNotNull(response);
        assertEquals(createdSession.getId(), response.getId());
        assertEquals(testInscriptionId, response.getInscriptionId());
        assertEquals(testContestId, response.getContestId());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void getSessionByInscriptionId_ExistingSession_ShouldReturnSession() throws Exception {
        // Arrange - Primero crear una sesión
        mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk());

        // Act
        MvcResult result = mockMvc.perform(get("/api/inscription-sessions/inscription/{inscriptionId}", testInscriptionId)
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        // Assert
        InscriptionSessionResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        assertNotNull(response);
        assertEquals(testInscriptionId, response.getInscriptionId());
        assertEquals(testContestId, response.getContestId());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void getSessionByContestId_ExistingSession_ShouldReturnSession() throws Exception {
        // Arrange - Primero crear una sesión
        mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk());

        // Act
        MvcResult result = mockMvc.perform(get("/api/inscription-sessions/contest/{contestId}", testContestId)
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        // Assert
        InscriptionSessionResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        assertNotNull(response);
        assertEquals(testInscriptionId, response.getInscriptionId());
        assertEquals(testContestId, response.getContestId());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void updateSession_ExistingSession_ShouldUpdateAndReturnSession() throws Exception {
        // Arrange - Primero crear una sesión
        MvcResult createResult = mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk())
                .andReturn();

        InscriptionSessionResponse createdSession = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        // Modificar la solicitud para actualizar
        testSessionRequest.setCurrentStep(InscriptionStep.LOCATION_SELECTION);
        Map<String, Object> updatedFormData = new HashMap<>(testSessionRequest.getFormData());
        updatedFormData.put("selectedCircunscripciones", List.of("Primera", "Segunda", "Tercera"));
        testSessionRequest.setFormData(updatedFormData);

        // Act
        MvcResult result = mockMvc.perform(put("/api/inscription-sessions/{id}", createdSession.getId())
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk())
                .andReturn();

        // Assert
        InscriptionSessionResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        assertNotNull(response);
        assertEquals(createdSession.getId(), response.getId());
        assertEquals(InscriptionStep.LOCATION_SELECTION, response.getCurrentStep());
        assertTrue(response.getFormData().containsKey("selectedCircunscripciones"));
        assertEquals(3, ((List<?>) response.getFormData().get("selectedCircunscripciones")).size());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void deleteSession_ExistingSession_ShouldDeleteSuccessfully() throws Exception {
        // Arrange - Primero crear una sesión
        MvcResult createResult = mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk())
                .andReturn();

        InscriptionSessionResponse createdSession = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                InscriptionSessionResponse.class);

        // Act & Assert
        mockMvc.perform(delete("/api/inscription-sessions/{id}", createdSession.getId())
                        .header("Authorization", authToken))
                .andExpect(status().isOk());

        // Verificar que la sesión ya no existe
        mockMvc.perform(get("/api/inscription-sessions/{id}", createdSession.getId())
                        .header("Authorization", authToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "usuario1")
    void deleteSessionByInscriptionId_ExistingSession_ShouldDeleteSuccessfully() throws Exception {
        // Arrange - Primero crear una sesión
        mockMvc.perform(post("/api/inscription-sessions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSessionRequest)))
                .andExpect(status().isOk());

        // Act & Assert
        mockMvc.perform(delete("/api/inscription-sessions/inscription/{inscriptionId}", testInscriptionId)
                        .header("Authorization", authToken))
                .andExpect(status().isOk());

        // Verificar que la sesión ya no existe
        mockMvc.perform(get("/api/inscription-sessions/inscription/{inscriptionId}", testInscriptionId)
                        .header("Authorization", authToken))
                .andExpect(status().isNotFound());
    }
}
