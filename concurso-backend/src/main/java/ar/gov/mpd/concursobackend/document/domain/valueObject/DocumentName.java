package ar.gov.mpd.concursobackend.document.domain.valueObject;

import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;

public class DocumentName {
    private final String value;

    public DocumentName(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new DocumentException("Document name cannot be empty");
        }
        this.value = value;
    }

    public String value() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        DocumentName that = (DocumentName) o;
        return value.equals(that.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }
}