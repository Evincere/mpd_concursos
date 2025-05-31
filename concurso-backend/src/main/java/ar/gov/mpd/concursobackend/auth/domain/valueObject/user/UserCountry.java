package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.Value;

@Value
public class UserCountry {
    String value;

    public UserCountry(String value) {
        this.value = value;
    }
    
    @Override
    public String toString() {
        return value;
    }
}
