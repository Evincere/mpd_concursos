package ar.gov.mpd.concursobackend.contest.infrastructure.mapper;

import ar.gov.mpd.concursobackend.contest.application.dto.ContestDateDTO;
import ar.gov.mpd.concursobackend.contest.domain.ContestDate;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestDateEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDTO;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestUpdateRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class ContestMapper {

    public Contest toDomain(ContestEntity entity) {
        if (entity == null) {
            return null;
        }

        // Crear lista de posiciones desde el campo position de la entidad
        List<ar.gov.mpd.concursobackend.contest.domain.model.ContestPosition> positions = new ArrayList<>();
        if (entity.getPosition() != null) {
            // TODO: Implementar mapeo completo de posiciones cuando se requiera
        }

        return Contest.builder()
            .id(entity.getId())
            .title(entity.getTitle())
            .description(entity.getFunctions()) // Mapear functions a description
            .requirements(entity.getFunctions()) // Usar functions como requirements también
            .location(entity.getPosition()) // Mapear position a location
            .district(entity.getDepartment()) // Mapear department a district
            .category(entity.getCategory())
            .dependency(entity.getDepartment())
            .contestClass(entity.getClass_()) // Mapear class_ a contestClass
            .status(entity.getStatus())
            .startDate(entity.getStartDate() != null ? entity.getStartDate().atStartOfDay() : null)
            .endDate(entity.getEndDate() != null ? entity.getEndDate().atStartOfDay() : null)
            .inscriptionStartDate(entity.getStartDate() != null ? entity.getStartDate().atStartOfDay() : null)
            .inscriptionEndDate(entity.getEndDate() != null ? entity.getEndDate().atStartOfDay() : null)
            .documents(new ArrayList<>()) // TODO: Mapear documentos cuando se implemente
            .positions(positions)
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }

    public ContestEntity toEntity(Contest domain) {
        if (domain == null) return null;

        // Extraer la primera posición de la lista de posiciones
        String position = "No especificado";
        if (domain.getPositions() != null && !domain.getPositions().isEmpty()) {
            position = domain.getPositions().get(0).getTitle();
        } else if (domain.getLocation() != null) {
            position = domain.getLocation(); // Usar location como fallback
        }

        return ContestEntity.builder()
            .id(domain.getId())
            .title(domain.getTitle())
            .category(domain.getCategory())
            .class_(domain.getContestClass()) // Mapear contestClass a class_
            .functions(domain.getDescription()) // Usar description como functions
            .status(domain.getStatus())
            .department(domain.getDependency())
            .position(position)
            .startDate(domain.getStartDate() != null ? domain.getStartDate().toLocalDate() : null)
            .endDate(domain.getEndDate() != null ? domain.getEndDate().toLocalDate() : null)
            .basesUrl(null) // TODO: Agregar al modelo principal si es necesario
            .descriptionUrl(null) // TODO: Agregar al modelo principal si es necesario
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .build();
    }

    public ContestDTO toDTO(Contest domain) {
        if (domain == null) return null;

        // Extraer solo el cargo base sin la clase
        String position = extractBasePosition(domain.getLocation());

        return ContestDTO.builder()
            .id(domain.getId())
            .title(domain.getTitle())
            .description(domain.getDescription())
            .requirements(domain.getRequirements())
            .location(domain.getLocation())
            .district(domain.getDistrict())
            .category(domain.getCategory())
            .class_(domain.getContestClass()) // Mapear contestClass a class_
            .functions(domain.getDescription()) // Usar description como functions
            .status(domain.getStatus() != null ? domain.getStatus().name() : null)
            .position(position)
            .dependency(domain.getDependency())
            .department(domain.getDependency()) // Usar dependency como department
            .startDate(domain.getStartDate() != null ? domain.getStartDate().toLocalDate() : null)
            .endDate(domain.getEndDate() != null ? domain.getEndDate().toLocalDate() : null)
            .inscriptionStartDate(domain.getInscriptionStartDate() != null ? domain.getInscriptionStartDate().toLocalDate() : null)
            .inscriptionEndDate(domain.getInscriptionEndDate() != null ? domain.getInscriptionEndDate().toLocalDate() : null)
            .examDate(domain.getExamDate() != null ? domain.getExamDate().toLocalDate() : null)
            .resultsDate(domain.getResultsDate() != null ? domain.getResultsDate().toLocalDate() : null)
            .active(domain.isActive())
            .cancelled(domain.isCancelled())
            .finished(domain.isFinished())
            .currentStatus(domain.getCurrentStatus() != null ? domain.getCurrentStatus().name() : null)
            .inscriptionOpen(domain.isInscriptionOpen())
            .basesUrl(null) // TODO: Agregar al modelo principal si es necesario
            .descriptionUrl(null) // TODO: Agregar al modelo principal si es necesario
            .documents(new ArrayList<>()) // TODO: Mapear documentos cuando se implemente
            .positions(new ArrayList<>()) // TODO: Mapear posiciones cuando se implemente
            .dates(new ArrayList<>()) // TODO: Mapear fechas cuando se implemente
            .build();
    }

    private ContestDate toDomainDate(ContestDateEntity dateEntity) {
        if (dateEntity == null) {
            return null;
        }
        return ContestDate.builder()
            .id(dateEntity.getId())
            .label(dateEntity.getLabel())
            .type(dateEntity.getType())
            .startDate(dateEntity.getStartDate())
            .endDate(dateEntity.getEndDate())
            .build();
    }

    private ContestDateEntity toEntityDate(ContestDate date) {
        if (date == null) {
            return null;
        }
        return ContestDateEntity.builder()
            .id(date.getId())
            .label(date.getLabel())
            .type(date.getType())
            .startDate(date.getStartDate())
            .endDate(date.getEndDate())
            .build();
    }

    private ContestDateDTO toDateDTO(ContestDate date) {
        if (date == null) {
            return null;
        }
        return ContestDateDTO.builder()
            .id(date.getId())
            .label(date.getLabel())
            .type(date.getType())
            .startDate(date.getStartDate())
            .endDate(date.getEndDate())
            .build();
    }

    // Métodos para los nuevos DTOs de administración

    /**
     * Convierte un Contest a ContestResponse
     */
    public ContestResponse toResponse(Contest contest) {
        if (contest == null) {
            return null;
        }

        // Extraer la primera posición de la lista de posiciones
        String position = "No especificado";
        if (contest.getPositions() != null && !contest.getPositions().isEmpty()) {
            position = contest.getPositions().get(0).getTitle();
        } else if (contest.getLocation() != null) {
            position = contest.getLocation();
        }

        return ContestResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .description(contest.getDescription()) // Usar description del modelo principal
                .position(position)
                .category(contest.getCategory())
                .contestClass(contest.getDescription()) // Mapear description a contestClass
                .functions(contest.getDescription()) // Usar description como functions
                .department(contest.getDependency())
                .dependencia(contest.getDependency())
                .status(contest.getStatus() != null ? contest.getStatus().name() : null)
                .startDate(contest.getStartDate() != null ? contest.getStartDate().toLocalDate() : null)
                .endDate(contest.getEndDate() != null ? contest.getEndDate().toLocalDate() : null)
                .termsUrl(null) // TODO: Agregar al modelo principal si es necesario
                .profileUrl(null) // TODO: Agregar al modelo principal si es necesario
                .createdAt(contest.getCreatedAt() != null ? contest.getCreatedAt() : LocalDateTime.now())
                .updatedAt(contest.getUpdatedAt() != null ? contest.getUpdatedAt() : LocalDateTime.now())
                .createdBy("system") // TODO: Obtener del contexto de seguridad
                .updatedBy("system")
                .totalInscriptions(0) // TODO: Calcular desde inscripciones
                .isActive(isActiveStatus(contest.getStatus()))
                .allowsInscriptions(allowsInscriptions(contest.getStatus()))
                .build();
    }

    /**
     * Convierte directamente un ContestEntity a ContestResponse
     * MAPEO DIRECTO para evitar problemas de conversión
     */
    public ContestResponse toResponseFromEntity(ContestEntity entity) {
        if (entity == null) {
            return null;
        }

        return ContestResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getFunctions()) // Usar functions como description
                .position(entity.getPosition()) // Mapeo directo del campo position
                .category(entity.getCategory()) // Mapeo directo del campo category
                .contestClass(entity.getClass_()) // Mapeo directo del campo class_
                .functions(entity.getFunctions()) // Mapeo directo del campo functions
                .department(entity.getDepartment()) // Mapeo directo del campo department
                .dependencia(entity.getDepartment()) // Compatibilidad
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .termsUrl(entity.getBasesUrl())
                .profileUrl(entity.getDescriptionUrl())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now())
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt() : LocalDateTime.now())
                .createdBy("system") // TODO: Obtener del contexto de seguridad
                .updatedBy("system")
                .totalInscriptions(0) // TODO: Calcular desde inscripciones
                .isActive(isActiveStatus(entity.getStatus()))
                .allowsInscriptions(allowsInscriptions(entity.getStatus()))
                .build();
    }

    /**
     * Convierte un ContestCreateRequest a Contest
     */
    public Contest fromCreateRequest(ContestCreateRequest request) {
        if (request == null) {
            return null;
        }

        return Contest.builder()
                .title(request.getTitle())
                .description(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .requirements(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .location(request.getPosition())
                .district(request.getDepartment())
                .category(request.getCategory())
                .dependency(request.getDepartment())
                .status(ContestStatus.fromString(request.getStatus()))
                .startDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null)
                .endDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null)
                .inscriptionStartDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null)
                .inscriptionEndDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null)
                .documents(new ArrayList<>())
                .positions(new ArrayList<>()) // TODO: Crear posiciones desde request.getPosition()
                .build();
    }

    /**
     * Convierte un ContestUpdateRequest a Contest
     */
    public Contest fromUpdateRequest(ContestUpdateRequest request) {
        if (request == null) {
            return null;
        }

        return Contest.builder()
                .title(request.getTitle())
                .description(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .requirements(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .location(request.getPosition())
                .district(request.getDepartment())
                .category(request.getCategory())
                .dependency(request.getDepartment())
                .status(ContestStatus.fromString(request.getStatus()))
                .startDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null)
                .endDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null)
                .inscriptionStartDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null)
                .inscriptionEndDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null)
                .documents(new ArrayList<>())
                .positions(new ArrayList<>()) // TODO: Crear posiciones desde request.getPosition()
                .build();
    }

    /**
     * Verifica si un estado representa un concurso activo
     * Usa los nuevos estados pero mantiene compatibilidad con legacy
     */
    private boolean isActiveStatus(ContestStatus status) {
        return status == ContestStatus.ACTIVE;
    }

    /**
     * Verifica si un estado permite inscripciones
     * Usa los nuevos estados pero mantiene compatibilidad con legacy
     */
    private boolean allowsInscriptions(ContestStatus status) {
        return status == ContestStatus.ACTIVE;
    }

    /**
     * Extrae el cargo base sin la clase del campo location/position
     * Ejemplo: "Co-Defensor/a Civil - Clase 03" → "Co-Defensor/a Civil"
     */
    private String extractBasePosition(String location) {
        if (location == null || location.trim().isEmpty()) {
            return "No especificado";
        }

        // Buscar el patrón "- Clase XX" y removerlo
        String basePosition = location.replaceAll("\\s*-\\s*Clase\\s+\\d+.*$", "").trim();

        return basePosition.isEmpty() ? "No especificado" : basePosition;
    }
}