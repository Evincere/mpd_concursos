package ar.gov.mpd.concursobackend.document.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentTypeSpringRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.mapper.DocumentEntityMapper;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class DocumentTypeRepositoryImpl implements IDocumentTypeRepository {

    private final IDocumentTypeSpringRepository documentTypeSpringRepository;
    private final DocumentEntityMapper documentEntityMapper;

    @Override
    public DocumentType save(DocumentType documentType) {
        var entity = documentEntityMapper.toEntity(documentType);
        var savedEntity = documentTypeSpringRepository.save(entity);
        return documentEntityMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<DocumentType> findById(DocumentTypeId id) {
        return documentTypeSpringRepository.findById(id.value())
                .map(documentEntityMapper::toDomain);
    }

    @Override
    public Optional<DocumentType> findByCode(String code) {
        return documentTypeSpringRepository.findByCode(code)
                .map(documentEntityMapper::toDomain);
    }

    @Override
    public List<DocumentType> findAll() {
        return documentTypeSpringRepository.findAll()
                .stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<DocumentType> findAllActive() {
        return documentTypeSpringRepository.findByIsActiveTrue()
                .stream()
                .map(documentEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(DocumentTypeId id) {
        documentTypeSpringRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(DocumentTypeId id) {
        return documentTypeSpringRepository.existsById(id.value());
    }

    @Override
    public boolean existsByCode(String code) {
        return documentTypeSpringRepository.existsByCode(code);
    }
}