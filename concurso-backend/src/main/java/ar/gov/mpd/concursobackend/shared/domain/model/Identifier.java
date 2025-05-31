package ar.gov.mpd.concursobackend.shared.domain.model;

import java.util.UUID;

/**
 * Clase base para identificadores basados en UUID
 */
public abstract class Identifier {
    private final UUID value;

    protected Identifier(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("El valor del identificador no puede ser nulo");
        }
        this.value = value;
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Identifier that = (Identifier) o;
        return value.equals(that.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
