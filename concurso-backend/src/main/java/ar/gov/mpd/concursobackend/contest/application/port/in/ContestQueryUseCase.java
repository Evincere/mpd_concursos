package ar.gov.mpd.concursobackend.contest.application.port.in;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import java.util.List;
import java.util.Optional;

/**
 * Puerto de entrada para consultas relacionadas con concursos
 */
public interface ContestQueryUseCase {
    /**
     * Busca concursos según los filtros especificados
     * @param filters Filtros a aplicar en la búsqueda
     * @return Lista de concursos que coinciden con los filtros
     */
    List<Contest> findByFilters(ContestFilters filters);

    /**
     * Busca un concurso por su ID
     * @param id ID del concurso a buscar
     * @return Concurso si existe, Optional vacío si no
     */
    Optional<Contest> findById(Long id);
}
