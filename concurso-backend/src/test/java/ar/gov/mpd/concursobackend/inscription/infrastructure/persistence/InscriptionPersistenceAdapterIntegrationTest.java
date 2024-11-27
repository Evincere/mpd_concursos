package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({InscriptionPersistenceAdapter.class, InscriptionEntityMapper.class})
class InscriptionPersistenceAdapterIntegrationTest {

    @Autowired
    private InscriptionPersistenceAdapter adapter;

    @Test
    @Sql("/scripts/insert_test_inscriptions.sql")
    void shouldSaveAndRetrieveInscription() {
        // Arrange
        var inscription = Inscription.builder()
                .contestId(new ContestId(1L))
                .userId(new UserId(2L))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(LocalDateTime.now())
                .build();

        // Act
        var saved = adapter.save(inscription);
        var pageRequest = PageRequest.of(0, 10, "inscriptionDate", "desc");
        var found = adapter.findAll(pageRequest);

        // Assert
        assertNotNull(saved.getId());
        assertFalse(found.getContent().isEmpty());
        assertEquals(saved.getId(), found.getContent().get(0).getId());
    }
} 