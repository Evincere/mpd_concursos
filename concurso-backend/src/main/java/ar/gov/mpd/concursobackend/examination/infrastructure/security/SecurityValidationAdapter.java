package ar.gov.mpd.concursobackend.examination.infrastructure.security;

import ar.gov.mpd.concursobackend.examination.application.port.output.SecurityValidationPort;
import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.SecurityValidation;
import ar.gov.mpd.concursobackend.examination.domain.enums.SecurityViolationType;
import org.springframework.stereotype.Component;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class SecurityValidationAdapter implements SecurityValidationPort {
    
    @Override
    public SecurityValidation validateAnswer(Answer answer) {
        return SecurityValidation.builder()
            .valid(true)
            .violationType(SecurityViolationType.NONE)
            .message("Validación exitosa")
            .build();
    }

    @Override
    public String generateAnswerHash(Answer answer) {
        try {
            String content = answer.getQuestionId() + "|" + 
                           String.join(",", answer.getResponse()) + "|" +
                           answer.getTimestamp().toString() + "|" +
                           answer.getResponseTimeInMillis();
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error generando hash", e);
        }
    }
} 