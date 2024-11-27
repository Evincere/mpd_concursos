package ar.gov.mpd.concursobackend.shared.domain.model;

import lombok.Value;

@Value
public class PageRequest {
    int page;
    int size;
    String sortBy;
    String sortDirection;

    public static PageRequest of(int page, int size, String sortBy, String sortDirection) {
        return new PageRequest(
            Math.max(0, page),
            Math.max(1, Math.min(size, 100)), // Limitamos el tamaño máximo a 100
            sortBy,
            sortDirection
        );
    }
} 