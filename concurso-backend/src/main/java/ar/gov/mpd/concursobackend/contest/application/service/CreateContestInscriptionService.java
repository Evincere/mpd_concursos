package ar.gov.mpd.concursobackend.contest.application.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestInscriptionRequest;
import ar.gov.mpd.concursobackend.contest.application.port.in.CreateContestInscriptionUseCase;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CreateContestInscriptionService implements CreateContestInscriptionUseCase {
    
    private final ContestRepository contestRepository;
    private final IUserService userService;
    private final SaveInscriptionPort saveInscriptionPort;

    @Override
    @Transactional
    public Inscription createInscription(ContestInscriptionRequest request) {
        // Obtener el usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        // Obtener el usuario
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // Verificar que el concurso existe
        Contest contest = contestRepository.findById(request.getContestId())
            .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));

        // Verificar que el concurso está publicado
        if (!contest.getStatus().equals("PUBLISHED")) {
            throw new IllegalStateException("El concurso no está disponible para inscripciones");
        }

        // Crear la inscripción
        Inscription inscription = Inscription.builder()
            .id(null)
            .contestId(new ContestId(contest.getId()))
            .userId(new UserId(user.getId().value()))
            .inscriptionDate(LocalDateTime.now())
            .status(InscriptionStatus.PENDING)
            .build();

        // Guardar la inscripción
        return saveInscriptionPort.save(inscription);
    }
}
