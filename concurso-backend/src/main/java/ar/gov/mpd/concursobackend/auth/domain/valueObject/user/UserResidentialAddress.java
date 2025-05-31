package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.Value;

@Value
public class UserResidentialAddress {
    String value;

    public UserResidentialAddress(String value) {
        this.value = value;
    }
    
    @Override
    public String toString() {
        return value;
    }
}
