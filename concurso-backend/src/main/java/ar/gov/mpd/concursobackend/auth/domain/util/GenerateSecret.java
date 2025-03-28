package ar.gov.mpd.concursobackend.auth.domain.util;

public class GenerateSecret {
    public static void main(String[] args) {
        String secret = SecretGenerator.generateSecret(32);
        System.out.println("Tu secreto seguro es:");
        System.out.println(secret);
        System.out.println("\nCopia este valor y agrégalo a tu application.properties como:");
        System.out.println("jwt.secret=" + secret);
    }
} 