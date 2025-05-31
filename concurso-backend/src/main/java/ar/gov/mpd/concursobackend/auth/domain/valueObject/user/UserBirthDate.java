package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import java.time.LocalDate;
import lombok.Value;

@Value
public class UserBirthDate {
    LocalDate value;

    public UserBirthDate(LocalDate value) {
        if (value == null) {
            this.value = null;
            return;
        }
        
        // Validar que la fecha de nacimiento no sea futura
        if (value.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de nacimiento no puede ser futura");
        }
        
        this.value = value;
    }
    
    @Override
    public String toString() {
        return value != null ? value.toString() : null;
    }
}
