package ar.gov.mpd.concursobackend.contest.infrastructure.mapper;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.UUID;

/**
 * MAPPER DE COMPATIBILIDAD TEMPORAL
 * Convierte entre el modelo principal (UUID) y el modelo legacy (Long)
 * durante la migración gradual del sistema.
 * 
 * TODO: Eliminar cuando se complete la migración al modelo principal
 */
@Component
public class ContestModelMapper {

    /**
     * Convierte del modelo principal (UUID) al modelo legacy (Long)
     *
     * @param principal Modelo principal con UUID
     * @return Modelo legacy con Long ID
     */
    public Contest toLegacy(ar.gov.mpd.concursobackend.contest.domain.model.Contest principal) {
        if (principal == null) {
            return null;
        }

        // Convertir UUID a Long usando hashCode como aproximación
        Long legacyId = principal.getId() != null ?
            Math.abs(principal.getId().hashCode()) % Long.MAX_VALUE : null;

        return Contest.builder()
            .id(legacyId)
            .title(principal.getTitle())
            .category(principal.getCategory())
            .class_(principal.getDescription()) // Mapear description a class_
            .functions(principal.getDescription()) // Usar description como functions
            .status(principal.getStatus())
            .position(extractPosition(principal)) // Extraer posición de la lista
            .dependency(principal.getDependency())
            .startDate(principal.getStartDate() != null ? principal.getStartDate().toLocalDate() : null)
            .endDate(principal.getEndDate() != null ? principal.getEndDate().toLocalDate() : null)
            .basesUrl(null) // TODO: Agregar al modelo principal
            .descriptionUrl(null) // TODO: Agregar al modelo principal
            .dates(new ArrayList<>()) // TODO: Mapear fechas cuando se implemente
            .build();
    }

    /**
     * Convierte del modelo legacy (Long) al modelo principal (UUID)
     *
     * @param legacy Modelo legacy con Long ID
     * @return Modelo principal con UUID
     */
    public ar.gov.mpd.concursobackend.contest.domain.model.Contest toPrincipal(Contest legacy) {
        if (legacy == null) {
            return null;
        }

        // Generar UUID determinístico basado en el Long ID
        UUID principalId = legacy.getId() != null ?
            UUID.nameUUIDFromBytes(legacy.getId().toString().getBytes()) :
            UUID.randomUUID();

        return ar.gov.mpd.concursobackend.contest.domain.model.Contest.builder()
            .id(principalId)
            .title(legacy.getTitle())
            .description(legacy.getFunctions()) // Usar functions como description
            .requirements(legacy.getFunctions()) // Usar functions como requirements también
            .location(legacy.getPosition()) // Mapear position a location
            .district(legacy.getDependency()) // Usar dependency como district
            .category(legacy.getCategory())
            .dependency(legacy.getDependency())
            .status(legacy.getStatus())
            .startDate(legacy.getStartDate() != null ? legacy.getStartDate().atStartOfDay() : null)
            .endDate(legacy.getEndDate() != null ? legacy.getEndDate().atStartOfDay() : null)
            .inscriptionStartDate(legacy.getStartDate() != null ? legacy.getStartDate().atStartOfDay() : null)
            .inscriptionEndDate(legacy.getEndDate() != null ? legacy.getEndDate().atStartOfDay() : null)
            .documents(new ArrayList<>()) // TODO: Mapear documentos cuando se implemente
            .positions(new ArrayList<>()) // TODO: Mapear posiciones cuando se implemente
            .build();
    }

    /**
     * Extrae la primera posición de la lista de posiciones del modelo principal
     *
     * @param principal Modelo principal
     * @return Nombre de la posición o valor por defecto
     */
    private String extractPosition(ar.gov.mpd.concursobackend.contest.domain.model.Contest principal) {
        if (principal.getPositions() != null && !principal.getPositions().isEmpty()) {
            return principal.getPositions().get(0).getTitle();
        }
        return "No especificado";
    }

    /**
     * Verifica si un concurso permite inscripciones basado en el estado
     * 
     * @param status Estado del concurso
     * @return true si permite inscripciones, false en caso contrario
     */
    public boolean allowsInscriptions(ContestStatus status) {
        return ContestStatus.ACTIVE.equals(status) || 
               ContestStatus.PUBLISHED.equals(status);
    }
}
