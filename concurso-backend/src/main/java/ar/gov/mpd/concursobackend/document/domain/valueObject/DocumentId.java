package ar.gov.mpd.concursobackend.document.domain.valueObject;

import java.util.UUID;

public class DocumentId {
    private final UUID value;

    public DocumentId(UUID value) {
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
        DocumentId that = (DocumentId) o;
        return value.equals(that.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }
}