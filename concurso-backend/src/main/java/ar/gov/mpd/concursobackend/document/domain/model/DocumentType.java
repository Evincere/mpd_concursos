package ar.gov.mpd.concursobackend.document.domain.model;

import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.Data;

import java.util.UUID;

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
        // NO asignar ID aquí - dejar que JPA lo genere automáticamente para evitar conflictos de merge/persist
        this.isActive = true;
    }

    public DocumentType(String code, String name, String description, boolean required, Integer order,
            DocumentType parent, boolean isActive) {
        // NO llamar this() para evitar asignación automática de ID
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