package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.Value;

@Value
public class UserLegalAddress {
    String value;

    public UserLegalAddress(String value) {
        this.value = value;
    }
    
    @Override
    public String toString() {
        return value;
    }
}
