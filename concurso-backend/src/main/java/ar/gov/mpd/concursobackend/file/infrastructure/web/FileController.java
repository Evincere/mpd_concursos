package ar.gov.mpd.concursobackend.file.infrastructure.web;

import ar.gov.mpd.concursobackend.file.application.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;

/**
 * Controlador para servir archivos estáticos
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * Sirve archivos de bases de concursos
     *
     * @param filename Nombre del archivo
     * @return Archivo como recurso
     */
    @GetMapping("/contest-bases/{filename:.+}")
    public ResponseEntity<Resource> serveContestBasesFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getContestBasesFilePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Archivo no encontrado o no legible: {}", filename);
                return ResponseEntity.notFound().build();
            }

            // Determinar el tipo de contenido
            String contentType = "application/pdf";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Error al servir archivo: {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint para verificar si un archivo existe
     *
     * @param filename Nombre del archivo
     * @return Estado del archivo
     */
    @GetMapping("/contest-bases/{filename:.+}/exists")
    public ResponseEntity<Boolean> checkFileExists(@PathVariable String filename) {
        boolean exists = fileStorageService.fileExists(filename);
        return ResponseEntity.ok(exists);
    }
}
