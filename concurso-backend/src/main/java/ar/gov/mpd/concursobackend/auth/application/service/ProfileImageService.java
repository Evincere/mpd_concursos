package ar.gov.mpd.concursobackend.auth.application.service;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.ProfileImageUrl;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para gestionar imágenes de perfil de usuario
 * 
 * Implementa la lógica de negocio para subir, actualizar y eliminar
 * imágenes de perfil siguiendo principios de arquitectura hexagonal.
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-06
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileImageService {

    private final UserService userService;
    
    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;
    
    private static final String PROFILE_IMAGES_DIR = "profile-images";
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_WIDTH = 1024;
    private static final int MAX_HEIGHT = 1024;
    
    /**
     * Sube una nueva imagen de perfil para el usuario
     * 
     * @param username Usuario propietario de la imagen
     * @param file Archivo de imagen a subir
     * @return URL de la imagen subida
     * @throws IllegalArgumentException si el archivo no es válido
     * @throws IOException si hay error al guardar el archivo
     */
    public String uploadProfileImage(String username, MultipartFile file) throws IOException {
        log.info("Iniciando subida de imagen de perfil para usuario: {}", username);
        
        // Validar archivo
        validateImageFile(file);
        
        // Obtener usuario
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + username));
        
        // Eliminar imagen anterior si existe
        if (user.getProfileImageUrl() != null && user.getProfileImageUrl().hasImage()) {
            deleteExistingImage(user.getProfileImageUrl());
        }
        
        // Generar nombre único para el archivo
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = generateUniqueFileName(user.getId().value(), fileExtension);
        
        // Crear directorio si no existe
        Path userImageDir = createUserImageDirectory(user.getId().value());
        Path filePath = userImageDir.resolve(fileName);
        
        // Guardar archivo
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Generar URL relativa
        String imageUrl = "/api/files/profile-images/" + user.getId().value() + "/" + fileName;
        
        // Actualizar usuario con nueva URL
        user.setProfileImageUrl(ProfileImageUrl.of(imageUrl));
        userService.updateUser(user);
        
        log.info("Imagen de perfil subida exitosamente para usuario {}: {}", username, imageUrl);
        return imageUrl;
    }
    
    /**
     * Elimina la imagen de perfil del usuario
     * 
     * @param username Usuario propietario de la imagen
     * @throws IOException si hay error al eliminar el archivo
     */
    public void deleteProfileImage(String username) throws IOException {
        log.info("Eliminando imagen de perfil para usuario: {}", username);
        
        User user = userService.getByUsername(new UserUsername(username))
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + username));
        
        if (user.getProfileImageUrl() != null && user.getProfileImageUrl().hasImage()) {
            deleteExistingImage(user.getProfileImageUrl());
            
            // Actualizar usuario sin imagen
            user.setProfileImageUrl(ProfileImageUrl.empty());
            userService.updateUser(user);
            
            log.info("Imagen de perfil eliminada exitosamente para usuario: {}", username);
        } else {
            log.warn("Usuario {} no tiene imagen de perfil para eliminar", username);
        }
    }
    
    /**
     * Valida que el archivo de imagen sea válido
     */
    private void validateImageFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen está vacío");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de 5MB");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF");
        }
        
        String fileName = file.getOriginalFilename();
        if (fileName == null || !hasValidExtension(fileName)) {
            throw new IllegalArgumentException("Extensión de archivo no válida. Solo se permiten: .jpg, .jpeg, .png, .gif");
        }
        
        // Validar que sea realmente una imagen
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                throw new IllegalArgumentException("El archivo no es una imagen válida");
            }
            
            // Validar dimensiones
            if (image.getWidth() > MAX_WIDTH || image.getHeight() > MAX_HEIGHT) {
                throw new IllegalArgumentException(
                    String.format("Las dimensiones de la imagen exceden el máximo permitido (%dx%d)", 
                                MAX_WIDTH, MAX_HEIGHT));
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Error al procesar la imagen: " + e.getMessage());
        }
    }
    
    /**
     * Verifica si el archivo tiene una extensión válida
     */
    private boolean hasValidExtension(String fileName) {
        String extension = getFileExtension(fileName);
        return ALLOWED_EXTENSIONS.contains(extension.toLowerCase());
    }
    
    /**
     * Obtiene la extensión del archivo
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
    
    /**
     * Genera un nombre único para el archivo
     */
    private String generateUniqueFileName(UUID userId, String extension) {
        return "profile_" + userId.toString() + "_" + System.currentTimeMillis() + extension;
    }
    
    /**
     * Crea el directorio para las imágenes del usuario
     */
    private Path createUserImageDirectory(UUID userId) throws IOException {
        Path userDir = Paths.get(uploadDir, PROFILE_IMAGES_DIR, userId.toString());
        if (!Files.exists(userDir)) {
            Files.createDirectories(userDir);
        }
        return userDir;
    }
    
    /**
     * Elimina una imagen existente del filesystem
     */
    private void deleteExistingImage(ProfileImageUrl profileImageUrl) {
        try {
            String url = profileImageUrl.getValue();
            if (url.startsWith("/api/files/profile-images/")) {
                String relativePath = url.substring("/api/files/".length());
                Path filePath = Paths.get(uploadDir, relativePath);
                
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Imagen anterior eliminada: {}", filePath);
                } else {
                    log.warn("Archivo de imagen no encontrado para eliminar: {}", filePath);
                }
            }
        } catch (IOException e) {
            log.error("Error al eliminar imagen anterior: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el proceso principal
        }
    }
}
