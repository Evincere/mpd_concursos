package ar.gov.mpd.concursobackend.shared.domain.model;

import lombok.Value;

@Value
public class PageRequest {
    int page;
    int size;
    String sortBy;
    String sortDirection;

    private PageRequest(int page, int size, String sortBy, String sortDirection) {
        this.page = Math.max(0, page);
        this.size = Math.max(1, Math.min(size, 100)); // Limitamos el tamaño máximo a 100
        this.sortBy = sortBy != null ? sortBy : "id";
        this.sortDirection = sortDirection != null ? sortDirection.toUpperCase() : "ASC";
    }

    public static PageRequest of(int page, int size, String sortBy, String sortDirection) {
        return new PageRequest(page, size, sortBy, sortDirection);
    }

    public static PageRequest of(int page, int size) {
        return new PageRequest(page, size, "id", "ASC");
    }

    public static PageRequest defaultPage() {
        return new PageRequest(0, 10, "id", "ASC");
    }
}