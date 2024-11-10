package ar.gov.mpd.concursobackend.auth.domain.model;

import java.util.Set;
import java.util.HashSet;
import java.util.UUID;
import java.time.LocalDateTime;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCreatedAt;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserId;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import lombok.Data;

@Data
public class User {
    private UserId id;
    private UserUsername username;
    private UserPassword password;
    private UserEmail email;
    private Set<Rol> roles = new HashSet<>();
    private UserCreatedAt createdAt;

    public User() {
        this.roles = new HashSet<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
    }

    public User(UserUsername username, UserPassword password, UserEmail email) {
        this.id = new UserId(UUID.randomUUID());
        this.username = username;
        this.password = password;
        this.email = email;
        this.roles = new HashSet<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
    }

    public static User create(UserUsername username, UserPassword password, UserEmail email) {
        return new User(username, password, email);
    }

	public Set<Rol> getRoles() {
		return roles;
	}

	public void setRoles(Set<Rol> roles) {
		this.roles = roles != null ? roles : new HashSet<>();
	}

	public UserUsername getUsername() {
		return username;
	}

	public void setUsername(UserUsername username) {
		this.username = username;
	}

	public UserPassword getPassword() {
		return password;
	}

	public void setPassword(UserPassword password) {
		this.password = password;
	}

	public UserEmail getEmail() {
		return email;
	}

	public void setEmail(UserEmail email) {
		this.email = email;
	}

	public UserId getId() {
		return id;
	}

	public void setId(UserId id) {
		this.id = id;
	}

	public UserCreatedAt getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(UserCreatedAt createdAt) {
		this.createdAt = createdAt;
	}

    
}
