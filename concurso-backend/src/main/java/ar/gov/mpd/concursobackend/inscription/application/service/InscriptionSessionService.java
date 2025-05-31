package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionSessionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.DeleteInscriptionSessionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.GetInscriptionSessionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.SaveInscriptionSessionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionSessionRepository;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio de aplicación para sesiones de inscripción
 */
@Service
@Transactional
@RequiredArgsConstructor
public class InscriptionSessionService implements SaveInscriptionSessionUseCase, GetInscriptionSessionUseCase, DeleteInscriptionSessionUseCase {
    private final InscriptionSessionRepository repository;
    private final InscriptionSessionMapper mapper;
    private final SecurityUtils securityUtils;
    private static final Logger log = LoggerFactory.getLogger(InscriptionSessionService.class);

    @Override
    public InscriptionSessionResponse saveSession(InscriptionSessionRequest request) {
        log.debug("Guardando sesión de inscripción para inscripción: {}", request.getInscriptionId());

        // Obtener el ID del usuario autenticado
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }
        UserId userId = new UserId(UUID.fromString(currentUserId));

        // Verificar si ya existe una sesión para esta inscripción
        Optional<InscriptionSession> existingSession = repository.findByInscriptionId(new InscriptionId(request.getInscriptionId()));

        InscriptionSession session;
        if (existingSession.isPresent()) {
            // Actualizar la sesión existente
            session = mapper.updateDomain(existingSession.get(), request);
        } else {
            // Crear una nueva sesión
            session = mapper.toDomain(request, userId);
        }

        // Guardar la sesión
        InscriptionSession savedSession = repository.save(session);
        return mapper.toResponse(savedSession);
    }

    @Override
    public Optional<InscriptionSessionResponse> getSessionById(UUID id) {
        log.debug("Buscando sesión de inscripción con ID: {}", id);
        return repository.findById(new InscriptionSessionId(id))
                .map(mapper::toResponse);
    }

    @Override
    public Optional<InscriptionSessionResponse> getSessionByInscriptionId(UUID inscriptionId) {
        log.debug("Buscando sesión por ID de inscripción: {}", inscriptionId);
        return repository.findByInscriptionId(new InscriptionId(inscriptionId))
                .map(mapper::toResponse);
    }

    @Override
    public List<InscriptionSessionResponse> getSessionsByCurrentUser() {
        // Obtener el ID del usuario autenticado
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }
        UserId userId = new UserId(UUID.fromString(currentUserId));

        log.debug("Buscando sesiones para el usuario: {}", userId.getValue());
        return repository.findByUserId(userId)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<InscriptionSessionResponse> getSessionByContestId(Long contestId) {
        // Obtener el ID del usuario autenticado
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No se encontró el usuario autenticado");
        }
        UserId userId = new UserId(UUID.fromString(currentUserId));

        log.debug("Buscando sesión para el usuario: {} y concurso: {}", userId.getValue(), contestId);
        return repository.findByUserIdAndContestId(userId, new ContestId(contestId))
                .map(mapper::toResponse);
    }

    @Override
    public void deleteSession(UUID id) {
        log.debug("Eliminando sesión de inscripción con ID: {}", id);
        repository.deleteById(new InscriptionSessionId(id));
    }

    @Override
    public void deleteSessionByInscriptionId(UUID inscriptionId) {
        log.debug("Eliminando sesión por ID de inscripción: {}", inscriptionId);
        repository.findByInscriptionId(new InscriptionId(inscriptionId))
                .ifPresent(session -> repository.deleteById(session.getId()));
    }

    @Override
    public int deleteExpiredSessions() {
        log.debug("Eliminando sesiones expiradas");
        return repository.deleteExpiredSessions();
    }
}
