package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.EqualsAndHashCode;
import lombok.Getter;

/**
 * Value Object para la URL de imagen de perfil del usuario
 * 
 * Encapsula la lógica de validación y manejo de URLs de imágenes de perfil,
 * siguiendo los principios de Domain-Driven Design.
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-06
 */
@Getter
@EqualsAndHashCode
public class ProfileImageUrl {
    
    private final String value;
    
    /**
     * Constructor que valida la URL de imagen de perfil
     * 
     * @param value URL de la imagen de perfil
     * @throws IllegalArgumentException si la URL es inválida
     */
    public ProfileImageUrl(String value) {
        if (value != null) {
            validateUrl(value);
        }
        this.value = value;
    }
    
    /**
     * Crea una instancia vacía (sin imagen de perfil)
     * 
     * @return ProfileImageUrl con valor null
     */
    public static ProfileImageUrl empty() {
        return new ProfileImageUrl(null);
    }
    
    /**
     * Crea una instancia desde una URL válida
     * 
     * @param url URL de la imagen
     * @return ProfileImageUrl validada
     */
    public static ProfileImageUrl of(String url) {
        return new ProfileImageUrl(url);
    }
    
    /**
     * Verifica si tiene una imagen de perfil configurada
     * 
     * @return true si tiene imagen, false si está vacía
     */
    public boolean hasImage() {
        return value != null && !value.trim().isEmpty();
    }
    
    /**
     * Obtiene la URL como String, o null si no hay imagen
     * 
     * @return URL de la imagen o null
     */
    public String getUrlOrNull() {
        return hasImage() ? value : null;
    }
    
    /**
     * Valida que la URL tenga un formato válido
     * 
     * @param url URL a validar
     * @throws IllegalArgumentException si la URL es inválida
     */
    private void validateUrl(String url) {
        if (url.trim().isEmpty()) {
            throw new IllegalArgumentException("La URL de imagen de perfil no puede estar vacía");
        }
        
        if (url.length() > 500) {
            throw new IllegalArgumentException("La URL de imagen de perfil no puede exceder 500 caracteres");
        }
        
        // Validar que sea una URL válida (básico)
        if (!isValidUrl(url)) {
            throw new IllegalArgumentException("La URL de imagen de perfil no tiene un formato válido");
        }
    }
    
    /**
     * Verifica si la URL tiene un formato básico válido
     * 
     * @param url URL a verificar
     * @return true si es válida, false en caso contrario
     */
    private boolean isValidUrl(String url) {
        // Permitir URLs relativas (empiezan con /) y absolutas (empiezan con http)
        return url.startsWith("/") || 
               url.startsWith("http://") || 
               url.startsWith("https://") ||
               url.startsWith("data:image/"); // Para base64 si se necesita en el futuro
    }
    
    @Override
    public String toString() {
        return value != null ? value : "sin imagen";
    }
}
