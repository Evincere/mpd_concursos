package ar.gov.mpd.concursobackend.document.application.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.SAXException;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentValidationResult;
import ar.gov.mpd.concursobackend.document.application.dto.ValidationError;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio para validar documentos
 */
@Service
@Slf4j
public class DocumentValidationService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    // Solo PDF para documentación oficial
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf");

    /**
     * Valida un archivo
     * 
     * @param file Archivo a validar
     * @return Resultado de la validación
     */
    public DocumentValidationResult validateFile(MultipartFile file) {
        List<ValidationError> errors = new ArrayList<>();

        // Validar que el archivo no sea nulo
        if (file == null || file.isEmpty()) {
            errors.add(new ValidationError("FILE_EMPTY", "El archivo está vacío"));
            return new DocumentValidationResult(false, errors);
        }

        // Validar tamaño
        if (file.getSize() > MAX_FILE_SIZE) {
            errors.add(new ValidationError("FILE_TOO_LARGE",
                    "El archivo excede el tamaño máximo permitido de 10MB"));
        }

        // Validar tipo MIME
        String detectedMimeType = detectMimeType(file);
        if (!ALLOWED_MIME_TYPES.contains(detectedMimeType)) {
            errors.add(new ValidationError("INVALID_FILE_TYPE",
                    "Tipo de archivo no permitido. Solo se permiten archivos PDF"));
        }

        // Validar contenido malicioso
        try {
            if (containsMaliciousContent(file)) {
                errors.add(new ValidationError("MALICIOUS_CONTENT",
                        "El archivo contiene contenido potencialmente malicioso"));
            }
        } catch (Exception e) {
            log.error("Error al validar contenido malicioso", e);
            errors.add(new ValidationError("VALIDATION_ERROR",
                    "No se pudo validar el contenido del archivo"));
        }

        return new DocumentValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Detecta el tipo MIME real del archivo usando Apache Tika
     * 
     * @param file Archivo a analizar
     * @return Tipo MIME detectado
     */
    private String detectMimeType(MultipartFile file) {
        try {
            Tika tika = new Tika();
            return tika.detect(file.getInputStream());
        } catch (IOException e) {
            log.error("Error al detectar tipo MIME", e);
            return "application/octet-stream";
        }
    }

    /**
     * Verifica si un archivo PDF contiene contenido malicioso
     * 
     * @param file Archivo a analizar
     * @return true si contiene contenido malicioso, false en caso contrario
     */
    private boolean containsMaliciousContent(MultipartFile file) throws IOException, SAXException, TikaException {
        String mimeType = detectMimeType(file);

        if ("application/pdf".equals(mimeType)) {
            return containsMaliciousPdfContent(file.getInputStream());
        }

        // Validaciones específicas para otros tipos de archivo
        if (mimeType.startsWith("image/")) {
            return containsMaliciousImageContent(file);
        }

        if (mimeType.startsWith("application/vnd.openxmlformats-officedocument") ||
            mimeType.startsWith("application/msword") ||
            mimeType.startsWith("application/vnd.ms-excel") ||
            mimeType.startsWith("application/vnd.ms-powerpoint")) {
            return containsMaliciousOfficeContent(file);
        }

        // Para tipos de archivo no soportados específicamente, realizar validación básica
        return containsBasicMaliciousContent(file);
    }

    /**
     * Verifica si un PDF contiene contenido malicioso
     * 
     * @param inputStream Stream del archivo PDF
     * @return true si contiene contenido malicioso, false en caso contrario
     */
    private boolean containsMaliciousPdfContent(InputStream inputStream) throws IOException, SAXException, TikaException {
        // Palabras clave que podrían indicar contenido malicioso en un PDF
        List<String> suspiciousKeywords = Arrays.asList(
                "/JS", "/JavaScript", "/Launch", "/Action", "/OpenAction", "/AA",
                "/AcroForm", "/XFA", "/RichMedia", "/Encrypt");

        BodyContentHandler handler = new BodyContentHandler();
        Metadata metadata = new Metadata();
        ParseContext context = new ParseContext();
        PDFParser parser = new PDFParser();

        try {
            parser.parse(inputStream, handler, metadata, context);

            // Verificar metadatos sospechosos
            for (String name : metadata.names()) {
                for (String keyword : suspiciousKeywords) {
                    if (name.contains(keyword) || metadata.get(name).contains(keyword)) {
                        log.warn("Detected suspicious content in PDF: {}", keyword);
                        return true;
                    }
                }
            }

            // Verificar contenido sospechoso
            String content = handler.toString().toLowerCase();
            for (String keyword : suspiciousKeywords) {
                if (content.contains(keyword.toLowerCase())) {
                    log.warn("Detected suspicious content in PDF: {}", keyword);
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            log.error("Error al analizar PDF", e);
            // En caso de error, asumimos que el archivo podría ser malicioso
            return true;
        }
    }

    /**
     * Valida la calidad de una imagen
     *
     * @param file Archivo de imagen a validar
     * @return Resultado de la validación
     */
    public DocumentValidationResult validateImageQuality(MultipartFile file) {
        List<ValidationError> errors = new ArrayList<>();

        // Implementar validación de calidad de imagen
        // Esta es una implementación básica, se puede mejorar con bibliotecas
        // específicas para análisis de imágenes

        return new DocumentValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Verifica si una imagen contiene contenido malicioso
     *
     * @param file Archivo de imagen a validar
     * @return true si contiene contenido malicioso, false en caso contrario
     */
    private boolean containsMaliciousImageContent(MultipartFile file) {
        try {
            // Validaciones básicas para imágenes
            String content = extractTextFromFile(file);

            // Buscar patrones sospechosos en metadatos de imagen
            List<String> suspiciousPatterns = Arrays.asList(
                    "script", "javascript", "vbscript", "onload", "onerror",
                    "eval(", "document.", "window.", "alert(", "prompt("
            );

            String lowerContent = content.toLowerCase();
            for (String pattern : suspiciousPatterns) {
                if (lowerContent.contains(pattern)) {
                    log.warn("Detected suspicious content in image: {}", pattern);
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            log.error("Error al analizar imagen", e);
            return true; // En caso de error, asumimos que podría ser malicioso
        }
    }

    /**
     * Verifica si un documento de Office contiene contenido malicioso
     *
     * @param file Archivo de Office a validar
     * @return true si contiene contenido malicioso, false en caso contrario
     */
    private boolean containsMaliciousOfficeContent(MultipartFile file) {
        try {
            String content = extractTextFromFile(file);

            // Patrones sospechosos comunes en documentos de Office
            List<String> suspiciousPatterns = Arrays.asList(
                    "macro", "vba", "activex", "shell", "cmd.exe", "powershell",
                    "wscript", "cscript", "regsvr32", "rundll32", "mshta"
            );

            String lowerContent = content.toLowerCase();
            for (String pattern : suspiciousPatterns) {
                if (lowerContent.contains(pattern)) {
                    log.warn("Detected suspicious content in Office document: {}", pattern);
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            log.error("Error al analizar documento de Office", e);
            return true; // En caso de error, asumimos que podría ser malicioso
        }
    }

    /**
     * Validación básica de contenido malicioso para tipos de archivo genéricos
     *
     * @param file Archivo a validar
     * @return true si contiene contenido malicioso, false en caso contrario
     */
    private boolean containsBasicMaliciousContent(MultipartFile file) {
        try {
            String content = extractTextFromFile(file);

            // Patrones básicos de contenido malicioso
            List<String> suspiciousPatterns = Arrays.asList(
                    "virus", "malware", "trojan", "backdoor", "exploit",
                    "shellcode", "payload", "injection", "xss", "csrf"
            );

            String lowerContent = content.toLowerCase();
            for (String pattern : suspiciousPatterns) {
                if (lowerContent.contains(pattern)) {
                    log.warn("Detected suspicious content in file: {}", pattern);
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            log.error("Error al realizar validación básica", e);
            return false; // Para validación básica, no bloqueamos en caso de error
        }
    }

    /**
     * Extrae texto de un archivo usando Apache Tika
     *
     * @param file Archivo del cual extraer texto
     * @return Texto extraído del archivo
     */
    private String extractTextFromFile(MultipartFile file) throws IOException, SAXException, TikaException {
        BodyContentHandler handler = new BodyContentHandler();
        Metadata metadata = new Metadata();
        ParseContext context = new ParseContext();
        AutoDetectParser parser = new AutoDetectParser();

        try (InputStream inputStream = file.getInputStream()) {
            parser.parse(inputStream, handler, metadata, context);
            return handler.toString();
        }
    }
}
