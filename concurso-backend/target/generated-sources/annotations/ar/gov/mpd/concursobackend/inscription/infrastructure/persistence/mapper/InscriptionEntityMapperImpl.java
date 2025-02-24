package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-02-23T18:10:43-0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.41.0.z20250115-2156, environment: Java 21.0.5 (Eclipse Adoptium)"
)
@Component
public class InscriptionEntityMapperImpl implements InscriptionEntityMapper {

    @Override
    public InscriptionEntity toEntity(Inscription domain) {
        if ( domain == null ) {
            return null;
        }

        InscriptionEntity inscriptionEntity = new InscriptionEntity();

        inscriptionEntity.setStatus( domain.getStatus() );
        inscriptionEntity.setCreatedAt( domain.getCreatedAt() );
        inscriptionEntity.setInscriptionDate( domain.getInscriptionDate() );

        inscriptionEntity.setId( domain.getId().getValue() );
        inscriptionEntity.setContestId( domain.getContestId().getValue() );
        inscriptionEntity.setUserId( domain.getUserId().getValue() );

        return inscriptionEntity;
    }

    @Override
    public Inscription toDomain(InscriptionEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Inscription.InscriptionBuilder inscription = Inscription.builder();

        inscription.status( entity.getStatus() );
        inscription.createdAt( entity.getCreatedAt() );
        inscription.inscriptionDate( entity.getInscriptionDate() );

        inscription.id( new InscriptionId(entity.getId()) );
        inscription.contestId( new ContestId(entity.getContestId()) );
        inscription.userId( new UserId(entity.getUserId()) );

        return inscription.build();
    }
}
