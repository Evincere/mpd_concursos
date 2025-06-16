package ar.gov.mpd.concursobackend.document.domain.port;

import java.io.InputStream;
import java.util.UUID;

public interface IDocumentStorageService {
    String storeFile(InputStream fileContent, String fileName, UUID userId, UUID documentId, String userDni, String documentTypeName);

    InputStream getFile(String filePath);

    void deleteFile(String filePath);
}