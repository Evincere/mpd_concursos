package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para manejar los plazos perentorios de documentación
 * VERSIÓN CORREGIDA - Implementa lógica de negocio correcta
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionDeadlineService {

    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final InscriptionNotificationService notificationService;

    /**
     * Procesa las inscripciones después del vencimiento del plazo de gracia
     * LÓGICA CORRECTA:
     * - Los 3 días hábiles se cuentan desde el cierre del concurso
     * - Al vencimiento: COMPLETED_PENDING_DOCS → REJECTED automáticamente
     * - TODAS las inscripciones se congelan para revisión administrativa
     */
    @Scheduled(fixedRate = 3600000) // Cada hora
    @Transactional
    public void processInscriptionsAfterGracePeriod() {
        log.info("🔍 Verificando plazos de gracia post-inscripción");

        // Buscar concursos cerrados
        List<Contest> closedContests = contestRepository.findByStatus(ContestStatus.CLOSED);
        
        for (Contest contest : closedContests) {
            processContestInscriptionsIfGracePeriodExpired(contest);
        }
        
        log.info("✅ Verificación de plazos completada");
    }

    /**
     * Procesa las inscripciones de un concurso específico si el plazo de gracia ha vencido
     */
    @Transactional
    public void processContestInscriptionsIfGracePeriodExpired(Contest contest) {
        LocalDateTime contestEndDate = contest.getInscriptionEndDate();
        if (contestEndDate == null) {
            log.warn("⚠️ Concurso {} no tiene fecha de fin de inscripción configurada", contest.getId());
            return;
        }

        // Calcular el fin del plazo de gracia (3 días hábiles después del cierre)
        LocalDateTime gracePeriodEnd = calculateGracePeriodEnd(contestEndDate);
        LocalDateTime now = LocalDateTime.now();
        
        log.debug("Concurso: {} - Fin inscripción: {} - Fin plazo gracia: {} - Ahora: {}", 
                contest.getTitle(), contestEndDate, gracePeriodEnd, now);

        // Si el plazo de gracia aún no ha vencido, no procesar
        if (now.isBefore(gracePeriodEnd)) {
            long hoursRemaining = java.time.Duration.between(now, gracePeriodEnd).toHours();
            log.debug("El plazo de gracia para el concurso {} aún no ha vencido. Quedan {} horas", 
                     contest.getTitle(), hoursRemaining);
            return;
        }

        // Verificar si ya se procesó este concurso (verificando si hay inscripciones congeladas)
        List<Inscription> allInscriptions = inscriptionRepository.findByContestId(contest.getId());
        boolean alreadyProcessed = allInscriptions.stream().anyMatch(i -> i.getFrozenDate() != null);
        
        if (alreadyProcessed) {
            log.debug("Concurso {} ya fue procesado anteriormente", contest.getTitle());
            return;
        }

        log.info("🚨 PROCESANDO concurso {} - Plazo de gracia VENCIDO", contest.getTitle());

        // Procesar todas las inscripciones del concurso
        processInscriptionsForContest(contest, allInscriptions);
        
        log.info("✅ Concurso {} procesado completamente", contest.getTitle());
    }

    /**
     * Procesa todas las inscripciones de un concurso después del vencimiento del plazo de gracia
     */
    @Transactional
    public void processInscriptionsForContest(Contest contest, List<Inscription> allInscriptions) {
        int rejectedCount = 0;
        int frozenCount = 0;
        int errorCount = 0;

        log.info("📋 Procesando {} inscripciones del concurso {}", allInscriptions.size(), contest.getTitle());

        for (Inscription inscription : allInscriptions) {
            try {
                InscriptionState currentState = inscription.getState();
                
                // REGLA DE NEGOCIO: Si la inscripción está en estado COMPLETED_PENDING_DOCS, rechazarla automáticamente
                if (currentState == InscriptionState.COMPLETED_PENDING_DOCS) {
                    inscription.setState(InscriptionState.REJECTED);
                    inscription.setLastUpdated(LocalDateTime.now());
                    
                    // Agregar nota explicativa
                    InscriptionNote note = InscriptionNote.builder()
                            .id(UUID.randomUUID())
                            .content("Rechazada automáticamente por no completar documentación requerida dentro del plazo perentorio de 3 días hábiles posterior al cierre de inscripciones.")
                            .createdAt(LocalDateTime.now())
                            .isSystemGenerated(true)
                            .build();
                    inscription.addNote(note);
                    
                    inscriptionRepository.save(inscription);
                    rejectedCount++;
                    
                    log.info("❌ Inscripción {} RECHAZADA por documentación pendiente", inscription.getId());
                    
                    // Enviar notificación de rechazo automático (usando el método existente de congelación como base)
                    try {
                        notificationService.notifyUserAboutInscriptionFrozen(inscription, contest);
                        log.info("📧 Notificación enviada para inscripción rechazada {}", inscription.getId());
                    } catch (Exception notificationError) {
                        log.error("Error enviando notificación de rechazo para inscripción {}: {}", 
                                 inscription.getId(), notificationError.getMessage(), notificationError);
                    }
                }
                
                // REGLA DE NEGOCIO: Congelar TODAS las inscripciones (excepto las ya canceladas)
                if (currentState != InscriptionState.CANCELLED && inscription.getFrozenDate() == null) {
                    inscription.setFrozenDate(LocalDateTime.now());
                    inscription.setLastUpdated(LocalDateTime.now());
                    
                    // Agregar nota de congelación
                    InscriptionNote note = InscriptionNote.builder()
                            .id(UUID.randomUUID())
                            .content("Congelada para evaluación administrativa - fin del período de gracia para documentación.")
                            .createdAt(LocalDateTime.now())
                            .isSystemGenerated(true)
                            .build();
                    inscription.addNote(note);
                    
                    inscriptionRepository.save(inscription);
                    frozenCount++;
                    
                    log.debug("🧊 Inscripción {} CONGELADA para evaluación", inscription.getId());
                }
                
            } catch (Exception e) {
                log.error("❌ Error procesando inscripción {}: {}", inscription.getId(), e.getMessage(), e);
                errorCount++;
            }
        }
        
        log.info("📊 Procesamiento completado - Rechazadas: {}, Congeladas: {}, Errores: {}", 
                rejectedCount, frozenCount, errorCount);
    }

    /**
     * Calcula el fin del plazo de gracia: 3 días hábiles después del cierre de inscripción
     * LÓGICA CORRECTA: Se cuenta desde el cierre del concurso, no desde inscripciones individuales
     */
    public LocalDateTime calculateGracePeriodEnd(LocalDateTime contestEndDate) {
        if (contestEndDate == null) {
            return null;
        }

        // Empezar desde el día siguiente al cierre del concurso a las 00:00
        LocalDateTime current = contestEndDate.plusDays(1).withHour(0).withMinute(0).withSecond(0);
        int businessDaysCount = 0;
        
        log.debug("📅 Calculando plazo de gracia desde: {}", current);
        
        while (businessDaysCount < 3) {
            // Verificar si es día hábil (lunes=1 a viernes=5)
            boolean isBusinessDay = current.getDayOfWeek().getValue() >= 1 && current.getDayOfWeek().getValue() <= 5;
            
            if (isBusinessDay) {
                businessDaysCount++;
                log.debug("   Día hábil {}: {}", businessDaysCount, current.toLocalDate());
            } else {
                log.debug("   Fin de semana: {} (no cuenta)", current.toLocalDate());
            }
            
            // Si aún no completamos los 3 días hábiles, avanzar al siguiente día
            if (businessDaysCount < 3) {
                current = current.plusDays(1);
            }
        }
        
        // El plazo de gracia termina al final del tercer día hábil (23:59:59)
        LocalDateTime gracePeriodEnd = current.withHour(23).withMinute(59).withSecond(59);
        log.debug("📅 Plazo de gracia termina: {}", gracePeriodEnd);
        
        return gracePeriodEnd;
    }

    /**
     * Verifica si una inscripción puede aún cargar documentos
     */
    public boolean canUploadDocuments(Inscription inscription) {
        if (inscription == null) {
            return false;
        }

        // Si está congelada, no puede cargar documentos
        if (inscription.getFrozenDate() != null) {
            return false;
        }

        // Si está rechazada o cancelada, no puede cargar documentos
        if (inscription.getState() == InscriptionState.REJECTED || 
            inscription.getState() == InscriptionState.CANCELLED) {
            return false;
        }

        // Si tiene documentación completa, puede seguir cargando documentos
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
     * Obtiene el tiempo restante para cargar documentos
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

    /**
     * MÉTODO LEGACY - Mantener para compatibilidad hacia atrás
     * @deprecated Usar processInscriptionsAfterGracePeriod() que implementa la lógica correcta
     */
    @Deprecated
    public void freezeExpiredInscriptions() {
        log.warn("⚠️ Método legacy freezeExpiredInscriptions() llamado - redirigiendo a lógica correcta");
        processInscriptionsAfterGracePeriod();
    }
    
    /**
     * MÉTODO LEGACY - Mantener para compatibilidad
     * @deprecated La lógica correcta usa la fecha del concurso, no fechas individuales
     */
    @Deprecated
    public LocalDateTime calculateDocumentationDeadline(LocalDateTime inscriptionEndDate) {
        log.warn("⚠️ Método legacy calculateDocumentationDeadline() - debe usarse calculateGracePeriodEnd()");
        return calculateGracePeriodEnd(inscriptionEndDate);
    }
}
