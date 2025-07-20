package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CancelInscriptionService implements CancelInscriptionUseCase {
        private final InscriptionStateService stateService;
        private final InscriptionNotificationManager notificationManager;

        @Override
        public void cancel(UUID id) {
                log.debug("Iniciando proceso de cancelación de inscripción con ID: {}", id);

                if (id == null) {
                        log.error("ID de inscripción nulo");
                        throw new IllegalArgumentException("El ID de inscripción no puede ser nulo");
                }

                // ✅ DELEGACIÓN AL SERVICIO UNIFICADO: Maneja todas las validaciones y cambio de estado
                Inscription cancelledInscription = stateService.cancelInscription(id);

                // ✅ OPERACIÓN SECUNDARIA: Enviar notificación usando el manager centralizado
                try {
                        notificationManager.sendCancellationNotificationAsync(cancelledInscription);
                } catch (Exception e) {
                        // No fallar la operación principal si la notificación falla
                        log.warn("Error al programar notificación de cancelación para inscripción {}: {}",
                                id, e.getMessage());
                }

        }
}
