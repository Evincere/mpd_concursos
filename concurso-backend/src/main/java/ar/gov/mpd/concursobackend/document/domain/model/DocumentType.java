package ar.gov.mpd.concursobackend.document.domain.model;

import java.util.UUID;

import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.Data;

@Data
public class DocumentType {
    private DocumentTypeId id;
    private String code;
    private String name;
    private String description;
    private boolean required;
    private Integer order;
    private DocumentType parent;
    private boolean isActive;

    public DocumentType() {
        this.id = new DocumentTypeId(UUID.randomUUID());
        this.isActive = true;
    }

    public DocumentType(String code, String name, String description, boolean required, Integer order,
            DocumentType parent, boolean isActive) {
        this();
        this.code = code;
        this.name = name;
        this.description = description;
        this.required = required;
        this.order = order;
        this.parent = parent;
        this.isActive = isActive;
    }

    public static DocumentType create(String code, String name, String description, boolean required, Integer order) {
        return new DocumentType(code, name, description, required, order, null, true);
    }

    public static DocumentType create(String code, String name, String description, boolean required, Integer order,
            DocumentType parent) {
        return new DocumentType(code, name, description, required, order, parent, true);
    }

    public static DocumentType create(String code, String name, String description, boolean required, Integer order,
            DocumentType parent, boolean isActive) {
        return new DocumentType(code, name, description, required, order, parent, isActive);
    }
}