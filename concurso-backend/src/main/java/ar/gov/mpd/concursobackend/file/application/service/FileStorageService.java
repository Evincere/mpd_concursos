package ar.gov.mpd.concursobackend.file.application.service;

import ar.gov.mpd.concursobackend.shared.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Servicio para gestionar el almacenamiento de archivos
 *
 * Actualizado para usar el sistema de almacenamiento unificado
 * a través de StorageConfig.
 *
 * @author MPD Development Team
 * @version 2.0
 * @since 2025-07
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageService {

    private final StorageConfig storageConfig;

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

        // Usar la configuración centralizada para obtener la ruta
        Path uploadPath = storageConfig.getContestBasesPath();

        // Generar nombre único para el archivo
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".pdf";

        String filename = "contest_" + contestId + "_bases_" + UUID.randomUUID() + fileExtension;
        Path filePath = storageConfig.getContestBasesFilePath(filename);

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

        // Generar nombre único para el archivo
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".pdf";

        String filename = "contest_" + contestId + "_description_" + UUID.randomUUID() + fileExtension;
        Path filePath = storageConfig.getContestBasesFilePath(filename);

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
        return storageConfig.getContestBasesFilePath(filename);
    }

    /**
     * Verifica si un archivo existe
     *
     * @param filename Nombre del archivo
     * @return true si el archivo existe, false en caso contrario
     */
    public boolean fileExists(String filename) {
        return storageConfig.contestBasesFileExists(filename);
    }

    /**
     * Elimina un archivo
     *
     * @param filename Nombre del archivo a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean deleteFile(String filename) {
        try {
            Path filePath = storageConfig.getContestBasesFilePath(filename);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Error al eliminar archivo: {}", filename, e);
            return false;
        }
    }
}
