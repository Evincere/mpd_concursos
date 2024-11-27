package ar.gov.mpd.concursobackend.shared.domain.model;

import lombok.Value;
import java.util.List;

@Value
public class PageResponse<T> {
    List<T> content;
    int pageNumber;
    int pageSize;
    long totalElements;
    int totalPages;
    boolean last;
} 