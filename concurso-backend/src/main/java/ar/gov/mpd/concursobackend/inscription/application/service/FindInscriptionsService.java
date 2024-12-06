package ar.gov.mpd.concursobackend.inscription.application.service;

import java.util.stream.Collectors;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FindInscriptionsService implements FindInscriptionsUseCase {
    private final LoadInscriptionPort loadInscriptionPort;
    private final ContestRepository contestRepository;
    private final InscriptionMapper inscriptionMapper;
    private final IUserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InscriptionDetailResponse> findAll(PageRequest pageRequest) {
        // Obtener el usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        // Obtener el UUID del usuario
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        // Buscar las inscripciones del usuario
        PageResponse<Inscription> inscriptions = loadInscriptionPort.findAllByUserId(user.getId().value(), pageRequest);
        
        List<InscriptionDetailResponse> detailResponses = inscriptions.getContent().stream()
            .map(inscription -> {
                Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                    .orElse(null);
                return inscriptionMapper.toDetailResponse(inscription, contest);
            })
            .collect(Collectors.toList());

        return new PageResponse<>(
            detailResponses,
            inscriptions.getPageNumber(),
            inscriptions.getPageSize(),
            inscriptions.getTotalElements(),
            inscriptions.getTotalPages(),
            inscriptions.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public InscriptionDetailResponse findById(Long id) {
        Inscription inscription = loadInscriptionPort.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Inscription not found with id: " + id));
        
        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
            .orElse(null);
        
        return inscriptionMapper.toDetailResponse(inscription, contest);
    }

    @Override
    @Transactional(readOnly = true)
    public InscriptionStatus findInscriptionStatus(Long contestId, String userId) {
        try {
            UUID userUUID = UUID.fromString(userId);
            return loadInscriptionPort.findByContestIdAndUserId(contestId, userUUID)
                .map(Inscription::getStatus)
                .orElse(InscriptionStatus.NOT_REGISTERED);
        } catch (IllegalArgumentException e) {
            // Si el UUID no es válido o hay algún otro error, asumimos que no está inscrito
            return InscriptionStatus.NOT_REGISTERED;
        }
    }
}