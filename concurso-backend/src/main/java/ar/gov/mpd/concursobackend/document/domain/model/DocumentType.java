package ar.gov.mpd.concursobackend.document.domain.model;

import java.util.UUID;

import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.Data;

@Data
public class DocumentType {
    private DocumentTypeId id;
    private String name;
    private String description;
    private boolean required;
    private Integer order;

    public DocumentType() {
        this.id = new DocumentTypeId(UUID.randomUUID());
    }

    public DocumentType(String name, String description, boolean required, Integer order) {
        this();
        this.name = name;
        this.description = description;
        this.required = required;
        this.order = order;
    }

    public static DocumentType create(String name, String description, boolean required, Integer order) {
        return new DocumentType(name, description, required, order);
    }
}