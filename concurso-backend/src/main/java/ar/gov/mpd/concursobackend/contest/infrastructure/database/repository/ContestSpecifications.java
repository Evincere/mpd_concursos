package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;

import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import jakarta.persistence.criteria.Predicate;

public class ContestSpecifications {
    private static final Logger log = LoggerFactory.getLogger(ContestSpecifications.class);

    public static Specification<ContestEntity> withFilter(ContestFilters filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter == null) {
                log.debug("No se aplicaron filtros");
                return null;
            }

            try {
                if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()) {
                    log.debug("Aplicando filtro de estado: {}", filter.getStatus());
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }

                if (filter.getDependency() != null && !filter.getDependency().trim().isEmpty()) {
                    log.debug("Aplicando filtro de dependencia: {}", filter.getDependency());
                    predicates.add(cb.equal(root.get("department"), filter.getDependency()));
                }

                if (filter.getPosition() != null && !filter.getPosition().trim().isEmpty()) {
                    log.debug("Aplicando filtro de posición: {}", filter.getPosition());
                    predicates.add(cb.equal(root.get("position"), filter.getPosition()));
                }

                if (filter.getStartDate() != null) {
                    log.debug("Aplicando filtro de fecha inicio: {}", filter.getStartDate());
                    predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), filter.getStartDate()));
                }

                if (filter.getEndDate() != null) {
                    log.debug("Aplicando filtro de fecha fin: {}", filter.getEndDate());
                    predicates.add(cb.lessThanOrEqualTo(root.get("endDate"), filter.getEndDate()));
                }

                log.debug("Se aplicaron {} filtros", predicates.size());
                return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
            } catch (Exception e) {
                log.error("Error al aplicar filtros", e);
                throw new RuntimeException("Error al aplicar filtros: " + e.getMessage(), e);
            }
        };
    }

    public static Specification<ContestEntity> withSearchTerm(String term) {
        return (root, query, cb) -> {
            if (term == null || term.trim().isEmpty()) {
                return null;
            }

            String searchTerm = "%" + term.toLowerCase() + "%";
            
            return cb.or(
                cb.like(cb.lower(root.get("title")), searchTerm),
                cb.like(cb.lower(root.get("position")), searchTerm),
                cb.like(cb.lower(root.get("department")), searchTerm)
            );
        };
    }
}
