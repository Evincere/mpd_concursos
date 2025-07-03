package ar.gov.mpd.concursobackend.auth.domain.model;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

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
