package ar.gov.mpd.concursobackend.document.application.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
                documentTypeDto.getNombre(),
                documentTypeDto.getDescripcion(),
                documentTypeDto.isRequerido(),
                documentTypeDto.getOrden());

        DocumentType savedDocumentType = documentTypeRepository.save(documentType);
        return documentMapper.toTypeDto(savedDocumentType);
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