package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
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

@Getter
@Setter
@NoArgsConstructor(force = true)
@AllArgsConstructor
@Builder(builderMethodName = "builder")
public class Inscription {
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
    private LocalDateTime documentationDeadline;
    private LocalDateTime frozenDate;

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

        // CORRECCIÓN CRÍTICA: Solo cambiar el estado si la inscripción no está ya completada
        // Si ya está completada (COMPLETED step), mantener el estado asignado por completeInscription()
        if (preferences.isComplete() &&
            this.currentStep == InscriptionStep.DATA_CONFIRMATION) {
            // Solo cambiar el estado si no está ya en paso COMPLETED
            // Esto evita sobrescribir el estado asignado por completeInscription()
            this.currentStep = InscriptionStep.COMPLETED;
            this.state = InscriptionState.PENDING;
        }
        // Si ya está en paso COMPLETED, NO cambiar el estado (mantener el asignado por completeInscription)
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
     * Verifica si todos los documentos requeridos están presentes
     *
     * @return true si todos los documentos están presentes, false en caso contrario
     */
    public boolean hasAllRequiredDocuments() {
        // TODO: Implementar lógica para verificar documentos requeridos
        // Por ahora retornamos true si hay al menos un documento
        return this.documents != null && !this.documents.isEmpty();
    }

    /**
     * Completa la inscripción con el estado apropiado según la documentación
     */
    public void completeInscription() {
        this.currentStep = InscriptionStep.COMPLETED;
        this.lastUpdated = LocalDateTime.now();

        if (hasAllRequiredDocuments()) {
            this.state = InscriptionState.COMPLETED_WITH_DOCS;
        } else {
            this.state = InscriptionState.COMPLETED_PENDING_DOCS;
            // Establecer plazo perentorio de 3 días hábiles
            this.documentationDeadline = calculateDocumentationDeadline();
        }
    }

    /**
     * Calcula el plazo perentorio para la documentación (3 días hábiles)
     *
     * Nota: Implementación simplificada que agrega 3 días calendario.
     * En una implementación completa se debería considerar:
     * - Feriados nacionales y provinciales
     * - Días no laborables específicos del MPD
     * - Configuración de días hábiles por jurisdicción
     *
     * @return Fecha límite para la documentación
     */
    private LocalDateTime calculateDocumentationDeadline() {
        // Implementación simplificada: 3 días calendario
        // En producción se debería usar un servicio de calendario laboral
        return LocalDateTime.now().plusDays(3);
    }

    /**
     * Congela la inscripción después del plazo perentorio
     */
    public void freezeInscription() {
        if (this.state == InscriptionState.COMPLETED_PENDING_DOCS) {
            this.state = InscriptionState.FROZEN;
            this.frozenDate = LocalDateTime.now();
            this.lastUpdated = LocalDateTime.now();
        }
    }

    /**
     * Verifica si la inscripción está congelada
     *
     * @return true si está congelada, false en caso contrario
     */
    public boolean isFrozen() {
        return this.state == InscriptionState.FROZEN;
    }

    /**
     * Verifica si el plazo de documentación ha vencido
     *
     * @return true si el plazo ha vencido, false en caso contrario
     */
    public boolean isDocumentationDeadlineExpired() {
        return this.documentationDeadline != null &&
               LocalDateTime.now().isAfter(this.documentationDeadline);
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
     * Obtiene la fecha de última actualización
     *
     * @return Fecha de última actualización
     */
    public LocalDateTime getLastUpdated() {
        return this.lastUpdated;
    }



    /**
     * Builder personalizado para Inscription
     */
    public static class InscriptionBuilder {

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