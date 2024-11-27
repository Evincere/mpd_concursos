package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class InscriptionMapperTest {

    private final InscriptionMapper mapper = new InscriptionMapper();

    @Test
    void shouldMapToResponse() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        Inscription inscription = Inscription.builder()
                .id(new InscriptionId(1L))
                .contestId(new ContestId(2L))
                .userId(new UserId(3L))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(now)
                .build();

        // Act
        var response = mapper.toResponse(inscription);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(2L, response.getContestId());
        assertEquals(3L, response.getUserId());
        assertEquals(InscriptionStatus.PENDING, response.getStatus());
        assertEquals(now, response.getInscriptionDate());
    }

    @Test
    void shouldHandleNullId() {
        // Arrange
        Inscription inscription = Inscription.builder()
                .contestId(new ContestId(2L))
                .userId(new UserId(3L))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(LocalDateTime.now())
                .build();

        // Act
        var response = mapper.toResponse(inscription);

        // Assert
        assertNotNull(response);
        assertNull(response.getId());
    }
} 