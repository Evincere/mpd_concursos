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
import java.nio.ByteBuffer;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring", imports = {
        InscriptionId.class,
        ContestId.class,
        UserId.class,
        UUID.class,
        InscriptionState.class
})
public interface InscriptionEntityMapper {

    @Mapping(target = "id", expression = "java(uuidToBytes(domain.getId().getValue()))")
    @Mapping(target = "contestId", source = "contestId")
    @Mapping(target = "userId", expression = "java(uuidToBytes(domain.getUserId().getValue()))")
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

        InscriptionId id = new InscriptionId(bytesToUuid(entity.getId()));
        ContestId contestId = new ContestId(entity.getContestId());
        UserId userId = new UserId(bytesToUuid(entity.getUserId()));
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

    // Método para convertir UUID a byte[]
    default byte[] uuidToBytes(UUID uuid) {
        ByteBuffer byteBuffer = ByteBuffer.wrap(new byte[16]);
        byteBuffer.putLong(uuid.getMostSignificantBits());
        byteBuffer.putLong(uuid.getLeastSignificantBits());
        return byteBuffer.array();
    }

    // Método para convertir byte[] a UUID
    default UUID bytesToUuid(byte[] bytes) {
        ByteBuffer byteBuffer = ByteBuffer.wrap(bytes);
        long mostSigBits = byteBuffer.getLong();
        long leastSigBits = byteBuffer.getLong();
        return new UUID(mostSigBits, leastSigBits);
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

        switch (state) {
            case ACTIVE:
                return InscriptionStatus.ACTIVE;
            case PENDING:
            case PENDIENTE:
            case CONFIRMADA:
                return InscriptionStatus.PENDING;
            case APPROVED:
            case INSCRIPTO:
                return InscriptionStatus.APPROVED;
            case REJECTED:
                return InscriptionStatus.REJECTED;
            case CANCELLED:
                return InscriptionStatus.CANCELLED;
            case NO_INSCRIPTO:
            case IN_PROCESS:
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