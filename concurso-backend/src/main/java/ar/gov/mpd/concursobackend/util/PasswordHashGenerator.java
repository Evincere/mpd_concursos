package ar.gov.mpd.concursobackend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes BCrypt de contraseñas
 * Solo para uso en desarrollo
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Contraseña común para todos los usuarios de prueba
        String password = "admin123";
        
        System.out.println("Generando hashes BCrypt para contraseña: " + password);
        System.out.println("=".repeat(60));
        
        // Generar varios hashes para diferentes usuarios
        String[] users = {"admin", "usuario1", "usuario2", "semper"};
        
        for (String user : users) {
            String hash = encoder.encode(password);
            System.out.println("Usuario: " + user);
            System.out.println("Hash BCrypt: " + hash);
            System.out.println("-".repeat(40));
        }
        
        // Verificar que los hashes funcionan
        System.out.println("\nVerificación de hashes:");
        String testHash = encoder.encode(password);
        boolean matches = encoder.matches(password, testHash);
        System.out.println("Hash de prueba: " + testHash);
        System.out.println("Verificación exitosa: " + matches);
    }
}
