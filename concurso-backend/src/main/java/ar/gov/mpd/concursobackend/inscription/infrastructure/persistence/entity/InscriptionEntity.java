package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "inscriptions")
@Getter
@Setter
public class InscriptionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "contestId")
    private Long contestId;

    @Column(name = "userId", columnDefinition = "BINARY(16)")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InscriptionStatus status;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "inscriptionDate")
    private LocalDateTime inscriptionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "currentStep")
    private InscriptionStep currentStep;

    @ElementCollection
    @CollectionTable(name = "inscription_circunscripciones",
            joinColumns = @JoinColumn(name = "inscriptionId"))
    @Column(name = "circunscripcion")
    private Set<String> selectedCircunscripciones;

    @Column(name = "acceptedTerms")
    private boolean acceptedTerms;

    @Column(name = "confirmedPersonalData")
    private boolean confirmedPersonalData;

    @Column(name = "centroDeVida")
    private String centroDeVida;

    @Column(name = "termsAcceptanceDate")
    private LocalDateTime termsAcceptanceDate;

    @Column(name = "dataConfirmationDate")
    private LocalDateTime dataConfirmationDate;

    @Column(name = "documentationDeadline")
    private LocalDateTime documentationDeadline;

    @Column(name = "frozenDate")
    private LocalDateTime frozenDate;
}