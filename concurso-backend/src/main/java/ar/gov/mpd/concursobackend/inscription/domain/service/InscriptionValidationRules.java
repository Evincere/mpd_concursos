package ar.gov.mpd.concursobackend.inscription.domain.service;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Servicio centralizado para reglas de validación de inscripciones
 * Define las reglas de negocio de manera consistente para todo el sistema
 */
@Service
@Slf4j
public class InscriptionValidationRules {
    
    /**
     * Tipos de documentos requeridos para una inscripción completa
     * Códigos basados en los tipos de documento del sistema
     * TODO: Hacer esto configurable por concurso
     */
    public static final Set<String> REQUIRED_DOCUMENT_TYPES = Set.of(
        "DNI_FRONTAL",
        "DNI_DORSO",
        "CONSTANCIA_CUIL",
        "ANTECEDENTES_PENALES",
        "CERTIFICADO_PROFESIONAL_ANTIGUEDAD"
    );
    
    /**
     * Longitud mínima requerida para el centro de vida
     */
    public static final int MIN_CENTRO_DE_VIDA_LENGTH = 10;
    
    /**
     * Circunscripciones válidas del sistema
     */
    public static final Set<String> VALID_CIRCUNSCRIPCIONES = Set.of(
        "Primera", "Segunda", "Tercera", "Cuarta"
    );
    
    /**
     * Departamentos válidos para la Segunda Circunscripción
     */
    public static final Set<String> VALID_SEGUNDA_DEPARTAMENTOS = Set.of(
        "San Rafael", "General Alvear", "Malargüe"
    );
    
    /**
     * Valida las preferencias de inscripción según las reglas de negocio
     * 
     * @param preferences Preferencias a validar
     * @return Lista de errores encontrados (vacía si es válida)
     */
    public List<String> validatePreferences(InscriptionPreferences preferences) {
        List<String> errors = new ArrayList<>();
        
        if (preferences == null) {
            errors.add("Las preferencias de inscripción son requeridas");
            return errors;
        }
        
        // Validar centro de vida
        validateCentroDeVida(preferences.getCentroDeVida(), errors);
        
        // Validar circunscripciones seleccionadas
        validateSelectedCircunscripciones(preferences.getSelectedCircunscripciones(), errors);
        
        // Validar aceptación de términos
        if (!preferences.isAcceptedTerms()) {
            errors.add("Debe aceptar los términos y condiciones del concurso");
        }
        
        // Validar confirmación de datos personales
        if (!preferences.isConfirmedPersonalData()) {
            errors.add("Debe confirmar la veracidad de sus datos personales");
        }
        
        log.debug("🔍 [ValidationRules] Validación de preferencias completada: {} errores encontrados", errors.size());
        
        return errors;
    }
    
    /**
     * Valida el centro de vida
     */
    private void validateCentroDeVida(String centroDeVida, List<String> errors) {
        if (centroDeVida == null || centroDeVida.trim().isEmpty()) {
            errors.add("Debe especificar su centro de vida (domicilio actual)");
            return;
        }
        
        String trimmedCentroDeVida = centroDeVida.trim();
        
        if (trimmedCentroDeVida.length() < MIN_CENTRO_DE_VIDA_LENGTH) {
            errors.add(String.format("El centro de vida debe tener al menos %d caracteres", MIN_CENTRO_DE_VIDA_LENGTH));
        }
        
        // Validaciones adicionales de formato
        if (!containsValidAddressComponents(trimmedCentroDeVida)) {
            errors.add("El centro de vida debe incluir dirección completa (calle, número, ciudad)");
        }
    }
    
    /**
     * Valida las circunscripciones seleccionadas
     */
    private void validateSelectedCircunscripciones(Set<String> selectedCircunscripciones, List<String> errors) {
        if (selectedCircunscripciones == null || selectedCircunscripciones.isEmpty()) {
            errors.add("Debe seleccionar al menos una circunscripción judicial");
            return;
        }
        
        // Validar cada selección
        for (String seleccion : selectedCircunscripciones) {
            if (seleccion == null || seleccion.trim().isEmpty()) {
                errors.add("Selección de circunscripción inválida (valor vacío)");
                continue;
            }
            
            String trimmedSeleccion = seleccion.trim();
            
            if (trimmedSeleccion.contains(":")) {
                // Formato "Circunscripción:Departamento"
                validateCircunscripcionWithDepartment(trimmedSeleccion, errors);
            } else {
                // Formato simple "Circunscripción"
                validateSimpleCircunscripcion(trimmedSeleccion, errors);
            }
        }
    }
    
    /**
     * Valida selección de circunscripción con departamento específico
     */
    private void validateCircunscripcionWithDepartment(String seleccion, List<String> errors) {
        String[] parts = seleccion.split(":");
        if (parts.length != 2) {
            errors.add(String.format("Formato de selección inválido: %s", seleccion));
            return;
        }
        
        String circunscripcion = parts[0].trim();
        String departamento = parts[1].trim();
        
        // Solo la Segunda Circunscripción permite departamentos específicos
        if (!"Segunda".equals(circunscripcion)) {
            errors.add(String.format("La %s Circunscripción no permite selección de departamentos específicos", circunscripcion));
            return;
        }
        
        if (!VALID_SEGUNDA_DEPARTAMENTOS.contains(departamento)) {
            errors.add(String.format("Departamento inválido para Segunda Circunscripción: %s", departamento));
        }
    }
    
    /**
     * Valida selección simple de circunscripción
     */
    private void validateSimpleCircunscripcion(String circunscripcion, List<String> errors) {
        if (!VALID_CIRCUNSCRIPCIONES.contains(circunscripcion)) {
            errors.add(String.format("Circunscripción inválida: %s", circunscripcion));
        }
    }
    
    /**
     * Verifica si el centro de vida contiene componentes válidos de dirección
     */
    private boolean containsValidAddressComponents(String centroDeVida) {
        // Verificaciones básicas de formato de dirección
        String lowerCase = centroDeVida.toLowerCase();
        
        // Debe contener al menos un número (número de calle)
        boolean hasNumber = centroDeVida.matches(".*\\d+.*");
        
        // Debe tener longitud mínima razonable
        boolean hasMinLength = centroDeVida.length() >= MIN_CENTRO_DE_VIDA_LENGTH;
        
        // No debe ser solo números o solo letras
        boolean hasLetters = centroDeVida.matches(".*[a-zA-ZáéíóúÁÉÍÓÚñÑ]+.*");
        
        return hasNumber && hasMinLength && hasLetters;
    }
    
    /**
     * Verifica si las preferencias están completas según las reglas de negocio
     */
    public boolean arePreferencesComplete(InscriptionPreferences preferences) {
        List<String> errors = validatePreferences(preferences);
        return errors.isEmpty();
    }
    
    /**
     * Obtiene los tipos de documentos requeridos
     */
    public Set<String> getRequiredDocumentTypes() {
        return REQUIRED_DOCUMENT_TYPES;
    }
    
    /**
     * Obtiene el nombre legible de un tipo de documento
     */
    public String getDocumentTypeDisplayName(String documentType) {
        return switch (documentType) {
            case "DNI_FRONTAL" -> "DNI (frente)";
            case "DNI_DORSO" -> "DNI (dorso)";
            case "CONSTANCIA_CUIL" -> "Constancia de CUIL";
            case "ANTECEDENTES_PENALES" -> "Certificado de antecedentes penales";
            case "CERTIFICADO_PROFESIONAL_ANTIGUEDAD" -> "Certificado profesional";
            default -> documentType;
        };
    }
}
