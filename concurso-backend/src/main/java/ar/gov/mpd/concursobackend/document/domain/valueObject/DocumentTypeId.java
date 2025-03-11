package ar.gov.mpd.concursobackend.document.domain.valueObject;

import java.util.UUID;

public class DocumentTypeId {
    private final UUID value;

    public DocumentTypeId(UUID value) {
        this.value = value;
    }

    public UUID value() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        DocumentTypeId that = (DocumentTypeId) o;
        return value.equals(that.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }
}