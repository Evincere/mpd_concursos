package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import java.util.List;
import java.util.Map;

public class InscriptionReportRequestDTO {
    private List<String> fields;
    private Map<String, Object> filters;
    private String groupBy;
    private String sortBy;
    private String sortDirection;

    public List<String> getFields() { return fields; }
    public void setFields(List<String> fields) { this.fields = fields; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public String getGroupBy() { return groupBy; }
    public void setGroupBy(String groupBy) { this.groupBy = groupBy; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }

    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
} 