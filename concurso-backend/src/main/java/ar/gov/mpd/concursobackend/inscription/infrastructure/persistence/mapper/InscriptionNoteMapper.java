package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionNoteEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

/**
 * Mapper for converting between InscriptionNote domain model and InscriptionNoteEntity JPA entity
 */
@Mapper(componentModel = "spring")
public interface InscriptionNoteMapper {
    InscriptionNoteMapper INSTANCE = Mappers.getMapper(InscriptionNoteMapper.class);
    
    /**
     * Convert from domain model to JPA entity
     * 
     * @param note Domain model
     * @return JPA entity
     */
    InscriptionNoteEntity toEntity(InscriptionNote note);
    
    /**
     * Convert from JPA entity to domain model
     * 
     * @param entity JPA entity
     * @return Domain model
     */
    InscriptionNote toDomain(InscriptionNoteEntity entity);
}
