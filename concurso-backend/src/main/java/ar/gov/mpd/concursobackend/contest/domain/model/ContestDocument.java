package ar.gov.mpd.concursobackend.contest.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain model for contest documents
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDocument {
    private UUID id;
    private UUID contestId;
    private String name;
    private String description;
    private String fileUrl;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private boolean required;
    private boolean public_;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;
}
