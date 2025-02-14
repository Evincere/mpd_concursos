package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.application.port.in.command.CreateInscriptionCommand;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.service.NotificationService;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InscriptionService {
    
    private final InscriptionRepository inscriptionRepository;
    private final NotificationService notificationService;
    private final ContestRepository contestRepository;
    private final InscriptionMapper inscriptionMapper;

    @Transactional
    public InscriptionResponse createInscription(CreateInscriptionCommand command) {
        Contest contest = contestRepository.findById(command.getContestId())
            .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado"));
            
        if (!contest.getStatus().equals(ContestStatus.ACTIVE)) {
            throw new IllegalStateException("El concurso no está activo para inscripciones");
        }
        
        // Verificar si ya existe una inscripción
        if (inscriptionRepository.existsByUserIdAndContestId(
            command.getUserId(), 
            command.getContestId()
        )) {
            throw new IllegalStateException("Ya existe una inscripción para este concurso");
        }
            
        // Generar un nuevo UUID para el ID de la inscripción
        UUID inscriptionUuid = UUID.randomUUID();
        
        // Crear la inscripción usando value objects
        Inscription inscription = Inscription.builder()
            .id(new InscriptionId(inscriptionUuid))  // Asignar el UUID generado
            .contestId(new ContestId(command.getContestId()))
            .userId(new UserId(command.getUserId()))
            .status(InscriptionStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .inscriptionDate(LocalDateTime.now())
            .build();
        
        // Guardar la inscripción
        Inscription savedInscription = inscriptionRepository.save(inscription);
        
        // Enviar notificación
        NotificationRequest notificationRequest = NotificationRequest.builder()
            .recipientUsername(command.getUserId().toString())
            .subject("Inscripción Confirmada - " + contest.getTitle())
            .content(String.format(
                "Tu inscripción al concurso '%s' ha sido procesada correctamente.\n\n" +
                "Detalles del concurso:\n" +
                "- Cargo: %s\n" +
                "- Fecha de cierre: %s\n\n" +
                "Podrás seguir el estado de tu postulación desde la sección 'Mis Postulaciones'.",
                contest.getTitle(),
                contest.getPosition(),
                contest.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            ))
            .acknowledgementLevel(AcknowledgementLevel.NONE)
            .type(NotificationType.INSCRIPTION)
            .build();
            
        notificationService.sendNotification(notificationRequest);
        
        return inscriptionMapper.toResponse(savedInscription);
    }

    @Transactional
    public void cancelInscription(UUID inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
            .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));
        
        inscription.cancel();
        inscriptionRepository.save(inscription);
    }
} 