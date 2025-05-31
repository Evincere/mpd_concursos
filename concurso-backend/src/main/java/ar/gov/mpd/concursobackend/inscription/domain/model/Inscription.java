package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.lang.NonNull;

@Getter
@Setter
@NoArgsConstructor(force = true)
@AllArgsConstructor
@Builder(builderMethodName = "builder")
public class Inscription {
    @NonNull
    private final InscriptionId id;
    private final ContestId contestId;
    private final UserId userId;
    private InscriptionState state;
    private final LocalDateTime inscriptionDate;
    private final LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    @Builder.Default
    private InscriptionStep currentStep = InscriptionStep.INITIAL;
    private InscriptionPreferences preferences;

    // Relaciones
    private User user;
    private Contest contest;
    @Builder.Default
    private List<Document> documents = new ArrayList<>();
    @Builder.Default
    private List<InscriptionNote> notes = new ArrayList<>();

    /**
     * Cancela la inscripción
     */
    public void cancel() {
        // Si ya está cancelada, no hacemos nada
        if (this.state == InscriptionState.CANCELLED) {
            return;
        }
        this.state = InscriptionState.CANCELLED;
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Actualiza el paso actual de la inscripción
     *
     * @param newStep Nuevo paso
     */
    public void updateStep(InscriptionStep newStep) {
        if (newStep.ordinal() < this.currentStep.ordinal()) {
            throw new IllegalStateException("No se puede retroceder a un paso anterior");
        }
        this.currentStep = newStep;
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Actualiza las preferencias de la inscripción
     *
     * @param preferences Nuevas preferencias
     */
    public void updatePreferences(InscriptionPreferences preferences) {
        this.preferences = preferences;
        this.lastUpdated = LocalDateTime.now();

        if (preferences.isComplete() && this.currentStep == InscriptionStep.DATA_CONFIRMATION) {
            this.currentStep = InscriptionStep.COMPLETED;
            this.state = InscriptionState.PENDING;
        }
    }

    /**
     * Verifica si la inscripción está completa
     *
     * @return true si está completa, false en caso contrario
     */
    public boolean isCompleted() {
        return this.currentStep == InscriptionStep.COMPLETED;
    }

    /**
     * Cambia el estado de la inscripción
     *
     * @param newState Nuevo estado
     */
    public void setState(InscriptionState newState) {
        this.state = newState;
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Agrega un documento a la inscripción
     *
     * @param document Documento a agregar
     */
    public void addDocument(Document document) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(document);
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Agrega una nota a la inscripción
     *
     * @param note Nota a agregar
     */
    public void addNote(InscriptionNote note) {
        if (this.notes == null) {
            this.notes = new ArrayList<>();
        }
        this.notes.add(note);
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Obtiene el estado de la inscripción
     *
     * @return Estado de la inscripción
     */
    public InscriptionState getState() {
        return this.state;
    }

    /**
     * Obtiene el estado de la inscripción (método de compatibilidad)
     *
     * @return Estado de la inscripción
     * @deprecated Use getState() instead
     */
    @Deprecated
    public InscriptionState getStatus() {
        return this.state;
    }

    /**
     * Obtiene la fecha de última actualización
     *
     * @return Fecha de última actualización
     */
    public LocalDateTime getLastUpdated() {
        return this.lastUpdated;
    }

    /**
     * Obtiene la fecha de última actualización (método de compatibilidad)
     *
     * @return Fecha de última actualización
     * @deprecated Use getLastUpdated() instead
     */
    @Deprecated
    public LocalDateTime getUpdatedAt() {
        return this.lastUpdated;
    }

    /**
     * Builder personalizado para Inscription
     */
    public static class InscriptionBuilder {
        /**
         * Método de compatibilidad para establecer el estado
         *
         * @param status Estado de la inscripción
         * @return Builder
         * @deprecated Use state() instead
         */
        @Deprecated
        public InscriptionBuilder status(InscriptionState status) {
            this.state = status;
            return this;
        }
    }

    /**
     * Establece la fecha de última actualización
     *
     * @param lastUpdated Nueva fecha de última actualización
     */
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    /**
     * Obtiene el usuario asociado a la inscripción
     *
     * @return Usuario
     */
    public User getUser() {
        return this.user;
    }

    /**
     * Establece el usuario asociado a la inscripción
     *
     * @param user Usuario
     */
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * Obtiene el concurso asociado a la inscripción
     *
     * @return Concurso
     */
    public Contest getContest() {
        return this.contest;
    }

    /**
     * Establece el concurso asociado a la inscripción
     *
     * @param contest Concurso
     */
    public void setContest(Contest contest) {
        this.contest = contest;
    }

    /**
     * Obtiene los documentos de la inscripción
     *
     * @return Lista de documentos
     */
    public List<Document> getDocuments() {
        return this.documents;
    }

    /**
     * Establece los documentos de la inscripción
     *
     * @param documents Lista de documentos
     */
    public void setDocuments(List<Document> documents) {
        this.documents = documents;
    }

    /**
     * Obtiene las notas de la inscripción
     *
     * @return Lista de notas
     */
    public List<InscriptionNote> getNotes() {
        return this.notes;
    }

    /**
     * Establece las notas de la inscripción
     *
     * @param notes Lista de notas
     */
    public void setNotes(List<InscriptionNote> notes) {
        this.notes = notes;
    }
}