package ar.gov.mpd.concursobackend.file.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Servicio para gestionar el almacenamiento de archivos
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.file.contest-bases-dir:contest-bases}")
    private String contestBasesDir;

    /**
     * Almacena un archivo de bases de concurso
     *
     * @param file Archivo a almacenar
     * @param contestId ID del concurso
     * @return URL del archivo almacenado
     * @throws IOException Si hay error al almacenar el archivo
     */
    public String storeContestBasesFile(MultipartFile file, Long contestId) throws IOException {
        // Validar que el archivo sea PDF
        if (!file.getContentType().equals("application/pdf")) {
            throw new IllegalArgumentException("Solo se permiten archivos PDF para las bases del concurso");
        }

        // Crear directorio si no existe
        Path uploadPath = Paths.get(uploadDir, contestBasesDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generar nombre único para el archivo
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".pdf";
        
        String filename = "contest_" + contestId + "_bases_" + UUID.randomUUID() + fileExtension;
        Path filePath = uploadPath.resolve(filename);

        // Copiar archivo
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Archivo de bases almacenado: {}", filePath);

        // Retornar URL relativa
        return "/api/files/contest-bases/" + filename;
    }

    /**
     * Almacena un archivo de descripción de concurso
     *
     * @param file Archivo a almacenar
     * @param contestId ID del concurso
     * @return URL del archivo almacenado
     * @throws IOException Si hay error al almacenar el archivo
     */
    public String storeContestDescriptionFile(MultipartFile file, Long contestId) throws IOException {
        // Validar que el archivo sea PDF
        if (!file.getContentType().equals("application/pdf")) {
            throw new IllegalArgumentException("Solo se permiten archivos PDF para la descripción del concurso");
        }

        // Crear directorio si no existe
        Path uploadPath = Paths.get(uploadDir, contestBasesDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generar nombre único para el archivo
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".pdf";
        
        String filename = "contest_" + contestId + "_description_" + UUID.randomUUID() + fileExtension;
        Path filePath = uploadPath.resolve(filename);

        // Copiar archivo
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Archivo de descripción almacenado: {}", filePath);

        // Retornar URL relativa
        return "/api/files/contest-bases/" + filename;
    }

    /**
     * Obtiene la ruta física de un archivo
     *
     * @param filename Nombre del archivo
     * @return Ruta física del archivo
     */
    public Path getContestBasesFilePath(String filename) {
        return Paths.get(uploadDir, contestBasesDir, filename);
    }

    /**
     * Verifica si un archivo existe
     *
     * @param filename Nombre del archivo
     * @return true si el archivo existe, false en caso contrario
     */
    public boolean fileExists(String filename) {
        Path filePath = getContestBasesFilePath(filename);
        return Files.exists(filePath);
    }

    /**
     * Elimina un archivo
     *
     * @param filename Nombre del archivo a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean deleteFile(String filename) {
        try {
            Path filePath = getContestBasesFilePath(filename);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Error al eliminar archivo: {}", filename, e);
            return false;
        }
    }
}
