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

@SuppressWarnings("unused")
@Mapper(
    componentModel = "spring",
    imports = {
        InscriptionId.class,
        ContestId.class,
        UserId.class,
        UUID.class,
        InscriptionStatus.class
    }
)
public interface InscriptionEntityMapper {

    @Mapping(target = "id", expression = "java(inscription.getId().getValue())")
    @Mapping(target = "contestId", expression = "java(inscription.getContestId().getValue())")
    @Mapping(target = "userId", expression = "java(inscription.getUserId().getValue())")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "inscriptionDate", source = "inscriptionDate")
    InscriptionEntity toEntity(Inscription inscription);

    @Mapping(target = "id", expression = "java(new InscriptionId(entity.getId()))")
    @Mapping(target = "contestId", expression = "java(new ContestId(entity.getContestId()))")
    @Mapping(target = "userId", expression = "java(new UserId(entity.getUserId()))")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "inscriptionDate", source = "inscriptionDate")
    Inscription toDomain(InscriptionEntity entity);
} 