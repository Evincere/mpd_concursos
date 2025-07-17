package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InscriptionPeriodClosedException;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test de seguridad para verificar que CreateInscriptionService
 * valida correctamente el período de inscripción.
 * 
 * Este test verifica la corrección del punto 12 de la auditoría de seguridad.
 */
@ExtendWith(MockitoExtension.class)
class CreateInscriptionServiceSecurityTest {

    @Mock
    private ContestRepository contestRepository;
    
    @Mock
    private LoadInscriptionPort loadInscriptionPort;
    
    @Mock
    private SaveInscriptionPort saveInscriptionPort;
    
    @Mock
    private SecurityUtils securityUtils;

    private CreateInscriptionService createInscriptionService;

    @BeforeEach
    void setUp() {
        createInscriptionService = new CreateInscriptionService(
                saveInscriptionPort,
                loadInscriptionPort,
                null, // inscriptionMapper - no necesario para este test
                contestRepository,
                null, // sendNotificationUseCase - no necesario para este test
                securityUtils
        );
    }

    @Test
    void shouldRejectInscriptionWhenContestPeriodIsClosed() {
        // Given: Un concurso con período de inscripción cerrado
        Long contestId = 1L;
        Contest contest = Contest.builder()
                .id(contestId)
                .title("Concurso Cerrado")
                .status(ContestStatus.INSCRIPTION_CLOSED)
                .inscriptionStartDate(LocalDateTime.now().minusDays(10))
                .inscriptionEndDate(LocalDateTime.now().minusDays(1)) // Cerrado ayer
                .build();

        InscriptionRequest request = new InscriptionRequest();
        request.setContestId(contestId);
        request.setUserId(UUID.randomUUID());

        // Mock: El concurso existe pero está cerrado
        when(contestRepository.findById(contestId)).thenReturn(Optional.of(contest));
        when(loadInscriptionPort.findByContestIdAndUserIdIncludingCancelled(any(), any()))
                .thenReturn(Optional.empty());

        // When & Then: Debe lanzar InscriptionPeriodClosedException
        InscriptionPeriodClosedException exception = assertThrows(
                InscriptionPeriodClosedException.class,
                () -> createInscriptionService.createInscription(request)
        );

        // Verificar que la excepción contiene la información correcta
        assertEquals(contestId, exception.getContestId());
        assertEquals("Concurso Cerrado", exception.getContestTitle());
        assertTrue(exception.getMessage().contains("ha finalizado o aún no ha comenzado"));

        // Verificar que no se intentó guardar ninguna inscripción
        verify(saveInscriptionPort, never()).save(any());
    }

    @Test
    void shouldRejectInscriptionWhenContestPeriodNotStarted() {
        // Given: Un concurso con período de inscripción que aún no ha comenzado
        Long contestId = 2L;
        Contest contest = Contest.builder()
                .id(contestId)
                .title("Concurso Futuro")
                .status(ContestStatus.PUBLISHED)
                .inscriptionStartDate(LocalDateTime.now().plusDays(1)) // Comienza mañana
                .inscriptionEndDate(LocalDateTime.now().plusDays(10))
                .build();

        InscriptionRequest request = new InscriptionRequest();
        request.setContestId(contestId);
        request.setUserId(UUID.randomUUID());

        // Mock: El concurso existe pero aún no ha abierto inscripciones
        when(contestRepository.findById(contestId)).thenReturn(Optional.of(contest));
        when(loadInscriptionPort.findByContestIdAndUserIdIncludingCancelled(any(), any()))
                .thenReturn(Optional.empty());

        // When & Then: Debe lanzar InscriptionPeriodClosedException
        InscriptionPeriodClosedException exception = assertThrows(
                InscriptionPeriodClosedException.class,
                () -> createInscriptionService.createInscription(request)
        );

        // Verificar que la excepción contiene la información correcta
        assertEquals(contestId, exception.getContestId());
        assertEquals("Concurso Futuro", exception.getContestTitle());

        // Verificar que no se intentó guardar ninguna inscripción
        verify(saveInscriptionPort, never()).save(any());
    }

    @Test
    void shouldPassSecurityValidationWhenContestPeriodIsOpen() {
        // Given: Un concurso con período de inscripción abierto
        Long contestId = 3L;
        Contest contest = Contest.builder()
                .id(contestId)
                .title("Concurso Abierto")
                .status(ContestStatus.INSCRIPTION_OPEN)
                .inscriptionStartDate(LocalDateTime.now().minusDays(1))
                .inscriptionEndDate(LocalDateTime.now().plusDays(10))
                .build();

        InscriptionRequest request = new InscriptionRequest();
        request.setContestId(contestId);
        request.setUserId(UUID.randomUUID());

        // Mock: El concurso existe y está abierto
        when(contestRepository.findById(contestId)).thenReturn(Optional.of(contest));
        when(loadInscriptionPort.findByContestIdAndUserIdIncludingCancelled(any(), any()))
                .thenReturn(Optional.empty());

        // When & Then: La validación de seguridad debe pasar
        // (El test fallará después por el mapper null, pero eso significa que pasó la validación de seguridad)
        try {
            createInscriptionService.createInscription(request);
            fail("Se esperaba NullPointerException por mapper null");
        } catch (NullPointerException e) {
            // Esto es esperado - significa que pasó la validación de seguridad
            assertTrue(e.getMessage().contains("inscriptionMapper"));
        } catch (InscriptionPeriodClosedException e) {
            fail("No debería lanzar InscriptionPeriodClosedException para un concurso abierto");
        }
    }
}
