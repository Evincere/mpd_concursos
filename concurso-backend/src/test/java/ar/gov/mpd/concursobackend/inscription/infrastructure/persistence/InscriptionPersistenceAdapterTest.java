package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InscriptionPersistenceAdapterTest {

    @Mock
    private InscriptionJpaRepository repository;

    @Mock
    private InscriptionEntityMapper mapper;

    @InjectMocks
    private InscriptionPersistenceAdapter adapter;

    @Test
    void shouldSaveInscription() {
        // Arrange
        var inscription = createInscription();
        var entity = createEntity();
        
        when(mapper.toEntity(inscription)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toDomain(entity)).thenReturn(inscription);

        // Act
        var result = adapter.save(inscription);

        // Assert
        assertNotNull(result);
        assertEquals(inscription.getContestId(), result.getContestId());
        assertEquals(inscription.getUserId(), result.getUserId());
        assertEquals(inscription.getStatus(), result.getStatus());
    }

    @Test
    void shouldFindAllWithPagination() {
        // Arrange
        var pageRequest = PageRequest.of(0, 10, "inscriptionDate", "desc");
        var entity = createEntity();
        var inscription = createInscription();
        var springPage = new PageImpl<>(List.of(entity));
        
        when(repository.findAll(any(Pageable.class))).thenReturn(springPage);
        when(mapper.toDomain(entity)).thenReturn(inscription);

        // Act
        var result = adapter.findAll(pageRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(0, result.getPageNumber());
        assertEquals(10, result.getPageSize());
        assertEquals(1, result.getTotalElements());
        assertTrue(result.isLast());
    }

    private Inscription createInscription() {
        return Inscription.builder()
                .contestId(new ContestId(1L))
                .userId(new UserId(2L))
                .status(InscriptionStatus.PENDING)
                .inscriptionDate(LocalDateTime.now())
                .build();
    }

    private InscriptionEntity createEntity() {
        var entity = new InscriptionEntity();
        entity.setContestId(1L);
        entity.setUserId(2L);
        entity.setStatus(InscriptionStatus.PENDING);
        entity.setInscriptionDate(LocalDateTime.now());
        return entity;
    }
} 