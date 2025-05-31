package ar.gov.mpd.concursobackend.user.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Domain model for users
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private UUID id;
    private String firstName;
    private String lastName;
    private String dni;
    private String cuit;
    private LocalDate birthDate;
    private String country;
    private String province;
    private String municipality;
    private String legalAddress;
    private String residentialAddress;
    private String email;
    private String username;
    private String password;
    private UserStatus status;
    private Set<UserRole> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    
    /**
     * Get the full name of the user
     * 
     * @return The full name (firstName + lastName)
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    /**
     * Check if the user has a specific role
     * 
     * @param role The role to check
     * @return true if the user has the role, false otherwise
     */
    public boolean hasRole(UserRole role) {
        return roles != null && roles.contains(role);
    }
    
    /**
     * Check if the user is an administrator
     * 
     * @return true if the user has the ADMIN role, false otherwise
     */
    public boolean isAdmin() {
        return hasRole(UserRole.ADMIN);
    }
    
    /**
     * Check if the user account is active
     * 
     * @return true if the user status is ACTIVE, false otherwise
     */
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
    
    /**
     * Check if the user account is blocked
     * 
     * @return true if the user status is BLOCKED, false otherwise
     */
    public boolean isBlocked() {
        return status == UserStatus.BLOCKED || status == UserStatus.TEMPORARILY_BLOCKED;
    }
}
