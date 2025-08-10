package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
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
 * VERSIÓN CORREGIDA - Implementa lógica de negocio correcta:
 * 
 * 1. Los 3 días hábiles se cuentan desde el CIERRE DEL CONCURSO (no desde inscripción individual)
 * 2. Al vencimiento: COMPLETED_PENDING_DOCS → REJECTED (no FROZEN)
 * 3. Congelación de TODAS las inscripciones para revisión administrativa
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
     * Se ejecuta cada hora
     */
    @Scheduled(fixedRate = 3600000) // Cada hora
    @Transactional
    public void processInscriptionsAfterGracePeriod() {
        log.info("🔍 Verificando plazos de gracia post-inscripción");

        // Buscar concursos cerrados que podrían tener plazos vencidos
        List<Contest> closedContests = contestRepository.findByStatus(ContestStatus.CLOSED);
        
        for (Contest contest : closedContests) {
            processContestInscriptionsIfGracePeriodExpired(contest);
        }
        
        log.info("✅ Verificación de plazos completada");
    }

    /**
     * Procesa las inscripciones de un concurso específico si el plazo de gracia ha vencido
     * LÓGICA CORRECTA DEL NEGOCIO
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

        // Verificar si ya se procesó este concurso
        if (contestAlreadyProcessed(contest.getId())) {
            log.debug("Concurso {} ya fue procesado anteriormente", contest.getTitle());
            return;
        }

        log.info("🚨 PROCESANDO concurso {} - Plazo de gracia VENCIDO", contest.getTitle());

        // Procesar todas las inscripciones del concurso
        processInscriptionsForContest(contest);
        
        log.info("✅ Concurso {} procesado completamente", contest.getTitle());
    }

    /**
     * Procesa todas las inscripciones de un concurso después del vencimiento del plazo de gracia
     * IMPLEMENTA LA LÓGICA CORRECTA DE NEGOCIO
     */
    @Transactional
    public void processInscriptionsForContest(Contest contest) {
        // 1. Obtener todas las inscripciones del concurso
        List<Inscription> allInscriptions = inscriptionRepository.findByContestId(contest.getId());
        
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
                    inscription.addNote("Rechazada automáticamente por no completar documentación requerida dentro del plazo perentorio de 3 días hábiles posterior al cierre de inscripciones.");
                    
                    inscriptionRepository.save(inscription);
                    rejectedCount++;
                    
                    log.info("❌ Inscripción {} RECHAZADA por documentación pendiente", inscription.getId());
                    
                    // Enviar notificación de rechazo automático
                    sendRejectionNotification(inscription, contest);
                }
                
                // REGLA DE NEGOCIO: Congelar TODAS las inscripciones (excepto las ya canceladas)
                // para que no se puedan modificar más - fase de evaluación administrativa
                if (currentState != InscriptionState.CANCELLED && inscription.getFrozenDate() == null) {
                    inscription.setFrozenDate(LocalDateTime.now());
                    inscription.setLastUpdated(LocalDateTime.now());
                    
                    // Agregar nota de congelación
                    inscription.addNote("Congelada para evaluación administrativa - fin del período de gracia para documentación.");
                    
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
        
        // Marcar concurso como procesado
        markContestAsProcessed(contest);
    }

    /**
     * Calcula el fin del plazo de gracia: 3 días hábiles después del cierre de inscripción
     * LÓGICA CORRECTA: Se cuenta desde el cierre del concurso, no desde inscripciones individuales
     * 
     * @param contestEndDate Fecha de cierre de inscripción del concurso
     * @return Fecha de fin del plazo de gracia
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
     * Verifica si un concurso ya fue procesado para evitar reprocesamiento
     */
    private boolean contestAlreadyProcessed(Long contestId) {
        // Un concurso se considera procesado si tiene inscripciones congeladas por plazo vencido
        // Verificamos si existen inscripciones con frozen_date establecido
        List<Inscription> frozenInscriptions = inscriptionRepository.findByContestIdAndFrozenDateNotNull(contestId);
        
        boolean alreadyProcessed = !frozenInscriptions.isEmpty();
        
        if (alreadyProcessed) {
            log.debug("🔒 Concurso {} ya procesado - {} inscripciones congeladas", contestId, frozenInscriptions.size());
        }
        
        return alreadyProcessed;
    }

    /**
     * Marca un concurso como procesado (a través de inscripciones congeladas)
     */
    private void markContestAsProcessed(Contest contest) {
        log.info("✅ Concurso {} marcado como procesado - inscripciones congeladas", contest.getId());
    }

    /**
     * Envía notificación de rechazo automático por documentación incompleta
     */
    private void sendRejectionNotification(Inscription inscription, Contest contest) {
        try {
            String reason = "Su inscripción fue rechazada automáticamente por no completar la documentación requerida " +
                          "dentro del plazo perentorio de 3 días hábiles posterior al cierre de inscripciones.";
            
            notificationService.notifyUserAboutInscriptionRejected(inscription, contest, reason);
            log.info("📧 Notificación de rechazo enviada para inscripción {}", inscription.getId());
        } catch (Exception e) {
            log.error("❌ Error enviando notificación de rechazo para inscripción {}: {}", 
                     inscription.getId(), e.getMessage(), e);
        }
    }

    // ============================================================================
    // MÉTODOS AUXILIARES PARA CONSULTAS Y VERIFICACIONES
    // ============================================================================

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
     * Obtiene información sobre el estado del plazo de gracia para un concurso
     */
    public GracePeriodInfo getGracePeriodInfo(Contest contest) {
        if (contest == null || contest.getInscriptionEndDate() == null) {
            return null;
        }

        LocalDateTime gracePeriodEnd = calculateGracePeriodEnd(contest.getInscriptionEndDate());
        LocalDateTime now = LocalDateTime.now();
        
        boolean isExpired = now.isAfter(gracePeriodEnd);
        long hoursRemaining = isExpired ? 0 : java.time.Duration.between(now, gracePeriodEnd).toHours();
        
        return new GracePeriodInfo(
            contest.getId(),
            contest.getInscriptionEndDate(),
            gracePeriodEnd,
            isExpired,
            hoursRemaining
        );
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

    // ============================================================================
    // CLASE AUXILIAR PARA INFORMACIÓN DEL PLAZO DE GRACIA
    // ============================================================================
    
    /**
     * DTO para información del plazo de gracia
     */
    public static class GracePeriodInfo {
        private Long contestId;
        private LocalDateTime inscriptionEndDate;
        private LocalDateTime gracePeriodEnd;
        private boolean isExpired;
        private long hoursRemaining;

        public GracePeriodInfo(Long contestId, LocalDateTime inscriptionEndDate, 
                              LocalDateTime gracePeriodEnd, boolean isExpired, long hoursRemaining) {
            this.contestId = contestId;
            this.inscriptionEndDate = inscriptionEndDate;
            this.gracePeriodEnd = gracePeriodEnd;
            this.isExpired = isExpired;
            this.hoursRemaining = hoursRemaining;
        }

        // Getters
        public Long getContestId() { return contestId; }
        public LocalDateTime getInscriptionEndDate() { return inscriptionEndDate; }
        public LocalDateTime getGracePeriodEnd() { return gracePeriodEnd; }
        public boolean isExpired() { return isExpired; }
        public long getHoursRemaining() { return hoursRemaining; }
    }
}
