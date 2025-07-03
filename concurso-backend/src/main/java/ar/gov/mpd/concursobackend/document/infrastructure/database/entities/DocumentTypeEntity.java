package ar.gov.mpd.concursobackend.document.infrastructure.database.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "document_types")
@Getter
@Setter
public class DocumentTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String code;

    @NotNull
    private String name;

    private String description;

    @NotNull
    private boolean required;

    @Column(name = "`order`")
    private Integer order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private DocumentTypeEntity parent;

    @Column(name = "is_active")
    private boolean isActive = true;
}