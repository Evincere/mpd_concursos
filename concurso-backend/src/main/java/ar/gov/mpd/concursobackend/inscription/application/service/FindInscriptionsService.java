package ar.gov.mpd.concursobackend.inscription.application.service;

import java.util.stream.Collectors;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import lombok.RequiredArgsConstructor;
import java.util.UUID;
import org.springframework.data.domain.Page;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import org.springframework.data.domain.PageRequest;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FindInscriptionsService implements FindInscriptionsUseCase {
    private final LoadInscriptionPort loadInscriptionPort;
    private final ContestRepository contestRepository;
    private final InscriptionMapper inscriptionMapper;
    private final InscriptionRepository inscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InscriptionDetailResponse> findAll(
            ar.gov.mpd.concursobackend.shared.domain.model.PageRequest pageRequest, UUID userId) {
        log.debug("Buscando inscripciones para usuario: {}", userId);

        var springPageRequest = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPage(),
                pageRequest.getSize(),
                Sort.by(Sort.Direction.valueOf(pageRequest.getSortDirection().toUpperCase()),
                        pageRequest.getSortBy()));

        var page = loadInscriptionPort.findAllByUserId(userId, springPageRequest);

        List<InscriptionDetailResponse> detailResponses = page.getContent().stream()
                .map(inscription -> {
                    Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                            .orElse(null);
                    return inscriptionMapper.toDetailResponse(inscription, contest);
                })
                .collect(Collectors.toList());

        return new PageResponse<>(
                detailResponses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public InscriptionDetailResponse findById(UUID id) {
        Inscription inscription = loadInscriptionPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inscription not found with id: " + id));

        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                .orElse(null);

        return inscriptionMapper.toDetailResponse(inscription, contest);
    }

    @Override
    public Boolean findInscriptionStatus(Long contestId, String userId) {
        try {
            log.debug("Verificando inscripción para concurso {} y usuario {}", contestId, userId);

            if (contestId == null) {
                log.error("El ID del concurso es nulo");
                throw new IllegalArgumentException("El ID del concurso es requerido");
            }

            if (userId == null || userId.trim().isEmpty()) {
                log.error("El ID del usuario es nulo o vacío");
                throw new IllegalArgumentException("El ID del usuario es requerido");
            }

            UUID userUUID;
            try {
                userUUID = UUID.fromString(userId);
            } catch (IllegalArgumentException e) {
                log.error("Error al convertir userId a UUID: {} - userId: {}", e.getMessage(), userId);
                throw new IllegalArgumentException("ID de usuario inválido: " + userId);
            }

            log.debug("Buscando inscripción en la base de datos para contestId: {} y userId: {}", contestId, userUUID);
            Optional<Inscription> inscripcionOpt = loadInscriptionPort.findByContestIdAndUserId(contestId, userUUID);

            return inscripcionOpt.map(inscripcion -> {
                log.debug("Se encontró una inscripción con estado {}: {}", inscripcion.getStatus(), inscripcion);
                boolean isActiveOrPending = inscripcion.getStatus() == InscriptionStatus.ACTIVE ||
                        inscripcion.getStatus() == InscriptionStatus.PENDING;
                log.debug("¿La inscripción está activa o pendiente? {}", isActiveOrPending);
                return isActiveOrPending;
            }).orElseGet(() -> {
                log.debug("No se encontró inscripción para el concurso {} y usuario {}", contestId, userId);
                return false;
            });

        } catch (Exception e) {
            log.error("Error inesperado al verificar inscripción: {} - Tipo: {} - Causa: {}",
                    e.getMessage(), e.getClass().getName(), e.getCause(), e);
            throw new RuntimeException("Error al verificar inscripción: " + e.getMessage(), e);
        }
    }

    @Override
    public Page<InscriptionResponse> findAllPaged(PageRequest pageRequest, UUID userId) {
        return inscriptionRepository.findAllByUserId(userId, pageRequest)
                .map(inscriptionMapper::toResponse);
    }
}