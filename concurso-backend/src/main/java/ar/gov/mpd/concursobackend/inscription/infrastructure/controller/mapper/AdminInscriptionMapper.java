package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.mapper;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.AdminInscriptionDTO;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionNoteDTO;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class AdminInscriptionMapper {

    public AdminInscriptionDTO toAdminDTO(Inscription inscription) {
        if (inscription == null) {
            return null;
        }

        AdminInscriptionDTO dto = AdminInscriptionDTO.builder()
                .id(inscription.getId().getValue().toString())
                .contestId(inscription.getContestId().getValue())
                .userId(inscription.getUserId().getValue().toString())
                .state(inscription.getState())
                .inscriptionDate(inscription.getInscriptionDate())
                .lastUpdated(inscription.getLastUpdated())
                .build();

        // Mapear información del usuario si está disponible
        if (inscription.getUser() != null) {
            User user = inscription.getUser();
            dto.setUserInfo(AdminInscriptionDTO.UserInfoDTO.builder()
                    .fullName(user.getFirstName() + " " + user.getLastName())
                    .email(user.getEmail().value())
                    .dni(user.getDni().value())
                    .build());
        }

        // Mapear información del concurso si está disponible
        if (inscription.getContest() != null) {
            // El modelo Inscription ahora usa el modelo legacy Contest directamente
            Contest contest = inscription.getContest();
            dto.setContestInfo(AdminInscriptionDTO.ContestInfoDTO.builder()
                    .title(contest.getTitle())
                    .position(contest.getLocation() != null ? contest.getLocation() : "No especificado")
                    .build());
        }

        // Mapear documentos si están disponibles
        if (inscription.getDocuments() != null && !inscription.getDocuments().isEmpty()) {
            dto.setDocuments(inscription.getDocuments().stream()
                    .map(this::toDocumentDTO)
                    .collect(Collectors.toList()));
        }

        // Mapear notas si están disponibles
        if (inscription.getNotes() != null && !inscription.getNotes().isEmpty()) {
            dto.setNotes(inscription.getNotes().stream()
                    .map(this::toNoteDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    public List<AdminInscriptionDTO> toAdminDTOList(List<Inscription> inscriptions) {
        return inscriptions.stream()
                .map(this::toAdminDTO)
                .collect(Collectors.toList());
    }

    private AdminInscriptionDTO.DocumentDTO toDocumentDTO(Document document) {
        return AdminInscriptionDTO.DocumentDTO.builder()
                .id(document.getId().value().toString())
                .name(document.getFileName().value())
                .type(document.getDocumentType().getName())
                .status(document.getStatus().name())
                .uploadDate(document.getUploadDate())
                .build();
    }

    private InscriptionNoteDTO toNoteDTO(InscriptionNote note) {
        return new InscriptionNoteDTO(
                note.getId().toString(),
                note.getInscriptionId().toString(),
                note.getText(),
                note.getCreatedByUsername(),
                note.getCreatedAt()
        );
    }
}
