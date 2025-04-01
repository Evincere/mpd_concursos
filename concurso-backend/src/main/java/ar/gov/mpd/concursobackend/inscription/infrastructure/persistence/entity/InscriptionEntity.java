package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "inscriptions")
@Getter
@Setter
public class InscriptionEntity {
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private byte[] id;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private byte[] userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InscriptionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "inscription_date")
    private LocalDateTime inscriptionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step")
    private InscriptionStep currentStep;

    @ElementCollection
    @CollectionTable(name = "inscription_circunscripciones",
            joinColumns = @JoinColumn(name = "inscription_id"))
    @Column(name = "circunscripcion")
    private Set<String> selectedCircunscripciones;

    @Column(name = "accepted_terms")
    private boolean acceptedTerms;

    @Column(name = "confirmed_personal_data")
    private boolean confirmedPersonalData;

    @Column(name = "terms_acceptance_date")
    private LocalDateTime termsAcceptanceDate;

    @Column(name = "data_confirmation_date")
    private LocalDateTime dataConfirmationDate;
}