package ar.gov.mpd.concursobackend.filter.infrastructure.mapper;

import java.util.List;

import ar.gov.mpd.concursobackend.filter.domain.model.Contest;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.*;
import ar.gov.mpd.concursobackend.filter.infrastructure.database.entities.ContestEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", imports = {ContestId.class, DateRange.class, Department.class, Position.class})
public interface ContestEntityMapper {

    ContestEntityMapper INSTANCE = Mappers.getMapper(ContestEntityMapper.class);

    @Mapping(target = "id", expression = "java(new ContestId(entity.getId()))")
    @Mapping(target = "dateRange", expression = "java(new DateRange(entity.getStartDate(), entity.getEndDate()))")
    @Mapping(target = "department", expression = "java(new Department(entity.getDepartment()))")
    @Mapping(target = "position", expression = "java(new Position(entity.getPosition()))")
    @Mapping(target = "status", source = "status")
    Contest toDomain(ContestEntity entity);

    @Mapping(target = "id", expression = "java(domain.getId().getValue())")
    @Mapping(target = "startDate", expression = "java(domain.getDateRange().getStart())")
    @Mapping(target = "endDate", expression = "java(domain.getDateRange().getEnd())")
    @Mapping(target = "department", expression = "java(domain.getDepartment().getValue())")
    @Mapping(target = "position", expression = "java(domain.getPosition().getValue())")
    @Mapping(target = "status", source = "status")
    ContestEntity toEntity(Contest domain);

    List<Contest> toDomainList(List<ContestEntity> entities);
} 