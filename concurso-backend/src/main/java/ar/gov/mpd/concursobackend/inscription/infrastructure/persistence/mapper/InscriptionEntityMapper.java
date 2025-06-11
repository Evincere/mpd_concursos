package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.UUID;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring", imports = {
        InscriptionId.class,
        ContestId.class,
        UserId.class,
        UUID.class,
        InscriptionState.class
})
public interface InscriptionEntityMapper {

    @Mapping(target = "id", expression = "java(domain.getId().getValue())")
    @Mapping(target = "contestId", source = "contestId")
    @Mapping(target = "userId", expression = "java(domain.getUserId().getValue())")
    @Mapping(target = "status", source = "state")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "lastUpdated")
    @Mapping(target = "inscriptionDate", source = "inscriptionDate")
    @Mapping(target = "centroDeVida", expression = "java(domain.getPreferences() != null ? domain.getPreferences().getCentroDeVida() : null)")
    InscriptionEntity toEntity(Inscription domain);

    @Mapping(target = "preferences.centroDeVida", source = "centroDeVida")
    default Inscription toDomain(InscriptionEntity entity) {
        if (entity == null) {
            return null;
        }

        InscriptionId id = new InscriptionId(entity.getId());
        ContestId contestId = new ContestId(entity.getContestId());
        UserId userId = new UserId(entity.getUserId());
        InscriptionState state = map(entity.getStatus());

        return createInscription(
            id,
            contestId,
            userId,
            state,
            entity.getInscriptionDate(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }



    // Método para convertir ContestId a Long
    default Long map(ContestId value) {
        return value.getValue();
    }

    // Método para convertir InscriptionState a InscriptionStatus
    default InscriptionStatus map(InscriptionState state) {
        if (state == null) {
            return InscriptionStatus.ACTIVE;
        }

        // REFACTORING: Solo estados estándar después de eliminar legacy
        switch (state) {
            case ACTIVE:
                return InscriptionStatus.ACTIVE;
            case PENDING:
                return InscriptionStatus.PENDING;
            case COMPLETED_WITH_DOCS:
                return InscriptionStatus.COMPLETED_WITH_DOCS;
            case COMPLETED_PENDING_DOCS:
                return InscriptionStatus.COMPLETED_PENDING_DOCS;
            case FROZEN:
                return InscriptionStatus.FROZEN;
            case APPROVED:
                return InscriptionStatus.APPROVED;
            case REJECTED:
                return InscriptionStatus.REJECTED;
            case CANCELLED:
                return InscriptionStatus.CANCELLED;
            default:
                return InscriptionStatus.ACTIVE;
        }
    }

    // Método para convertir InscriptionStatus a InscriptionState
    default InscriptionState map(InscriptionStatus status) {
        if (status == null) {
            return InscriptionState.ACTIVE;
        }

        switch (status) {
            case ACTIVE:
                return InscriptionState.ACTIVE;
            case PENDING:
                return InscriptionState.PENDING;
            case COMPLETED_WITH_DOCS:
                return InscriptionState.COMPLETED_WITH_DOCS;
            case COMPLETED_PENDING_DOCS:
                return InscriptionState.COMPLETED_PENDING_DOCS;
            case FROZEN:
                return InscriptionState.FROZEN;
            case APPROVED:
                return InscriptionState.APPROVED;
            case REJECTED:
                return InscriptionState.REJECTED;
            case CANCELLED:
                return InscriptionState.CANCELLED;
            default:
                return InscriptionState.ACTIVE;
        }
    }

    // Método para crear una instancia de Inscription con el estado correcto
    default Inscription createInscription(InscriptionId id, ContestId contestId, UserId userId,
                                         InscriptionState state, LocalDateTime inscriptionDate,
                                         LocalDateTime createdAt, LocalDateTime lastUpdated) {
        return Inscription.builder()
                .id(id)
                .contestId(contestId)
                .userId(userId)
                .state(state)
                .inscriptionDate(inscriptionDate)
                .createdAt(createdAt)
                .lastUpdated(lastUpdated)
                .build();
    }
}