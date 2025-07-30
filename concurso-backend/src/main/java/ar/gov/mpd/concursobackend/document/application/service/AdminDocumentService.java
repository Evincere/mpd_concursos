package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentTypeDto;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentSpringRepository;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de administración de documentos
 * Proporciona funcionalidades específicas para administradores
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminDocumentService {

    private final IDocumentRepository documentRepository;
    private final IDocumentSpringRepository documentSpringRepository;
    private final IUserSpringRepository userSpringRepository;
    private final DocumentMapper documentMapper;
    private final EntityManager entityManager;

    /**
     * DTO para documentos con información de usuario
     */
    public static class AdminDocumentDto extends DocumentDto {
        private String nombreUsuario;
        private String emailUsuario;
        private String dniUsuario;

        // Constructors
        public AdminDocumentDto() {
            super();
        }

        public AdminDocumentDto(DocumentDto documentDto, String nombreUsuario, String emailUsuario, String dniUsuario) {
            super(documentDto.getId(), documentDto.getTipoDocumentoId(), documentDto.getTipoDocumento(),
                  documentDto.getNombreArchivo(), documentDto.getContentType(), documentDto.getEstado(),
                  documentDto.getComentarios(), documentDto.getFechaCarga(), documentDto.getValidadoPor(),
                  documentDto.getFechaValidacion(), documentDto.getMotivoRechazo());
            this.nombreUsuario = nombreUsuario;
            this.emailUsuario = emailUsuario;
            this.dniUsuario = dniUsuario;
        }

        // Getters and Setters
        public String getNombreUsuario() { return nombreUsuario; }
        public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
        public String getEmailUsuario() { return emailUsuario; }
        public void setEmailUsuario(String emailUsuario) { this.emailUsuario = emailUsuario; }
        public String getDniUsuario() { return dniUsuario; }
        public void setDniUsuario(String dniUsuario) { this.dniUsuario = dniUsuario; }
    }

    /**
     * DTO para estadísticas de documentos
     */
    public static class DocumentStatistics {
        private long totalDocumentos;
        private long pendientes;
        private long aprobados;
        private long rechazados;
        private Map<String, Long> porTipo;

        public DocumentStatistics() {
            this.porTipo = new HashMap<>();
        }

        // Getters and Setters
        public long getTotalDocumentos() { return totalDocumentos; }
        public void setTotalDocumentos(long totalDocumentos) { this.totalDocumentos = totalDocumentos; }
        public long getPendientes() { return pendientes; }
        public void setPendientes(long pendientes) { this.pendientes = pendientes; }
        public long getAprobados() { return aprobados; }
        public void setAprobados(long aprobados) { this.aprobados = aprobados; }
        public long getRechazados() { return rechazados; }
        public void setRechazados(long rechazados) { this.rechazados = rechazados; }
        public Map<String, Long> getPorTipo() { return porTipo; }
        public void setPorTipo(Map<String, Long> porTipo) { this.porTipo = porTipo; }
    }

    /**
     * DTO para filtros de búsqueda
     */
    public static class DocumentFilters {
        private String estado;
        private String tipoDocumentoId;
        private LocalDateTime fechaDesde;
        private LocalDateTime fechaHasta;
        private String usuarioId;
        private String busqueda;

        // Getters and Setters
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
        public String getTipoDocumentoId() { return tipoDocumentoId; }
        public void setTipoDocumentoId(String tipoDocumentoId) { this.tipoDocumentoId = tipoDocumentoId; }
        public LocalDateTime getFechaDesde() { return fechaDesde; }
        public void setFechaDesde(LocalDateTime fechaDesde) { this.fechaDesde = fechaDesde; }
        public LocalDateTime getFechaHasta() { return fechaHasta; }
        public void setFechaHasta(LocalDateTime fechaHasta) { this.fechaHasta = fechaHasta; }
        public String getUsuarioId() { return usuarioId; }
        public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
        public String getBusqueda() { return busqueda; }
        public void setBusqueda(String busqueda) { this.busqueda = busqueda; }
    }

    /**
     * DTO para respuesta paginada
     */
    public static class PagedDocumentResponse {
        private List<AdminDocumentDto> content;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int size;

        public PagedDocumentResponse(List<AdminDocumentDto> content, long totalElements, int totalPages, int currentPage, int size) {
            this.content = content;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.currentPage = currentPage;
            this.size = size;
        }

        // Getters and Setters
        public List<AdminDocumentDto> getContent() { return content; }
        public void setContent(List<AdminDocumentDto> content) { this.content = content; }
        public long getTotalElements() { return totalElements; }
        public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
        public int getCurrentPage() { return currentPage; }
        public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
    }

    /**
     * Obtiene documentos con filtros y paginación
     */
    public PagedDocumentResponse getDocuments(DocumentFilters filters, int page, int size, String sort, String direction) {
        log.debug("Obteniendo documentos con filtros: {}, página: {}, tamaño: {}", filters, page, size);

        // Crear Pageable
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = mapSortField(sort);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        // Construir query dinámicamente
        StringBuilder jpql = new StringBuilder();
        jpql.append("SELECT d FROM DocumentEntity d ");
        jpql.append("LEFT JOIN d.documentType dt ");
        jpql.append("WHERE d.isArchived = false ");

        Map<String, Object> parameters = new HashMap<>();

        // Aplicar filtros
        if (filters != null) {
            if (filters.getEstado() != null && !filters.getEstado().isEmpty() && !"ALL".equalsIgnoreCase(filters.getEstado())) {
                jpql.append("AND d.status = :estado ");
                parameters.put("estado", DocumentEntity.DocumentStatusEnum.valueOf(filters.getEstado().toUpperCase()));
            }

            if (filters.getTipoDocumentoId() != null && !filters.getTipoDocumentoId().isEmpty()) {
                jpql.append("AND dt.id = :tipoDocumentoId ");
                parameters.put("tipoDocumentoId", UUID.fromString(filters.getTipoDocumentoId()));
            }

            if (filters.getUsuarioId() != null && !filters.getUsuarioId().isEmpty()) {
                jpql.append("AND d.userId = :usuarioId ");
                parameters.put("usuarioId", UUID.fromString(filters.getUsuarioId()));
            }

            if (filters.getFechaDesde() != null) {
                jpql.append("AND d.uploadDate >= :fechaDesde ");
                parameters.put("fechaDesde", filters.getFechaDesde());
            }

            if (filters.getFechaHasta() != null) {
                jpql.append("AND d.uploadDate <= :fechaHasta ");
                parameters.put("fechaHasta", filters.getFechaHasta());
            }

            if (filters.getBusqueda() != null && !filters.getBusqueda().trim().isEmpty()) {
                jpql.append("AND (LOWER(d.fileName) LIKE LOWER(:busqueda) OR LOWER(dt.name) LIKE LOWER(:busqueda)) ");
                parameters.put("busqueda", "%" + filters.getBusqueda().trim() + "%");
            }
        }

        jpql.append("ORDER BY d.").append(sortField).append(" ").append(sortDirection.name());

        // Ejecutar query para obtener datos
        Query query = entityManager.createQuery(jpql.toString());
        parameters.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        @SuppressWarnings("unchecked")
        List<DocumentEntity> documentEntities = query.getResultList();

        // Ejecutar query para contar total
        String countJpql = jpql.toString().replaceFirst("SELECT d FROM", "SELECT COUNT(d) FROM").replaceAll("ORDER BY.*", "");
        Query countQuery = entityManager.createQuery(countJpql);
        parameters.forEach(countQuery::setParameter);
        long totalElements = (Long) countQuery.getSingleResult();

        // Convertir a DTOs con información de usuario
        List<AdminDocumentDto> adminDocuments = documentEntities.stream()
                .map(this::convertToAdminDocumentDto)
                .collect(Collectors.toList());

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PagedDocumentResponse(adminDocuments, totalElements, totalPages, page, size);
    }

    /**
     * Mapea campos de ordenamiento
     */
    private String mapSortField(String sort) {
        if (sort == null) return "uploadDate";

        return switch (sort.toLowerCase()) {
            case "fechacarga", "upload_date" -> "uploadDate";
            case "nombrearchivo", "file_name" -> "fileName";
            case "estado", "status" -> "status";
            case "tipo", "document_type" -> "uploadDate"; // Cambiar a uploadDate para evitar problemas con JOIN
            default -> "uploadDate";
        };
    }

    /**
     * Convierte DocumentEntity a AdminDocumentDto con información de usuario
     */
    private AdminDocumentDto convertToAdminDocumentDto(DocumentEntity entity) {
        try {
            DocumentDto baseDto = documentMapper.toDto(documentMapper.toDomain(entity));

            // Obtener información del usuario
            Optional<UserEntity> userOpt = userSpringRepository.findById(entity.getUserId());
            String nombreUsuario = "Usuario no encontrado";
            String emailUsuario = "";
            String dniUsuario = "";

            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();
                nombreUsuario = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                               (user.getLastName() != null ? user.getLastName() : "");
                emailUsuario = user.getEmail() != null ? user.getEmail() : "";
                dniUsuario = user.getDni() != null ? user.getDni() : "";
            }

            return new AdminDocumentDto(baseDto, nombreUsuario.trim(), emailUsuario, dniUsuario);
        } catch (Exception e) {
            log.error("Error al convertir DocumentEntity a AdminDocumentDto: {}", e.getMessage(), e);
            // Crear un DTO básico en caso de error
            AdminDocumentDto errorDto = new AdminDocumentDto();
            errorDto.setId(entity.getId().toString());
            errorDto.setNombreArchivo(entity.getFileName() != null ? entity.getFileName() : "Archivo desconocido");
            errorDto.setFechaCarga(entity.getUploadDate());
            errorDto.setEstado(entity.getStatus() != null ? entity.getStatus().name() : "UNKNOWN");
            errorDto.setNombreUsuario("Error al cargar usuario");
            errorDto.setEmailUsuario("");
            errorDto.setDniUsuario("");
            return errorDto;
        }
    }

    /**
     * Obtiene estadísticas de documentos
     */
    public DocumentStatistics getDocumentStatistics() {
        log.debug("Obteniendo estadísticas de documentos");

        DocumentStatistics stats = new DocumentStatistics();

        // Estadísticas por estado
        String statusQuery = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN d.status = 'PENDING' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN d.status = 'APPROVED' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN d.status = 'REJECTED' THEN 1 ELSE 0 END) as rechazados
            FROM DocumentEntity d 
            WHERE d.isArchived = false
            """;

        Query query = entityManager.createQuery(statusQuery);
        Object[] result = (Object[]) query.getSingleResult();

        stats.setTotalDocumentos(((Long) result[0]));
        stats.setPendientes(((Long) result[1]));
        stats.setAprobados(((Long) result[2]));
        stats.setRechazados(((Long) result[3]));

        // Estadísticas por tipo
        String typeQuery = """
            SELECT dt.name, COUNT(d)
            FROM DocumentEntity d
            JOIN d.documentType dt
            WHERE d.isArchived = false
            GROUP BY dt.id, dt.name
            """;

        Query typeQueryObj = entityManager.createQuery(typeQuery);
        @SuppressWarnings("unchecked")
        List<Object[]> typeResults = typeQueryObj.getResultList();

        Map<String, Long> porTipo = new HashMap<>();
        for (Object[] row : typeResults) {
            porTipo.put((String) row[0], (Long) row[1]);
        }
        stats.setPorTipo(porTipo);

        return stats;
    }

    /**
     * Aprueba un documento
     */
    @Transactional
    public DocumentDto approveDocument(String documentId, UUID adminId) {
        log.info("Aprobando documento {} por admin {}", documentId, adminId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Documento no encontrado: " + documentId));

        document.approve(adminId);
        Document savedDocument = documentRepository.save(document);

        log.info("Documento {} aprobado exitosamente", documentId);
        return documentMapper.toDto(savedDocument);
    }

    /**
     * Rechaza un documento
     */
    @Transactional
    public DocumentDto rejectDocument(String documentId, String motivo, UUID adminId) {
        log.info("Rechazando documento {} por admin {} con motivo: {}", documentId, adminId, motivo);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Documento no encontrado: " + documentId));

        document.reject(adminId, motivo);
        Document savedDocument = documentRepository.save(document);

        log.info("Documento {} rechazado exitosamente", documentId);
        return documentMapper.toDto(savedDocument);
    }
}
