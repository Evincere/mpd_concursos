package ar.gov.mpd.concursobackend.contest.application.validator;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.domain.service.ContestStateMachine;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestUpdateRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class ContestValidator {

    private final ContestStateMachine stateMachine;

    private static final Set<ContestStatus> VALID_STATUSES = Set.of(
        ContestStatus.DRAFT, ContestStatus.PUBLISHED, ContestStatus.ACTIVE,
        ContestStatus.PAUSED, ContestStatus.CLOSED, ContestStatus.FINISHED,
        ContestStatus.CANCELLED, ContestStatus.ARCHIVED, ContestStatus.IN_PROGRESS
    );

    public ContestValidator(ContestStateMachine stateMachine) {
        this.stateMachine = stateMachine;
    }

    private static final List<String> VALID_DEPARTMENTS = Arrays.asList(
        "INFORMATICA", "RECURSOS_HUMANOS", "CONTADURIA", "LEGAL", "ADMINISTRACION"
    );

    private static final List<String> VALID_CATEGORIES = Arrays.asList(
        "PROFESIONAL", "TECNICO", "ADMINISTRATIVO", "OPERATIVO"
    );

    /**
     * Valida un request de creación de concurso
     */
    public List<String> validateCreateRequest(ContestCreateRequest request) {
        List<String> errors = new ArrayList<>();

        // Validaciones básicas
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.add("El título es requerido");
        } else if (request.getTitle().length() > 255) {
            errors.add("El título no puede exceder 255 caracteres");
        }

        if (request.getPosition() == null || request.getPosition().trim().isEmpty()) {
            errors.add("El cargo es requerido");
        } else if (request.getPosition().length() > 255) {
            errors.add("El cargo no puede exceder 255 caracteres");
        }

        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            errors.add("La categoría es requerida");
        } else if (!VALID_CATEGORIES.contains(request.getCategory())) {
            errors.add("La categoría debe ser una de: " + String.join(", ", VALID_CATEGORIES));
        }

        if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
            errors.add("El departamento es requerido");
        } else if (!VALID_DEPARTMENTS.contains(request.getDepartment())) {
            errors.add("El departamento debe ser uno de: " + String.join(", ", VALID_DEPARTMENTS));
        }

        if (request.getDependencia() == null || request.getDependencia().trim().isEmpty()) {
            errors.add("La dependencia es requerida");
        } else if (request.getDependencia().length() > 255) {
            errors.add("La dependencia no puede exceder 255 caracteres");
        }

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            errors.add("El estado es requerido");
        } else {
            try {
                ContestStatus status = ContestStatus.fromString(request.getStatus());
                if (!VALID_STATUSES.contains(status)) {
                    errors.add("El estado debe ser uno de: " + getValidStatusNames());
                }
            } catch (IllegalArgumentException e) {
                errors.add("El estado debe ser uno de: " + getValidStatusNames());
            }
        }

        // Validaciones de fechas
        if (request.getStartDate() == null) {
            errors.add("La fecha de inicio es requerida");
        }

        if (request.getEndDate() == null) {
            errors.add("La fecha de fin es requerida");
        }

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getStartDate().isAfter(request.getEndDate())) {
                errors.add("La fecha de inicio debe ser anterior a la fecha de fin");
            }

            if (request.getStartDate().isBefore(LocalDate.now())) {
                errors.add("La fecha de inicio no puede ser anterior a la fecha actual");
            }
        }

        // Validaciones opcionales
        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            errors.add("La descripción no puede exceder 1000 caracteres");
        }

        if (request.getFunctions() != null && request.getFunctions().length() > 1000) {
            errors.add("Las funciones no pueden exceder 1000 caracteres");
        }

        if (request.getContestClass() != null && request.getContestClass().length() > 100) {
            errors.add("La clase no puede exceder 100 caracteres");
        }

        if (request.getTermsUrl() != null && request.getTermsUrl().length() > 500) {
            errors.add("La URL de términos no puede exceder 500 caracteres");
        }

        if (request.getProfileUrl() != null && request.getProfileUrl().length() > 500) {
            errors.add("La URL del perfil no puede exceder 500 caracteres");
        }

        // Validar URLs si están presentes
        if (request.getTermsUrl() != null && !request.getTermsUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getTermsUrl())) {
                errors.add("La URL de términos no es válida");
            }
        }

        if (request.getProfileUrl() != null && !request.getProfileUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getProfileUrl())) {
                errors.add("La URL del perfil no es válida");
            }
        }

        return errors;
    }

    /**
     * Valida un request de actualización de concurso
     */
    public List<String> validateUpdateRequest(ContestUpdateRequest request) {
        // Reutilizar las mismas validaciones que para crear
        ContestCreateRequest createRequest = ContestCreateRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .position(request.getPosition())
                .category(request.getCategory())
                .contestClass(request.getContestClass())
                .functions(request.getFunctions())
                .department(request.getDepartment())
                .dependencia(request.getDependencia())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .termsUrl(request.getTermsUrl())
                .profileUrl(request.getProfileUrl())
                .build();

        return validateCreateRequest(createRequest);
    }

    /**
     * Valida un cambio de estado usando la máquina de estado
     */
    public List<String> validateStatusChange(ContestStatus currentStatus, ContestStatus newStatus) {
        List<String> errors = new ArrayList<>();

        if (newStatus == null) {
            errors.add("El nuevo estado es requerido");
            return errors;
        }

        if (!VALID_STATUSES.contains(newStatus)) {
            errors.add("El estado debe ser uno de: " + getValidStatusNames());
            return errors;
        }

        // Usar la máquina de estado para validar la transición
        try {
            stateMachine.validateTransition(currentStatus, newStatus);
        } catch (IllegalStateException e) {
            errors.add(e.getMessage());
        }

        return errors;
    }

    /**
     * Obtiene los estados válidos siguientes para un estado actual
     */
    public Set<ContestStatus> getValidNextStates(ContestStatus currentStatus) {
        return stateMachine.getValidNextStates(currentStatus);
    }

    /**
     * Verifica si un estado es final
     */
    public boolean isFinalState(ContestStatus status) {
        return stateMachine.isFinalState(status);
    }

    /**
     * Verifica si un estado permite inscripciones
     */
    public boolean allowsInscriptions(ContestStatus status) {
        return stateMachine.allowsInscriptions(status);
    }



    /**
     * Valida si un concurso puede ser eliminado
     */
    public List<String> validateDeletion(Contest contest) {
        List<String> errors = new ArrayList<>();

        if (contest.getStatus() != ContestStatus.DRAFT) {
            errors.add("Solo se pueden eliminar concursos en estado DRAFT");
        }

        // Nota: La verificación de inscripciones se realiza a nivel de servicio
        // donde se tiene acceso al repositorio de inscripciones

        return errors;
    }

    /**
     * Obtiene los nombres de estados válidos como string
     */
    private String getValidStatusNames() {
        return VALID_STATUSES.stream()
                .map(ContestStatus::name)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    /**
     * Valida si una URL es válida
     */
    private boolean isValidUrl(String url) {
        try {
            java.net.URI.create(url).toURL();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
