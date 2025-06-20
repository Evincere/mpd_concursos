package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.DuplicateInscriptionException;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import ar.gov.mpd.concursobackend.inscription.domain.util.InscriptionStateConverter;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateInscriptionService implements CreateInscriptionUseCase {
        private final SaveInscriptionPort saveInscriptionPort;
        private final LoadInscriptionPort loadInscriptionPort;
        private final InscriptionMapper inscriptionMapper;
        private final ContestRepository contestRepository;
        private final SendNotificationUseCase notificationService;
        private final SecurityUtils securityUtils;
        private static final Logger log = LoggerFactory.getLogger(CreateInscriptionService.class);

        @Override
        public InscriptionDetailResponse createInscription(InscriptionRequest request) {
                log.debug("Iniciando creación de inscripción para concurso {} y usuario {}",
                                request.getContestId(), request.getUserId());

                // Verificar si ya existe una inscripción (incluyendo canceladas)
                Optional<Inscription> existingInscription = loadInscriptionPort.findByContestIdAndUserIdIncludingCancelled(
                                request.getContestId(),
                                request.getUserId());

                if (existingInscription.isPresent()) {
                        Inscription inscription = existingInscription.get();

                        // REGLA DE NEGOCIO CORREGIDA:
                        // - Si existe una inscripción ACTIVE o PENDING, devolver la existente (no crear nueva)
                        // - Solo impedir reinscripción para estados finales (CANCELLED, REJECTED, APPROVED, etc.)
                        String stateString = inscription.getState().toString();

                        if ("ACTIVE".equals(stateString) || "PENDING".equals(stateString)) {
                                // Si ya existe una inscripción activa o pendiente, devolver la existente
                                log.info("Devolviendo inscripción existente {} para concurso {} y usuario {} - Estado: {}",
                                        inscription.getId().getValue(), request.getContestId(), request.getUserId(), inscription.getState());

                                // Obtener el username del usuario autenticado
                                String username = securityUtils.getCurrentUsername();
                                if (username == null) {
                                        throw new IllegalStateException("No se pudo obtener el username del usuario autenticado");
                                }

                                return inscriptionMapper.toDetailResponse(inscription, null);
                        }

                        // Para estados finales, impedir nueva inscripción
                        String errorMessage = switch (stateString) {
                                case "CANCELLED" -> "No puede volver a inscribirse a un concurso donde ya canceló su inscripción";
                                case "REJECTED" -> "No puede volver a inscribirse a un concurso donde su inscripción fue rechazada";
                                case "APPROVED" -> "Ya tiene una inscripción aprobada para este concurso";
                                case "COMPLETED_WITH_DOCS", "COMPLETED_PENDING_DOCS" -> "Ya tiene una inscripción completada para este concurso";
                                case "FROZEN" -> "Su inscripción anterior fue congelada. No puede volver a inscribirse";
                                default -> "Ya existe una inscripción para este concurso";
                        };

                        log.error("Intento de inscripción rechazado para concurso {} y usuario {} - Estado existente: {}",
                                request.getContestId(), request.getUserId(), inscription.getState());
                        throw new DuplicateInscriptionException(errorMessage);
                }

                // Obtener el concurso
                Contest contest = contestRepository.findById(request.getContestId())
                                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

                LocalDateTime now = LocalDateTime.now();

                // CRITICAL FIX: Generar ID antes de construir la inscripción
                InscriptionId inscriptionId = new InscriptionId(UUID.randomUUID());

                Inscription inscription = Inscription.builder()
                                .id(inscriptionId) // Usar ID generado
                                .contestId(new ContestId(request.getContestId()))
                                .userId(new UserId(request.getUserId()))
                                .state(InscriptionStateConverter.toState(InscriptionStatus.ACTIVE))
                                .createdAt(now)
                                .inscriptionDate(now)
                                .build();

                log.debug("Creando inscripción con ID: {}", inscription.getId().getValue());
                Inscription savedInscription = saveInscriptionPort.save(inscription);
                log.debug("Inscripción guardada con ID: {}", savedInscription.getId().getValue());

                // Obtener el username del usuario autenticado
                String username = securityUtils.getCurrentUsername();
                if (username == null) {
                        throw new IllegalStateException("No se pudo obtener el username del usuario autenticado");
                }

                // No enviamos notificación al iniciar el proceso
                log.debug("Inscripción iniciada para el usuario {} en el concurso {} - No se envía notificación inicial",
                                username, contest.getTitle());

                return inscriptionMapper.toDetailResponse(savedInscription, null);
        }
}