package ar.gov.mpd.concursobackend.contest.infrastructure.scheduler;

import ar.gov.mpd.concursobackend.contest.application.ContestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler para actualizar automáticamente los estados de concursos basándose en fechas
 * 
 * Este scheduler se ejecuta periódicamente para:
 * - Cambiar concursos de SCHEDULED a ACTIVE cuando llega la fecha de inicio
 * - Cambiar concursos de ACTIVE a CLOSED cuando pasa la fecha de fin
 * 
 * REFACTORING: Implementación de actualización automática de estados
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
@Order(400) // Se ejecuta después de la inicialización de datos
public class ContestStatusScheduler implements CommandLineRunner {

    private final ContestService contestService;

    /**
     * Ejecuta una actualización inicial al iniciar la aplicación
     */
    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 [ContestStatusScheduler] Ejecutando actualización inicial de estados al iniciar la aplicación");

        try {
            // Esperar un poco para que la aplicación termine de inicializarse
            Thread.sleep(5000); // 5 segundos

            contestService.updateContestStatusesBasedOnDates();
            log.info("✅ [ContestStatusScheduler] Actualización inicial completada exitosamente");
        } catch (Exception e) {
            log.error("❌ [ContestStatusScheduler] Error durante actualización inicial", e);
        }
    }

    /**
     * Actualiza los estados de concursos cada 15 minutos
     * 
     * Frecuencia: 15 minutos (900,000 ms)
     * Razón: Balance entre responsividad y carga del sistema
     */
    @Scheduled(fixedRate = 900000) // 15 minutos = 900,000 ms
    public void updateContestStatuses() {
        log.debug("🔄 [ContestStatusScheduler] Iniciando actualización programada de estados de concursos");
        
        try {
            contestService.updateContestStatusesBasedOnDates();
            log.debug("✅ [ContestStatusScheduler] Actualización programada completada exitosamente");
        } catch (Exception e) {
            log.error("❌ [ContestStatusScheduler] Error durante actualización programada de estados", e);
        }
    }

    /**
     * Actualización más frecuente durante horas laborales (8:00 - 18:00)
     * Se ejecuta cada 5 minutos durante el horario laboral para mayor responsividad
     */
    @Scheduled(cron = "0 */5 8-18 * * MON-FRI") // Cada 5 minutos, 8-18h, lunes a viernes
    public void updateContestStatusesBusinessHours() {
        log.debug("🕐 [ContestStatusScheduler] Actualización en horario laboral");
        
        try {
            contestService.updateContestStatusesBasedOnDates();
        } catch (Exception e) {
            log.error("❌ [ContestStatusScheduler] Error durante actualización en horario laboral", e);
        }
    }

    /**
     * Actualización al inicio del día (6:00 AM)
     * Para asegurar que los cambios de estado se reflejen al comenzar el día
     */
    @Scheduled(cron = "0 0 6 * * *") // Todos los días a las 6:00 AM
    public void dailyContestStatusUpdate() {
        log.info("🌅 [ContestStatusScheduler] Actualización diaria de estados de concursos");
        
        try {
            contestService.updateContestStatusesBasedOnDates();
            log.info("✅ [ContestStatusScheduler] Actualización diaria completada");
        } catch (Exception e) {
            log.error("❌ [ContestStatusScheduler] Error durante actualización diaria", e);
        }
    }
}
