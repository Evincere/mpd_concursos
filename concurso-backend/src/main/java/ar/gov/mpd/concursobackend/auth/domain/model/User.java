package ar.gov.mpd.concursobackend.auth.domain.model;

import java.util.Set;
import java.util.HashSet;
import java.util.UUID;
import java.time.LocalDateTime;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCreatedAt;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserId;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import lombok.Data;

@Data
public class User {
    private UserId id;
    private UserUsername username;
    private UserPassword password;
    private UserEmail email;
	private UserDni dni;
	private UserCuit cuit;
    private String firstName;
    private String lastName;
    private Set<Rol> roles = new HashSet<>();
    private UserCreatedAt createdAt;

    public User() {
        this.roles = new HashSet<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
    }

    public User(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit, String firstName, String lastName) {
        this.id = new UserId(UUID.randomUUID());
        this.username = username;
        this.password = password;
        this.email = email;
		this.dni = dni;
		this.cuit = cuit;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = new HashSet<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
    }

    public static User create(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit, String firstName, String lastName) {
        return new User(username, password, email, dni, cuit, firstName, lastName);
    }
    
}
