package ar.gov.mpd.concursobackend.user.domain.port;

import ar.gov.mpd.concursobackend.user.domain.model.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entities
 * Following hexagonal architecture, this is a port in the domain layer
 */
public interface UserRepository {
    /**
     * Save a user to the repository
     * 
     * @param user The user to save
     * @return The saved user
     */
    User save(User user);
    
    /**
     * Find a user by their ID
     * 
     * @param id The ID of the user to find
     * @return An Optional containing the user if found
     */
    Optional<User> findById(UUID id);
    
    /**
     * Find a user by their username
     * 
     * @param username The username of the user to find
     * @return An Optional containing the user if found
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Find a user by their email
     * 
     * @param email The email of the user to find
     * @return An Optional containing the user if found
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Find a user by their DNI
     * 
     * @param dni The DNI of the user to find
     * @return An Optional containing the user if found
     */
    Optional<User> findByDni(String dni);
    
    /**
     * Find all users
     * 
     * @return A list of all users
     */
    List<User> findAll();
    
    /**
     * Update a user in the repository
     * 
     * @param user The user to update
     * @return The updated user
     */
    User update(User user);
    
    /**
     * Delete a user by their ID
     * 
     * @param id The ID of the user to delete
     */
    void deleteById(UUID id);
}
