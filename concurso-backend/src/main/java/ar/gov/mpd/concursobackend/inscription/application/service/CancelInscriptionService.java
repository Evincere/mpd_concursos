package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionStateMachine;
import ar.gov.mpd.concursobackend.inscription.domain.exception.InscriptionCannotBeCancelledException;
import ar.gov.mpd.concursobackend.inscription.domain.exception.InscriptionNotFoundException;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CancelInscriptionService implements CancelInscriptionUseCase {
        private final InscriptionRepository inscriptionRepository;
        private final ContestRepository contestRepository;
        private final SendNotificationUseCase notificationService;
        private final IUserService userService;
        private final SecurityUtils securityUtils;
        private final InscriptionStateMachine stateMachine;

        @Override
        public void cancel(UUID id) {
                log.debug("Iniciando proceso de cancelación de inscripción con ID: {}", id);

                if (id == null) {
                        log.error("ID de inscripción nulo");
                        throw new IllegalArgumentException("El ID de inscripción no puede ser nulo");
                }

                // ✅ VALIDACIÓN CENTRALIZADA CON SEGURIDAD
                String currentUserId = securityUtils.getCurrentUserId();
                var inscription = inscriptionRepository.findById(id)
                        .orElseThrow(() -> {
                                log.error("No se encontró la inscripción con ID: {}", id);
                                return new InscriptionNotFoundException("Inscripción no encontrada o sin permisos de acceso");
                        });

                // ✅ VALIDAR PROPIEDAD DE LA INSCRIPCIÓN
                if (!inscription.getUserId().getValue().toString().equals(currentUserId)) {
                        log.error("Usuario {} intentó cancelar inscripción que no le pertenece: {}", currentUserId, id);
                        throw new InscriptionNotFoundException("Inscripción no encontrada o sin permisos de acceso");
                }

                log.debug("Inscripción encontrada: {}", inscription);
                log.debug("Estado actual de la inscripción: {}", inscription.getState());

                // ✅ VERIFICAR SI YA ESTÁ CANCELADA (IDEMPOTENCIA)
                if (inscription.getState() == InscriptionState.CANCELLED) {
                        log.info("La inscripción {} ya está cancelada, operación idempotente", id);
                        return;
                }

                // ✅ VALIDAR TRANSICIÓN DE ESTADO USANDO STATEMACHINE
                try {
                        stateMachine.validateTransition(inscription.getState(), InscriptionState.CANCELLED);
                } catch (IllegalStateException e) {
                        log.error("Transición de estado inválida para inscripción {}: {} -> CANCELLED",
                                id, inscription.getState());
                        throw new InscriptionCannotBeCancelledException(inscription.getState());
                }

                // ✅ OPERACIÓN CRÍTICA: Cancelar inscripción
                try {
                        inscription.cancel();
                        inscriptionRepository.save(inscription);
                        log.info("Inscripción {} cancelada exitosamente por usuario {}", id, currentUserId);
                } catch (Exception e) {
                        log.error("Error al cancelar la inscripción en la base de datos: {}", e.getMessage(), e);
                        throw new RuntimeException("Error al guardar la inscripción cancelada", e);
                }

                // ✅ OPERACIÓN SECUNDARIA: Enviar notificación en transacción separada
                try {
                        sendCancellationNotificationAsync(inscription);
                } catch (Exception e) {
                        // No fallar la operación principal si la notificación falla
                        log.warn("Error al programar notificación de cancelación para inscripción {}: {}",
                                id, e.getMessage());
                }

        }

        /**
         * ✅ MÉTODO ASÍNCRONO: Envía notificación de cancelación en transacción separada
         * Esto evita que errores en notificaciones afecten la operación principal
         */
        @Async
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void sendCancellationNotificationAsync(Inscription inscription) {
                try {
                        log.debug("Enviando notificación de cancelación para inscripción: {}", inscription.getId());

                        // Obtener información del concurso
                        Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                                .orElseThrow(() -> {
                                        log.error("No se encontró el concurso con ID: {}", inscription.getContestId().getValue());
                                        return new IllegalArgumentException("Concurso no encontrado");
                                });

                        // Obtener información del usuario
                        User user = userService.getByUsername(new UserUsername(securityUtils.getCurrentUsername()))
                                .orElseThrow(() -> {
                                        log.error("No se encontró el usuario con username: {}", securityUtils.getCurrentUsername());
                                        return new IllegalArgumentException("Usuario no encontrado");
                                });

                        // Crear y enviar notificación
                        NotificationRequest notificationRequest = NotificationRequest.builder()
                                .recipientUsername(user.getUsername().value())
                                .subject("Postulación Cancelada - " + contest.getTitle())
                                .content(String.format(
                                        "Tu postulación al concurso '%s' ha sido cancelada.\n\n" +
                                        "Detalles del concurso:\n" +
                                        "- Cargo: %s\n" +
                                        "- Dependencia: %s\n\n" +
                                        "Si tienes alguna consulta, puedes contactar al administrador.",
                                        contest.getTitle(),
                                        contest.getLocation() != null ? contest.getLocation() : "No especificado",
                                        contest.getDependency()))
                                .type(NotificationType.INSCRIPTION)
                                .acknowledgementLevel(AcknowledgementLevel.NONE)
                                .build();

                        notificationService.sendNotification(notificationRequest);
                        log.info("Notificación de cancelación enviada exitosamente para inscripción: {}", inscription.getId());

                } catch (Exception e) {
                        log.error("Error al enviar notificación de cancelación para inscripción {}: {}",
                                inscription.getId(), e.getMessage(), e);
                        // No relanzamos la excepción para evitar afectar la transacción principal
                }
        }
}
