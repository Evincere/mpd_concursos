package ar.gov.mpd.concursobackend.auth.domain.util;

import java.security.SecureRandom;
import java.util.Base64;

public class SecretGenerator {
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

    public static String generateSecret(int length) {
        byte[] randomBytes = new byte[length];
        secureRandom.nextBytes(randomBytes);
        return encoder.encodeToString(randomBytes);
    }

    public static void main(String[] args) {
        // Genera un secreto de 32 bytes (256 bits) para HMAC-SHA256
        String secret = generateSecret(32);
        System.out.println("Tu secreto seguro es:");
        System.out.println(secret);
        System.out.println("\nCopia este valor y agrégalo a tu application.properties como:");
        System.out.println("jwt.secret=" + secret);
    }

    // Método para generar un secreto directamente
    public static String generateJwtSecret() {
        return generateSecret(32);
    }
} 