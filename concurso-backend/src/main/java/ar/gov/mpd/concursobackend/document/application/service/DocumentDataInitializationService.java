package ar.gov.mpd.concursobackend.document.application.service;

import java.util.List;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentTypeSpringRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio para inicialización automática de datos básicos del sistema de documentos
 * Se ejecuta al inicio de la aplicación para garantizar que existan tipos de documento básicos
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Order(100) // Se ejecuta después de otros CommandLineRunner básicos
public class DocumentDataInitializationService implements CommandLineRunner {

    private final IDocumentTypeSpringRepository documentTypeRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🚀 [DocumentDataInitialization] Iniciando verificación de datos básicos del sistema de documentos");
        
        try {
            initializeDocumentTypes();
            log.info("✅ [DocumentDataInitialization] Inicialización de datos completada exitosamente");
        } catch (Exception e) {
            log.error("❌ [DocumentDataInitialization] Error durante la inicialización de datos", e);
            // No lanzamos la excepción para no impedir el inicio de la aplicación
        }
    }

    /**
     * Inicializa tipos de documento básicos si no existen
     */
    private void initializeDocumentTypes() {
        List<DocumentTypeEntity> existingTypes = documentTypeRepository.findByIsActiveTrue();
        
        if (existingTypes.isEmpty()) {
            log.warn("⚠️ [DocumentDataInitialization] No se encontraron tipos de documento activos. Creando tipos básicos...");
            createBasicDocumentTypes();
        } else {
            log.info("📋 [DocumentDataInitialization] Se encontraron {} tipos de documento existentes", existingTypes.size());
            
            // Verificar que existan los tipos esenciales
            verifyEssentialDocumentTypes(existingTypes);
        }
    }

    /**
     * Crea tipos de documento básicos
     */
    private void createBasicDocumentTypes() {
        log.info("📝 [DocumentDataInitialization] Creando tipos de documento básicos...");

        // Tipos de documento según reglas de negocio MPD
        DocumentTypeEntity[] basicTypes = {
            createDocumentType("DNI_FRONTAL", "DNI (Frontal)", "Documento Nacional de Identidad - Lado frontal", true, 1),
            createDocumentType("DNI_DORSO", "DNI (Dorso)", "Documento Nacional de Identidad - Lado posterior", true, 2),
            createDocumentType("CONSTANCIA_CUIL", "Constancia de CUIL", "Constancia de Código Único de Identificación Laboral", true, 3),
            createDocumentType("ANTECEDENTES_PENALES", "Certificado de Antecedentes Penales", "Certificado de Antecedentes Penales vigente (antigüedad no mayor a 90 días)", true, 4),
            createDocumentType("CERTIFICADO_PROFESIONAL_ANTIGUEDAD", "Certificado de Antigüedad Profesional", "Certificado de antigüedad en el ejercicio profesional", true, 5),
            createDocumentType("CERTIFICADO_SIN_SANCIONES", "Certificado Sin Sanciones Disciplinarias", "Certificado que acredite no registrar sanciones disciplinarias", true, 6),
            createDocumentType("CERTIFICADO_LEY_MICAELA", "Certificado Ley Micaela", "Certificado de capacitación en Ley Micaela (opcional)", false, 7),
            createDocumentType("DOCUMENTO_ADICIONAL", "Documento Adicional", "Cualquier documento adicional requerido específicamente", false, 99)
        };

        for (DocumentTypeEntity type : basicTypes) {
            try {
                documentTypeRepository.save(type);
                log.info("✅ [DocumentDataInitialization] Tipo de documento creado: {} ({})", type.getName(), type.getCode());
            } catch (Exception e) {
                log.error("❌ [DocumentDataInitialization] Error creando tipo de documento: {}", type.getCode(), e);
            }
        }

        log.info("📊 [DocumentDataInitialization] Creación de tipos básicos completada");
    }

    /**
     * Verifica que existan los tipos de documento esenciales
     */
    private void verifyEssentialDocumentTypes(List<DocumentTypeEntity> existingTypes) {
        String[] essentialCodes = {"DNI_FRONTAL", "DNI_DORSO", "CONSTANCIA_CUIL", "ANTECEDENTES_PENALES", "DOCUMENTO_ADICIONAL"};

        for (String code : essentialCodes) {
            boolean exists = existingTypes.stream()
                    .anyMatch(type -> code.equals(type.getCode()));

            if (!exists) {
                log.warn("⚠️ [DocumentDataInitialization] Tipo esencial faltante: {}. Creando...", code);
                createMissingEssentialType(code);
            }
        }
    }

    /**
     * Crea un tipo de documento esencial faltante
     */
    private void createMissingEssentialType(String code) {
        DocumentTypeEntity type = null;
        
        switch (code) {
            case "DNI_FRONTAL":
                type = createDocumentType("DNI_FRONTAL", "DNI (Frontal)",
                        "Documento Nacional de Identidad - Lado frontal", true, 1);
                break;
            case "DNI_DORSO":
                type = createDocumentType("DNI_DORSO", "DNI (Dorso)",
                        "Documento Nacional de Identidad - Lado posterior", true, 2);
                break;
            case "CONSTANCIA_CUIL":
                type = createDocumentType("CONSTANCIA_CUIL", "Constancia de CUIL",
                        "Constancia de Código Único de Identificación Laboral", true, 3);
                break;
            case "ANTECEDENTES_PENALES":
                type = createDocumentType("ANTECEDENTES_PENALES", "Certificado de Antecedentes Penales",
                        "Certificado de Antecedentes Penales vigente (antigüedad no mayor a 90 días)", true, 4);
                break;
            case "DOCUMENTO_ADICIONAL":
                type = createDocumentType("DOCUMENTO_ADICIONAL", "Documento Adicional",
                        "Cualquier documento adicional requerido específicamente", false, 99);
                break;
        }
        
        if (type != null) {
            try {
                documentTypeRepository.save(type);
                log.info("✅ [DocumentDataInitialization] Tipo esencial creado: {}", code);
            } catch (Exception e) {
                log.error("❌ [DocumentDataInitialization] Error creando tipo esencial: {}", code, e);
            }
        }
    }

    /**
     * Crea una entidad DocumentTypeEntity
     */
    private DocumentTypeEntity createDocumentType(String code, String name, String description, boolean required, int order) {
        DocumentTypeEntity entity = new DocumentTypeEntity();
        entity.setId(UUID.randomUUID());
        entity.setCode(code);
        entity.setName(name);
        entity.setDescription(description);
        entity.setActive(true);
        entity.setRequired(required);
        entity.setOrder(order);
        entity.setParent(null);
        return entity;
    }

    /**
     * Método para verificar el estado actual de tipos de documento (útil para debugging)
     */
    public void logCurrentDocumentTypesStatus() {
        List<DocumentTypeEntity> allTypes = documentTypeRepository.findAll();
        List<DocumentTypeEntity> activeTypes = documentTypeRepository.findByIsActiveTrue();
        
        log.info("📊 [DocumentDataInitialization] Estado actual:");
        log.info("   - Total tipos de documento: {}", allTypes.size());
        log.info("   - Tipos activos: {}", activeTypes.size());
        
        if (!activeTypes.isEmpty()) {
            log.info("   - Tipos activos disponibles:");
            activeTypes.forEach(type ->
                log.info("     * {} ({}) - Requerido: {}", type.getName(), type.getCode(), type.isRequired())
            );
        }
    }
}
