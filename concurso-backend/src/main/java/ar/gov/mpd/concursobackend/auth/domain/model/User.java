package ar.gov.mpd.concursobackend.auth.domain.model;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.*;

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
        // NO asignar ID aquí - dejar que JPA lo genere automáticamente para evitar conflictos de merge/persist
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
