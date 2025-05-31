package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.Value;

@Value
public class UserProvince {
    String value;

    public UserProvince(String value) {
        this.value = value;
    }
    
    @Override
    public String toString() {
        return value;
    }
}
