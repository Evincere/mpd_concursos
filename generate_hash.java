import java.security.SecureRandom;
import java.math.BigInteger;
import java.security.MessageDigest;

public class generate_hash {
    public static void main(String[] args) {
        // Generar hash BCrypt manualmente para admin123
        System.out.println("Testing password encoding...");
        
        // Generar un hash simple para probar
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update("admin123".getBytes());
            byte[] digest = md.digest();
            String hash = String.format("%064x", new BigInteger(1, digest));
            System.out.println("SHA256 hash for admin123: " + hash);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
