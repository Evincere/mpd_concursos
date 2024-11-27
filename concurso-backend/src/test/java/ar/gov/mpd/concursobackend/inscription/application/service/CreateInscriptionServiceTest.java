package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateInscriptionServiceTest {

    @Mock
    private SaveInscriptionPort saveInscriptionPort;

    @Mock
    private InscriptionMapper inscriptionMapper;

    @InjectMocks
    private CreateInscriptionService service;

    @Test
    void shouldCreateInscription() {
        // Arrange
        var request = InscriptionRequest.builder()
                .contestId(1L)
                .userId(2L)
                .build();

        var savedInscription = Inscription.builder()
                .contestId(new ContestId(1L))
                .userId(new UserId(2L))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(LocalDateTime.now())
                .build();

        var expectedResponse = InscriptionResponse.builder()
                .contestId(1L)
                .userId(2L)
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(savedInscription.getInscriptionDate())
                .build();

        when(saveInscriptionPort.save(any(Inscription.class))).thenReturn(savedInscription);
        when(inscriptionMapper.toResponse(savedInscription)).thenReturn(expectedResponse);

        // Act
        var response = service.createInscription(request);

        // Assert
        assertNotNull(response);
        assertEquals(InscriptionStatus.PENDING, response.getStatus());
        assertEquals(1L, response.getContestId());
        assertEquals(2L, response.getUserId());
    }
} 