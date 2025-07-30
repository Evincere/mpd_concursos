package ar.gov.mpd.concursobackend.contest.application.service;

import ar.gov.mpd.concursobackend.contest.infrastructure.web.dto.ContestDocumentAvailabilityResponse;
import ar.gov.mpd.concursobackend.shared.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Servicio para gestionar documentos de concursos (bases y descripciones)
 * 
 * Maneja la verificación de disponibilidad y generación de URLs para
 * documentos de concursos usando nomenclatura específica:
 * - Bases: bases_concurso_{contestId}.pdf
 * - Descripción: descripcion_concurso_{contestId}.pdf
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-07
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContestDocumentService {

    private final StorageConfig storageConfig;

    // Constantes para nomenclatura de archivos
    private static final String BASES_FILENAME_PATTERN = "bases_concurso_%d.pdf";
    private static final String DESCRIPTION_FILENAME_PATTERN = "descripcion_concurso_%d.pdf";
    private static final String BASES_URL_PATTERN = "/api/files/contest-bases/bases_concurso_%d.pdf";
    private static final String DESCRIPTION_URL_PATTERN = "/api/files/contest-bases/descripcion_concurso_%d.pdf";

    /**
     * Obtiene la disponibilidad de documentos para un concurso específico
     * 
     * @param contestId ID del concurso
     * @return Información de disponibilidad de documentos
     */
    public ContestDocumentAvailabilityResponse getDocumentAvailability(Long contestId) {
        log.info("Verificando disponibilidad de documentos para concurso: {}", contestId);

        try {
            // Generar nombres de archivos según nomenclatura
            String basesFilename = String.format(BASES_FILENAME_PATTERN, contestId);
            String descriptionFilename = String.format(DESCRIPTION_FILENAME_PATTERN, contestId);

            log.debug("Buscando archivos: {} y {}", basesFilename, descriptionFilename);

            // Verificar existencia de archivos
            boolean basesAvailable = checkFileExists(basesFilename);
            boolean descriptionAvailable = checkFileExists(descriptionFilename);

            log.info("Disponibilidad para concurso {}: bases={}, descripción={}", 
                    contestId, basesAvailable, descriptionAvailable);

            // Generar URLs solo si los archivos existen
            String basesUrl = basesAvailable ? String.format(BASES_URL_PATTERN, contestId) : null;
            String descriptionUrl = descriptionAvailable ? String.format(DESCRIPTION_URL_PATTERN, contestId) : null;

            // Crear respuesta
            ContestDocumentAvailabilityResponse response = ContestDocumentAvailabilityResponse.builder()
                    .contestId(contestId)
                    .basesAvailable(basesAvailable)
                    .descriptionAvailable(descriptionAvailable)
                    .basesUrl(basesUrl)
                    .descriptionUrl(descriptionUrl)
                    .message(generateAvailabilityMessage(basesAvailable, descriptionAvailable))
                    .build();

            log.debug("Respuesta generada: {}", response);
            return response;

        } catch (Exception e) {
            log.error("Error al verificar disponibilidad de documentos para concurso {}: {}", 
                     contestId, e.getMessage(), e);
            
            return new ContestDocumentAvailabilityResponse(contestId, 
                    "Error al verificar disponibilidad de documentos");
        }
    }

    /**
     * Verifica si un archivo existe en el directorio de bases de concursos
     * 
     * @param filename Nombre del archivo a verificar
     * @return true si el archivo existe, false en caso contrario
     */
    private boolean checkFileExists(String filename) {
        try {
            Path filePath = storageConfig.getContestBasesFilePath(filename);
            boolean exists = Files.exists(filePath);
            
            log.debug("Verificando archivo {}: existe={}, ruta={}", filename, exists, filePath);
            return exists;
            
        } catch (Exception e) {
            log.warn("Error al verificar existencia del archivo {}: {}", filename, e.getMessage());
            return false;
        }
    }

    /**
     * Genera un mensaje descriptivo basado en la disponibilidad de documentos
     * 
     * @param basesAvailable Si las bases están disponibles
     * @param descriptionAvailable Si la descripción está disponible
     * @return Mensaje descriptivo
     */
    private String generateAvailabilityMessage(boolean basesAvailable, boolean descriptionAvailable) {
        if (basesAvailable && descriptionAvailable) {
            return "Todos los documentos están disponibles para descarga";
        } else if (basesAvailable) {
            return "Las bases del concurso están disponibles. La descripción del puesto se publicará próximamente";
        } else if (descriptionAvailable) {
            return "La descripción del puesto está disponible. Las bases del concurso se publicarán próximamente";
        } else {
            return "Los documentos del concurso aún no se han publicado";
        }
    }

    /**
     * Obtiene la ruta física de un archivo de bases
     * 
     * @param contestId ID del concurso
     * @return Ruta física del archivo de bases
     */
    public Path getBasesFilePath(Long contestId) {
        String filename = String.format(BASES_FILENAME_PATTERN, contestId);
        return storageConfig.getContestBasesFilePath(filename);
    }

    /**
     * Obtiene la ruta física de un archivo de descripción
     * 
     * @param contestId ID del concurso
     * @return Ruta física del archivo de descripción
     */
    public Path getDescriptionFilePath(Long contestId) {
        String filename = String.format(DESCRIPTION_FILENAME_PATTERN, contestId);
        return storageConfig.getContestBasesFilePath(filename);
    }

    /**
     * Verifica si las bases de un concurso están disponibles
     * 
     * @param contestId ID del concurso
     * @return true si las bases están disponibles
     */
    public boolean areBasesAvailable(Long contestId) {
        String filename = String.format(BASES_FILENAME_PATTERN, contestId);
        return checkFileExists(filename);
    }

    /**
     * Verifica si la descripción de un concurso está disponible
     * 
     * @param contestId ID del concurso
     * @return true si la descripción está disponible
     */
    public boolean isDescriptionAvailable(Long contestId) {
        String filename = String.format(DESCRIPTION_FILENAME_PATTERN, contestId);
        return checkFileExists(filename);
    }
}
