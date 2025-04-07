package ar.gov.mpd.concursobackend.document.application.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentTypeDto;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentTypeService {

    private final IDocumentTypeRepository documentTypeRepository;
    private final DocumentMapper documentMapper;

    @Transactional(readOnly = true)
    public List<DocumentTypeDto> getAllDocumentTypes() {
        log.debug("Getting all document types");

        List<DocumentType> documentTypes = documentTypeRepository.findAll();
        return documentMapper.toTypeDtoList(documentTypes);
    }

    @Transactional(readOnly = true)
    public List<DocumentTypeDto> getAllActiveDocumentTypes() {
        log.debug("Getting all active document types");

        List<DocumentType> documentTypes = documentTypeRepository.findAllActive();
        return documentMapper.toTypeDtoList(documentTypes);
    }

    @Transactional(readOnly = true)
    public DocumentTypeDto getDocumentTypeById(String id) {
        log.debug("Getting document type by id: {}", id);

        DocumentType documentType = documentTypeRepository.findById(new DocumentTypeId(UUID.fromString(id)))
                .orElseThrow(() -> new DocumentException("Document type not found"));

        return documentMapper.toTypeDto(documentType);
    }

    @Transactional
    public DocumentTypeDto createDocumentType(DocumentTypeDto documentTypeDto) {
        log.debug("Creating document type: {}", documentTypeDto);

        DocumentType documentType = DocumentType.create(
                documentTypeDto.getCode() != null ? documentTypeDto.getCode()
                        : generateCode(documentTypeDto.getNombre()),
                documentTypeDto.getNombre(),
                documentTypeDto.getDescripcion(),
                documentTypeDto.isRequerido(),
                documentTypeDto.getOrden());

        DocumentType savedDocumentType = documentTypeRepository.save(documentType);
        return documentMapper.toTypeDto(savedDocumentType);
    }

    /**
     * Generate a code from a name
     *
     * @param name Document type name
     * @return Code
     */
    private String generateCode(String name) {
        if (name == null || name.isEmpty()) {
            return "doc-" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Convert to lowercase, replace spaces with hyphens, remove special characters
        String code = name.toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-");

        // Ensure the code is unique
        if (documentTypeRepository.existsByCode(code)) {
            code = code + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        return code;
    }

    @Transactional
    public void deleteDocumentType(String id) {
        log.debug("Deleting document type with id: {}", id);

        DocumentTypeId documentTypeId = new DocumentTypeId(UUID.fromString(id));
        if (!documentTypeRepository.existsById(documentTypeId)) {
            throw new DocumentException("Document type not found");
        }

        documentTypeRepository.deleteById(documentTypeId);
    }
}