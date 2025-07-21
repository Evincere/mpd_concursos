package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

        // CRITICAL FIX: NO sobrescribir el estado si ya está en paso COMPLETED
        // El estado debe ser asignado únicamente por completeInscription() que considera la documentación
        if (preferences.isComplete() &&
            this.currentStep == InscriptionStep.DATA_CONFIRMATION) {
            // Solo cambiar el paso, NO el estado
            // El estado será asignado correctamente por completeInscription()
            this.currentStep = InscriptionStep.COMPLETED;
            // REMOVED: this.state = InscriptionState.PENDING; - Esto causaba el bug
        }
        // Si ya está en paso COMPLETED, NO cambiar NADA (mantener estado asignado por completeInscription)
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
     * CRITICAL FIX: Ahora requiere inyección de dependencia para consultar tipos de documentos dinámicamente
     *
     * @param requiredDocumentTypes Lista de tipos de documentos requeridos desde la base de datos
     * @return true si todos los documentos están presentes, false en caso contrario
     */
    public boolean hasAllRequiredDocuments(Set<String> requiredDocumentTypes) {
        System.out.println("🔍 [Inscription] Verificando documentos para inscripción: " + this.id);
        System.out.println("📄 [Inscription] Documentos requeridos: " + requiredDocumentTypes);
        System.out.println("📁 [Inscription] Documentos del usuario (total): " + (this.documents != null ? this.documents.size() : 0));

        if (this.documents != null && !this.documents.isEmpty()) {
            System.out.println("📋 [Inscription] Tipos de documentos del usuario:");
            for (var doc : this.documents) {
                System.out.println("  - " + doc.getDocumentType().getCode() + " (ID: " + doc.getId() + ")");
            }
        }

        // Si no hay documentos, definitivamente no tiene todos los requeridos
        if (this.documents == null || this.documents.isEmpty()) {
            System.out.println("❌ [Inscription] No hay documentos cargados");
            return false;
        }

        // Si no hay tipos requeridos definidos, considerar como completo
        if (requiredDocumentTypes == null || requiredDocumentTypes.isEmpty()) {
            System.out.println("✅ [Inscription] No hay documentos requeridos definidos");
            return true;
        }

        // Obtener los códigos de los tipos de documentos que el usuario tiene
        Set<String> userDocumentCodes = this.documents.stream()
            .filter(doc -> doc.getDocumentType() != null)
            .map(doc -> doc.getDocumentType().getCode())
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        System.out.println("🔍 [Inscription] Códigos de documentos del usuario: " + userDocumentCodes);

        // Verificar qué documentos faltan
        Set<String> missingDocuments = new HashSet<>(requiredDocumentTypes);
        missingDocuments.removeAll(userDocumentCodes);

        boolean hasAllDocuments = userDocumentCodes.containsAll(requiredDocumentTypes);

        if (hasAllDocuments) {
            System.out.println("✅ [Inscription] TODOS los documentos requeridos están presentes");
        } else {
            System.out.println("❌ [Inscription] FALTAN documentos: " + missingDocuments);
        }

        // Verificar si todos los documentos requeridos están presentes
        return hasAllDocuments;
    }

    /**
     * @deprecated Usar hasAllRequiredDocuments(Set<String> requiredDocumentTypes) en su lugar
     * Método mantenido temporalmente para compatibilidad
     */
    @Deprecated
    public boolean hasAllRequiredDocuments() {
        // Usar la lista hardcodeada como fallback para compatibilidad
        Set<String> requiredDocumentCodes = Set.of(
            "DNI_FRONTAL",
            "DNI_DORSO",
            "CONSTANCIA_CUIL",
            "ANTECEDENTES_PENALES",
            "CERTIFICADO_PROFESIONAL_ANTIGUEDAD",
            "CERTIFICADO_SIN_SANCIONES"
        );
        return hasAllRequiredDocuments(requiredDocumentCodes);
    }

    /**
     * Completa la inscripción con el estado apropiado según la documentación
     * CRITICAL FIX: Ahora requiere los tipos de documentos requeridos como parámetro
     *
     * @param requiredDocumentTypes Conjunto de códigos de tipos de documentos requeridos
     */
    public void completeInscription(Set<String> requiredDocumentTypes) {
        this.currentStep = InscriptionStep.COMPLETED;
        this.lastUpdated = LocalDateTime.now();

        if (hasAllRequiredDocuments(requiredDocumentTypes)) {
            this.state = InscriptionState.COMPLETED_WITH_DOCS;
        } else {
            this.state = InscriptionState.COMPLETED_PENDING_DOCS;
            // Establecer plazo perentorio de 3 días hábiles
            this.documentationDeadline = calculateDocumentationDeadline();
        }
    }

    /**
     * @deprecated Usar completeInscription(Set<String> requiredDocumentTypes) en su lugar
     * Método mantenido temporalmente para compatibilidad
     */
    @Deprecated
    public void completeInscription() {
        // Usar método deprecated como fallback
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