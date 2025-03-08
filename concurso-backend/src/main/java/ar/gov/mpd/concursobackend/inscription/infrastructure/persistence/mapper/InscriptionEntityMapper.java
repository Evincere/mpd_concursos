package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.UUID;
import java.nio.ByteBuffer;

@Mapper(componentModel = "spring", imports = {
        InscriptionId.class,
        ContestId.class,
        UserId.class,
        UUID.class,
        InscriptionStatus.class
})
public interface InscriptionEntityMapper {

    @Mapping(target = "id", expression = "java(uuidToBytes(domain.getId().getValue()))")
    @Mapping(target = "contestId", source = "contestId")
    @Mapping(target = "userId", expression = "java(uuidToBytes(domain.getUserId().getValue()))")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "inscriptionDate", source = "inscriptionDate")
    InscriptionEntity toEntity(Inscription domain);

    @Mapping(target = "id", expression = "java(new InscriptionId(bytesToUuid(entity.getId())))")
    @Mapping(target = "contestId", expression = "java(new ContestId(entity.getContestId()))")
    @Mapping(target = "userId", expression = "java(new UserId(bytesToUuid(entity.getUserId())))")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "inscriptionDate", source = "inscriptionDate")
    Inscription toDomain(InscriptionEntity entity);

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
}