package ar.gov.mpd.concursobackend.inscription.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain model for inscription notes
 * Represents notes added to inscriptions by administrators or the system
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionNote {
    private UUID id;
    private UUID inscriptionId;
    private String text;
    private UUID createdBy;
    private String createdByUsername;
    private LocalDateTime createdAt;
    
    /**
     * Creates a new note for an inscription
     * 
     * @param inscriptionId ID of the inscription
     * @param text Content of the note
     * @param createdBy ID of the user who created the note
     * @param createdByUsername Username of the user who created the note
     * @return A new InscriptionNote instance
     */
    public static InscriptionNote create(UUID inscriptionId, String text, UUID createdBy, String createdByUsername) {
        return InscriptionNote.builder()
                .id(UUID.randomUUID())
                .inscriptionId(inscriptionId)
                .text(text)
                .createdBy(createdBy)
                .createdByUsername(createdByUsername)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
