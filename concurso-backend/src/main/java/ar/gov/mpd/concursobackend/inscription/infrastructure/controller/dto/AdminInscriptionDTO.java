package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminInscriptionDTO {
    private String id;
    private Long contestId;
    private String userId;
    private InscriptionState state;
    private LocalDateTime inscriptionDate;
    private LocalDateTime lastUpdated;
    
    private UserInfoDTO userInfo;
    private ContestInfoDTO contestInfo;
    private List<DocumentDTO> documents;
    private List<InscriptionNoteDTO> notes;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoDTO {
        private String fullName;
        private String email;
        private String dni;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestInfoDTO {
        private String title;
        private String position;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentDTO {
        private String id;
        private String name;
        private String type;
        private String status;
        private LocalDateTime uploadDate;
        private String observations;
        private String reviewedBy;
        private LocalDateTime reviewDate;
        private String fileName;
        private String documentType;
        private String documentTypeId;
        private Long fileSize;
        private String downloadUrl;
    }

    
    // ====================================================================
    // CAMPOS AGREGADOS PARA CIRCUNSCRIPCIONES - 2025-08-19
    // ====================================================================
    
    /**
     * Centro de vida seleccionado por el usuario durante la inscripción
     */
    private String centroDeVida;
    
    /**
     * Circunscripciones seleccionadas por el usuario
     */
    private java.util.Set<String> selectedCircunscripciones;

}