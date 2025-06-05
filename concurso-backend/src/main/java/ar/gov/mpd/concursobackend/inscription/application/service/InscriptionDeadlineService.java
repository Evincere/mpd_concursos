package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para manejar los plazos perentorios de documentación
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionDeadlineService {

    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final InscriptionNotificationService notificationService;

    /**
     * Congela las inscripciones que han superado el plazo perentorio de documentación
     * Se ejecuta cada hora
     */
    @Scheduled(fixedRate = 3600000) // Cada hora
    @Transactional
    public void freezeExpiredInscriptions() {
        log.info("Iniciando proceso de congelación de inscripciones con plazo vencido");

        LocalDateTime now = LocalDateTime.now();
        
        // Buscar inscripciones con documentación pendiente y plazo vencido
        List<Inscription> expiredInscriptions = inscriptionRepository.findByStateAndDocumentationDeadlineBefore(
            InscriptionState.COMPLETED_PENDING_DOCS, 
            now
        );

        log.info("Encontradas {} inscripciones con plazo de documentación vencido", expiredInscriptions.size());

        for (Inscription inscription : expiredInscriptions) {
            try {
                inscription.freezeInscription();
                inscriptionRepository.save(inscription);

                log.info("Inscripción {} congelada por plazo vencido", inscription.getId());

                // Enviar notificación al usuario sobre la congelación
                try {
                    Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                            .orElse(null);
                    if (contest != null) {
                        notificationService.notifyUserAboutInscriptionFrozen(inscription, contest);
                        log.info("Notificación de congelación enviada para inscripción {}", inscription.getId());
                    } else {
                        log.warn("No se pudo encontrar el concurso {} para enviar notificación de congelación",
                                inscription.getContestId());
                    }
                } catch (Exception notificationError) {
                    log.error("Error al enviar notificación de congelación para inscripción {}: {}",
                            inscription.getId(), notificationError.getMessage(), notificationError);
                }

            } catch (Exception e) {
                log.error("Error al congelar inscripción {}: {}", inscription.getId(), e.getMessage(), e);
            }
        }

        log.info("Proceso de congelación completado. {} inscripciones procesadas", expiredInscriptions.size());
    }

    /**
     * Calcula el plazo perentorio para la documentación
     * 3 días hábiles después del último día del plazo de inscripción
     *
     * @param inscriptionEndDate Fecha de fin del plazo de inscripción
     * @return Fecha límite para la documentación
     */
    public LocalDateTime calculateDocumentationDeadline(LocalDateTime inscriptionEndDate) {
        if (inscriptionEndDate == null) {
            return null;
        }

        // Agregar 3 días hábiles
        LocalDateTime deadline = inscriptionEndDate;
        int businessDaysAdded = 0;
        
        while (businessDaysAdded < 3) {
            deadline = deadline.plusDays(1);
            
            // Verificar si es día hábil (lunes a viernes)
            if (deadline.getDayOfWeek().getValue() >= 1 && deadline.getDayOfWeek().getValue() <= 5) {
                businessDaysAdded++;
            }
        }
        
        // Establecer la hora límite a las 23:59:59
        return deadline.withHour(23).withMinute(59).withSecond(59);
    }

    /**
     * Verifica si una inscripción puede aún cargar documentos
     *
     * @param inscription La inscripción a verificar
     * @return true si puede cargar documentos, false si está congelada
     */
    public boolean canUploadDocuments(Inscription inscription) {
        if (inscription == null) {
            return false;
        }

        // Si está congelada, no puede cargar documentos
        if (inscription.isFrozen()) {
            return false;
        }

        // Si tiene documentación completa, puede cargar documentos
        if (inscription.getState() == InscriptionState.COMPLETED_WITH_DOCS) {
            return true;
        }

        // Si tiene documentación pendiente, verificar el plazo
        if (inscription.getState() == InscriptionState.COMPLETED_PENDING_DOCS) {
            return inscription.getDocumentationDeadline() == null || 
                   LocalDateTime.now().isBefore(inscription.getDocumentationDeadline());
        }

        // Para otros estados, permitir carga de documentos
        return true;
    }

    /**
     * Actualiza el estado de una inscripción basado en la documentación
     *
     * @param inscription La inscripción a actualizar
     * @param hasAllRequiredDocuments Si tiene todos los documentos requeridos
     */
    @Transactional
    public void updateInscriptionDocumentationStatus(Inscription inscription, boolean hasAllRequiredDocuments) {
        if (inscription == null) {
            return;
        }

        // Si está congelada, no cambiar el estado
        if (inscription.isFrozen()) {
            log.warn("Intento de actualizar documentación de inscripción congelada: {}", inscription.getId());
            return;
        }

        InscriptionState currentState = inscription.getState();
        
        if (hasAllRequiredDocuments) {
            // Si ahora tiene todos los documentos, cambiar a COMPLETED_WITH_DOCS
            if (currentState == InscriptionState.COMPLETED_PENDING_DOCS) {
                inscription.setState(InscriptionState.COMPLETED_WITH_DOCS);
                inscription.setLastUpdated(LocalDateTime.now());
                inscriptionRepository.save(inscription);
                
                log.info("Inscripción {} actualizada a COMPLETED_WITH_DOCS", inscription.getId());
            }
        } else {
            // Si no tiene todos los documentos y está completada, cambiar a PENDING_DOCS
            if (currentState == InscriptionState.COMPLETED_WITH_DOCS) {
                inscription.setState(InscriptionState.COMPLETED_PENDING_DOCS);
                inscription.setLastUpdated(LocalDateTime.now());
                
                // Establecer plazo perentorio si no existe
                if (inscription.getDocumentationDeadline() == null) {
                    // Obtener la fecha de fin de inscripción del concurso
                    LocalDateTime inscriptionEndDate = null;
                    try {
                        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                                .orElse(null);
                        if (contest != null && contest.getEndDate() != null) {
                            // Convertir LocalDate a LocalDateTime al final del día
                            inscriptionEndDate = contest.getEndDate().atTime(23, 59, 59);
                        }
                    } catch (Exception e) {
                        log.warn("Error al obtener fecha de fin de inscripción del concurso {}: {}",
                                inscription.getContestId().getValue(), e.getMessage());
                    }

                    // Si no se puede obtener la fecha del concurso, usar la fecha actual como fallback
                    LocalDateTime deadline = calculateDocumentationDeadline(
                            inscriptionEndDate != null ? inscriptionEndDate : LocalDateTime.now());
                    inscription.setDocumentationDeadline(deadline);
                }
                
                inscriptionRepository.save(inscription);
                
                log.info("Inscripción {} actualizada a COMPLETED_PENDING_DOCS", inscription.getId());
            }
        }
    }

    /**
     * Obtiene el tiempo restante para cargar documentos
     *
     * @param inscription La inscripción
     * @return Tiempo restante en horas, o -1 si no hay límite o está vencido
     */
    public long getHoursUntilDeadline(Inscription inscription) {
        if (inscription == null || inscription.getDocumentationDeadline() == null) {
            return -1;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = inscription.getDocumentationDeadline();

        if (now.isAfter(deadline)) {
            return 0; // Plazo vencido
        }

        return java.time.Duration.between(now, deadline).toHours();
    }
}
