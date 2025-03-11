package ar.gov.mpd.concursobackend.document.infrastructure.database.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "document_type_id")
    private DocumentTypeEntity documentType;

    @NotNull
    @Column(name = "file_name")
    private String fileName;

    @NotNull
    @Column(name = "content_type")
    private String contentType;

    @NotNull
    @Column(name = "file_path")
    private String filePath;

    @NotNull
    @Enumerated(EnumType.STRING)
    private DocumentStatusEnum status;

    @Column(name = "comments")
    private String comments;

    @NotNull
    @Column(name = "upload_date")
    private LocalDateTime uploadDate;

    public enum DocumentStatusEnum {
        PENDING, APPROVED, REJECTED
    }
}