package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionSessionEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

/**
 * Mapper para convertir entre entidades y modelos de dominio de sesiones de inscripción
 * TEMPORALMENTE DESHABILITADO PARA DEBUGGING
 */
// @Component
public class InscriptionSessionEntityMapper {
    private final ObjectMapper objectMapper;

    public InscriptionSessionEntityMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }



    /**
     * Convierte un modelo de dominio a una entidad JPA
     * @param session Modelo de dominio
     * @return Entidad JPA
     */
    public InscriptionSessionEntity toEntity(InscriptionSession session) {
        InscriptionSessionEntity entity = new InscriptionSessionEntity();
        entity.setId(session.getId().getValue());
        entity.setInscriptionId(session.getInscriptionId().getValue());
        entity.setContestId(session.getContestId().getValue());
        entity.setUserId(session.getUserId().getValue());
        entity.setCurrentStep(session.getCurrentStep());
        entity.setCreatedAt(session.getCreatedAt());
        entity.setUpdatedAt(session.getUpdatedAt());
        entity.setExpiresAt(session.getExpiresAt());

        try {
            entity.setFormData(objectMapper.writeValueAsString(session.getFormData()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al serializar los datos del formulario", e);
        }

        return entity;
    }

    /**
     * Convierte una entidad JPA a un modelo de dominio
     * @param entity Entidad JPA
     * @return Modelo de dominio
     */
    public InscriptionSession toDomain(InscriptionSessionEntity entity) {
        Map<String, Object> formData;
        try {
            formData = objectMapper.readValue(entity.getFormData(), new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            formData = new HashMap<>();
        }

        return InscriptionSession.builder()
                .id(new InscriptionSessionId(entity.getId()))
                .inscriptionId(new InscriptionId(entity.getInscriptionId()))
                .contestId(new ContestId(entity.getContestId()))
                .userId(new UserId(entity.getUserId()))
                .currentStep(entity.getCurrentStep())
                .formData(formData)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .expiresAt(entity.getExpiresAt())
                .build();
    }
}
