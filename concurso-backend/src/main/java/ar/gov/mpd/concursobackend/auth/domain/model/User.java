package ar.gov.mpd.concursobackend.auth.domain.model;

import java.util.Set;
import java.util.List;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.UUID;
import java.time.LocalDateTime;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserBirthDate;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCountry;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCreatedAt;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserId;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserLegalAddress;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserMunicipality;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserProvince;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserResidentialAddress;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.ProfileImageUrl;
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
    private UserBirthDate birthDate;
    private UserCountry country;
    private UserProvince province;
    private UserMunicipality municipality;
    private UserLegalAddress legalAddress;
    private UserResidentialAddress residentialAddress;
    private String telefono;
    private String direccion;
    private ProfileImageUrl profileImageUrl;
    private List<Experiencia> experiencias = new ArrayList<>();
    private List<Educacion> educacion = new ArrayList<>();
    private List<Habilidad> habilidades = new ArrayList<>();
    private Set<Rol> roles = new HashSet<>();
    private UserCreatedAt createdAt;
    private UserStatus status;

    public User() {
        this.roles = new HashSet<>();
        this.experiencias = new ArrayList<>();
        this.educacion = new ArrayList<>();
        this.habilidades = new ArrayList<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
        this.status = UserStatus.ACTIVE; // Por defecto, los usuarios son activos
    }

    public User(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit,
            String firstName, String lastName) {
        this.id = new UserId(UUID.randomUUID());
        this.username = username;
        this.password = password;
        this.email = email;
        this.dni = dni;
        this.cuit = cuit;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = new HashSet<>();
        this.experiencias = new ArrayList<>();
        this.educacion = new ArrayList<>();
        this.habilidades = new ArrayList<>();
        this.createdAt = new UserCreatedAt(LocalDateTime.now());
        this.status = UserStatus.ACTIVE; // Por defecto, los usuarios son activos
    }

    public User(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit,
            String firstName, String lastName, UserBirthDate birthDate, UserCountry country, UserProvince province,
            UserMunicipality municipality, UserLegalAddress legalAddress, UserResidentialAddress residentialAddress) {
        this(username, password, email, dni, cuit, firstName, lastName);
        this.birthDate = birthDate;
        this.country = country;
        this.province = province;
        this.municipality = municipality;
        this.legalAddress = legalAddress;
        this.residentialAddress = residentialAddress;
    }

    public static User create(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit,
            String firstName, String lastName) {
        return new User(username, password, email, dni, cuit, firstName, lastName);
    }

    public static User create(UserUsername username, UserPassword password, UserEmail email, UserDni dni, UserCuit cuit,
            String firstName, String lastName, UserBirthDate birthDate, UserCountry country, UserProvince province,
            UserMunicipality municipality, UserLegalAddress legalAddress, UserResidentialAddress residentialAddress) {
        return new User(username, password, email, dni, cuit, firstName, lastName, birthDate, country, province,
                municipality, legalAddress, residentialAddress);
    }

    public String getFullName() {
        return this.firstName + " " + this.lastName;
    }
}
