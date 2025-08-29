package ar.gov.mpd.concursobackend.document.domain.port;

import java.io.InputStream;
import java.util.UUID;

public interface IDocumentStorageService {
    String storeFile(InputStream fileContent, String fileName, UUID userId, UUID documentId, String userDni, String documentTypeName);

    InputStream getFile(String filePath);

    void deleteFile(String filePath);

    /**
     * Obtiene la ubicación base de almacenamiento de documentos
     */
    String getStorageLocation();

    /**
     * Reemplaza un archivo existente manteniendo el mismo nombre y ubicación.
     * 
     * @param existingFilePath Ruta del archivo actual a reemplazar
     * @param newFileContent InputStream del nuevo contenido
     * @param originalFileName Nombre del archivo original (para logging)
     * @param documentId ID del documento (para logging)
     * @return La nueva ruta del archivo (debería ser la misma que existingFilePath)
     * @throws RuntimeException si el archivo original no existe o hay errores de E/S
     */
    String replaceFile(String existingFilePath, InputStream newFileContent, String originalFileName, UUID documentId);
}
