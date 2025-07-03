package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;

import java.time.LocalDateTime;
import java.util.HashMap;

/**
 * Mapper para convertir entre DTOs y modelos de dominio de sesiones de inscripción
 * TEMPORALMENTE DESHABILITADO PARA DEBUGGING
 */
// @Component
public class InscriptionSessionMapper {
    /**
     * Convierte un modelo de dominio a un DTO de respuesta
     * @param session Modelo de dominio
     * @return DTO de respuesta
     */
    public InscriptionSessionResponse toResponse(InscriptionSession session) {
        return InscriptionSessionResponse.builder()
                .id(session.getId().getValue())
                .inscriptionId(session.getInscriptionId().getValue())
                .contestId(session.getContestId().getValue())
                .userId(session.getUserId().getValue())
                .currentStep(session.getCurrentStep())
                .formData(session.getFormData())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .expiresAt(session.getExpiresAt())
                .build();
    }

    /**
     * Convierte un DTO de solicitud a un modelo de dominio
     * @param request DTO de solicitud
     * @param userId ID del usuario
     * @return Modelo de dominio
     */
    public InscriptionSession toDomain(InscriptionSessionRequest request, UserId userId) {
        LocalDateTime now = LocalDateTime.now();
        return InscriptionSession.builder()
                .id(new InscriptionSessionId())
                .inscriptionId(new InscriptionId(request.getInscriptionId()))
                .contestId(new ContestId(request.getContestId()))
                .userId(userId)
                .currentStep(request.getCurrentStep())
                .formData(request.getFormData() != null ? request.getFormData() : new HashMap<>())
                .createdAt(now)
                .updatedAt(now)
                .expiresAt(now.plusHours(24))
                .build();
    }

    /**
     * Actualiza un modelo de dominio con datos de un DTO de solicitud
     * @param session Modelo de dominio a actualizar
     * @param request DTO de solicitud con los nuevos datos
     * @return Modelo de dominio actualizado
     */
    public InscriptionSession updateDomain(InscriptionSession session, InscriptionSessionRequest request) {
        session.update(request.getCurrentStep(), request.getFormData());
        return session;
    }
}
