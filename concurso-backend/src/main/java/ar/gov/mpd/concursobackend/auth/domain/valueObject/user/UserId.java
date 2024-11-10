package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import java.util.UUID;

public class UserId {
    private final UUID uuid;
    
    public UserId(UUID uuid) {
        this.uuid = uuid;
    }

	public UUID value() {
		return uuid;
	}
	
}
