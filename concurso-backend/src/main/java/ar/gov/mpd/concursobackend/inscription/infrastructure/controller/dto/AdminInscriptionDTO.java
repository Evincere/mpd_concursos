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
    }
}
