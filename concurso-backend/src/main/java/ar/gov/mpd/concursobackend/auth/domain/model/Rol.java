package ar.gov.mpd.concursobackend.auth.domain.model;

import java.util.UUID;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class Rol {
    private UUID id;
    private RoleEnum role;
    
	public Rol() {}
	public Rol(RoleEnum role) {
		this.role = role;
	}
	
	
}
