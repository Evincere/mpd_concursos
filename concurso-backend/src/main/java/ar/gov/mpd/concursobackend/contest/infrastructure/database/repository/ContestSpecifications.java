package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import jakarta.persistence.criteria.Predicate;

public class ContestSpecifications {
    public static Specification<ContestEntity> withFilter(ContestFilters filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getDependency() != null) {
                predicates.add(cb.equal(root.get("department"), filter.getDependency()));
            }

            if (filter.getPosition() != null) {
                predicates.add(cb.equal(root.get("position"), filter.getPosition()));
            }

            if (filter.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), filter.getStartDate()));
            }

            if (filter.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("endDate"), filter.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
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
