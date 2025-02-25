package ar.gov.mpd.concursobackend.contest.infrastructure.mapper;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import java.time.LocalDate;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-02-24T23:20:26-0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.41.0.z20250115-2156, environment: Java 21.0.5 (Eclipse Adoptium)"
)
@Component
public class ContestEntityMapperImpl implements ContestEntityMapper {

    @Override
    public Contest toDomain(ContestEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Long id = null;
        String status = null;
        String dependency = null;
        String position = null;
        LocalDate startDate = null;
        LocalDate endDate = null;
        String title = null;

        id = entity.getId();
        status = statusToString( entity.getStatus() );
        dependency = entity.getDepartment();
        position = entity.getPosition();
        startDate = entity.getStartDate();
        endDate = entity.getEndDate();
        title = entity.getPosition();

        String category = null;
        Integer vacancies = null;

        Contest contest = new Contest( id, title, category, startDate, endDate, status, position, dependency, vacancies );

        return contest;
    }

    @Override
    public ContestEntity toEntity(Contest domain) {
        if ( domain == null ) {
            return null;
        }

        ContestEntity contestEntity = new ContestEntity();

        contestEntity.setId( domain.getId() );
        contestEntity.setStatus( stringToStatus( domain.getStatus() ) );
        contestEntity.setDepartment( domain.getDependency() );
        contestEntity.setPosition( domain.getPosition() );
        contestEntity.setStartDate( domain.getStartDate() );
        contestEntity.setEndDate( domain.getEndDate() );

        return contestEntity;
    }
}
