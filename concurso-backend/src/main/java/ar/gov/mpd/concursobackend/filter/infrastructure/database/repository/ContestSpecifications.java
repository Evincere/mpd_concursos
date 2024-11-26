package ar.gov.mpd.concursobackend.filter.infrastructure.database.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;
import ar.gov.mpd.concursobackend.filter.infrastructure.database.entities.ContestEntity;
import jakarta.persistence.criteria.Predicate;

public class ContestSpecifications {
    public static Specification<ContestEntity> withFilter(ContestFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getDepartment() != null) {
                predicates.add(cb.equal(root.get("department"), filter.getDepartment().getValue()));
            }

            if (filter.getPosition() != null) {
                predicates.add(cb.equal(root.get("position"), filter.getPosition().getValue()));
            }

            if (filter.getDateRange() != null) {
                if (filter.getDateRange().getStart() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), 
                        filter.getDateRange().getStart()));
                }
                if (filter.getDateRange().getEnd() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("endDate"), 
                        filter.getDateRange().getEnd()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
} 