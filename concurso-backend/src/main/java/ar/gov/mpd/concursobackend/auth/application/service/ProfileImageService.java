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
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    
    private static final String PROFILE_IMAGES_DIR = "profile-images";
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_WIDTH = 256; // Optimizado para imágenes de perfil
    private static final int MAX_HEIGHT = 256; // Optimizado para imágenes de perfil
    
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
        
        // Procesar y guardar archivo (con redimensionamiento si es necesario)
        processAndSaveImage(file, filePath);
        
        // Generar URL absoluta usando configuración
        String imageUrl = baseUrl + "/api/files/profile-images/" + user.getId().value() + "/" + fileName;
        
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
            log.debug("Usuario {} tiene imagen de perfil: {}", username, user.getProfileImageUrl().getValue());

            // Eliminar archivo físico
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
            
            // Las dimensiones se validarán y redimensionarán automáticamente en processAndSaveImage
            log.debug("Imagen válida: {}x{} pixels", image.getWidth(), image.getHeight());
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
            log.debug("Intentando eliminar imagen con URL: {}", url);

            String relativePath = extractRelativePathFromUrl(url);

            if (relativePath != null) {
                Path filePath = Paths.get(uploadDir, relativePath);
                log.debug("Ruta del archivo a eliminar: {}", filePath);

                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Imagen anterior eliminada exitosamente: {}", filePath);
                } else {
                    log.warn("Archivo de imagen no encontrado para eliminar: {}", filePath);
                }
            } else {
                log.warn("No se pudo extraer la ruta relativa de la URL: {}", url);
            }
        } catch (IOException e) {
            log.error("Error al eliminar imagen anterior: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el proceso principal
        }
    }

    /**
     * Extrae la ruta relativa del archivo desde una URL
     *
     * @param url URL completa o relativa de la imagen
     * @return Ruta relativa del archivo o null si no se puede extraer
     */
    private String extractRelativePathFromUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }

        // Manejar URLs absolutas (http://localhost:8080/api/files/profile-images/...)
        if (url.contains("/api/files/profile-images/")) {
            int startIndex = url.indexOf("/api/files/profile-images/");
            return url.substring(startIndex + "/api/files/".length());
        }
        // Manejar URLs relativas (/api/files/profile-images/...)
        else if (url.startsWith("/api/files/profile-images/")) {
            return url.substring("/api/files/".length());
        }

        return null;
    }

    /**
     * Procesa y guarda la imagen, redimensionándola si es necesario
     *
     * @param file Archivo de imagen original
     * @param targetPath Ruta donde guardar la imagen procesada
     * @throws IOException si hay error al procesar o guardar la imagen
     */
    private void processAndSaveImage(MultipartFile file, Path targetPath) throws IOException {
        try {
            // Leer la imagen original
            BufferedImage originalImage = ImageIO.read(file.getInputStream());
            if (originalImage == null) {
                throw new IllegalArgumentException("No se pudo leer la imagen");
            }

            int originalWidth = originalImage.getWidth();
            int originalHeight = originalImage.getHeight();

            log.debug("Imagen original: {}x{} pixels", originalWidth, originalHeight);

            BufferedImage processedImage = originalImage;

            // Redimensionar si excede las dimensiones máximas
            if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
                processedImage = resizeImage(originalImage, MAX_WIDTH, MAX_HEIGHT);
                log.info("Imagen redimensionada de {}x{} a {}x{} pixels",
                        originalWidth, originalHeight,
                        processedImage.getWidth(), processedImage.getHeight());
            }

            // Determinar formato de salida
            String formatName = getImageFormat(file.getOriginalFilename());

            // Guardar imagen procesada
            ImageIO.write(processedImage, formatName, targetPath.toFile());

            log.debug("Imagen guardada exitosamente en: {}", targetPath);

        } catch (IOException e) {
            log.error("Error al procesar imagen: {}", e.getMessage());
            throw new IOException("Error al procesar la imagen: " + e.getMessage(), e);
        }
    }

    /**
     * Redimensiona una imagen manteniendo la proporción
     *
     * @param originalImage Imagen original
     * @param maxWidth Ancho máximo
     * @param maxHeight Alto máximo
     * @return Imagen redimensionada
     */
    private BufferedImage resizeImage(BufferedImage originalImage, int maxWidth, int maxHeight) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calcular nuevas dimensiones manteniendo proporción
        double widthRatio = (double) maxWidth / originalWidth;
        double heightRatio = (double) maxHeight / originalHeight;
        double ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);

        // Crear imagen redimensionada con alta calidad
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();

        // Configurar renderizado de alta calidad
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Dibujar imagen redimensionada
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        return resizedImage;
    }

    /**
     * Obtiene el formato de imagen basado en la extensión del archivo
     *
     * @param filename Nombre del archivo
     * @return Formato de imagen (jpg, png, gif)
     */
    private String getImageFormat(String filename) {
        if (filename == null) {
            return "jpg";
        }

        String extension = getFileExtension(filename).toLowerCase();
        switch (extension) {
            case ".png":
                return "png";
            case ".gif":
                return "gif";
            case ".jpg":
            case ".jpeg":
            default:
                return "jpg";
        }
    }
}
