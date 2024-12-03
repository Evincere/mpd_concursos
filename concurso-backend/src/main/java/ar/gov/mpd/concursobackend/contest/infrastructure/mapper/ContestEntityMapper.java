package ar.gov.mpd.concursobackend.contest.infrastructure.mapper;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ContestEntityMapper {

    ContestEntityMapper INSTANCE = Mappers.getMapper(ContestEntityMapper.class);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "dependency", source = "department")
    @Mapping(target = "position", source = "position")
    @Mapping(target = "startDate", source = "startDate")
    @Mapping(target = "endDate", source = "endDate")
    @Mapping(target = "title", source = "position")
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "vacancies", ignore = true)
    Contest toDomain(ContestEntity entity);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "status", source = "status", qualifiedByName = "stringToStatus")
    @Mapping(target = "department", source = "dependency")
    @Mapping(target = "position", source = "position")
    @Mapping(target = "startDate", source = "startDate")
    @Mapping(target = "endDate", source = "endDate")
    ContestEntity toEntity(Contest domain);

    @Named("statusToString")
    default String statusToString(ContestStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("stringToStatus")
    default ContestStatus stringToStatus(String status) {
        return status != null ? ContestStatus.valueOf(status) : null;
    }
}
