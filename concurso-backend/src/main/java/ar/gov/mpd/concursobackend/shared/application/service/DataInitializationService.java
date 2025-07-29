package ar.gov.mpd.concursobackend.shared.application.service;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentTypeSpringRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class DataInitializationService {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializationService.class);

    @Autowired
    private UserService userService;

    @Autowired
    private RolService rolService;

    @Autowired
    private IDocumentTypeSpringRepository documentTypeRepository;

    @Autowired
    private IUserSpringRepository userRepository;

    @Transactional
    public void initializeData() {
        logger.info("🚀 [DataInitializationService] INICIANDO CREACIÓN DE DATOS ESENCIALES");
        createRoles();
        createUsers();
        initializeDocumentTypes();
        logger.info("✅ [DataInitializationService] CREACIÓN DE DATOS ESENCIALES COMPLETADA");
    }

    private void createRoles() {
        logger.info("📋 [DataInitializationService] Verificando roles básicos...");
        createRoleIfNotExists(RoleEnum.ROLE_ADMIN);
        createRoleIfNotExists(RoleEnum.ROLE_USER);
    }

    private void createRoleIfNotExists(RoleEnum roleEnum) {
        if (!rolService.existsByRole(roleEnum)) {
            logger.info("📝 [DataInitializationService] Creando rol {}...", roleEnum.name());
            Rol newRol = new Rol(roleEnum);
            rolService.create(newRol);
            logger.info("✅ [DataInitializationService] Rol {} creado", roleEnum.name());
        } else {
            logger.info("⏭️ [DataInitializationService] Rol {} ya existe", roleEnum.name());
        }
    }

    private void createUsers() {
        logger.info("👥 [DataInitializationService] CREANDO USUARIOS ESENCIALES");
        String adminDni = "12345678";
        createSuperAdmin("admin", "admin@mpd.gov.ar", "admin123", adminDni, null, "Admin", "MPD");

        String userTestDni = "87654321";
        createUserIfNotExists("user_test", "user_test@example.com", "user123", userTestDni, null, "Usuario", "Test");
    }

    private void createUserIfNotExists(String username, String email, String password, String dni, String cuit,
                                       String firstName, String lastName) {
        if (userRepository.existsByUsername(username)) {
            logger.info("⏭️ [DataInitializationService] Usuario '{}' ya existe.", username);
            return;
        }
        logger.info("📝 [DataInitializationService] Creando usuario '{}'...", username);
        UserCreateDto user = new UserCreateDto();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(password);
        user.setDni(dni);
        if (cuit != null) {
            user.setCuit(cuit);
        }
        user.setNombre(firstName);
        user.setApellido(lastName);
        user.setConfirmPassword(password);

        userService.createUser(user);
        logger.info("✅ [DataInitializationService] Usuario '{}' creado", username);
    }

    private void createSuperAdmin(String username, String email, String password, String dni, String cuit,
                                  String firstName, String lastName) {
        if (userRepository.existsByUsername(username)) {
            logger.info("⏭️ [DataInitializationService] Super admin '{}' ya existe.", username);
            return;
        }
        logger.info("👑 [DataInitializationService] Creando super admin '{}'...", username);
        UserCreateDto user = new UserCreateDto();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(password);
        user.setDni(dni);
        if (cuit != null) {
            user.setCuit(cuit);
        }
        user.setNombre(firstName);
        user.setApellido(lastName);
        user.setConfirmPassword(password);

        User createdUser = userService.createUser(user);
        logger.info("✅ [DataInitializationService] Super admin '{}' creado con ID: {}", username, createdUser.getId().value());

        // Asignar rol ROLE_ADMIN de forma segura después de la creación
        try {
            logger.info("🔑 [DataInitializationService] Asignando rol ROLE_ADMIN a '{}'...", username);
            assignAdminRoleSafely(username);
            logger.info("✅ [DataInitializationService] Rol ROLE_ADMIN asignado a '{}'", username);
        } catch (Exception e) {
            logger.error("❌ [DataInitializationService] Error al asignar rol ROLE_ADMIN a '{}': {}", username, e.getMessage());
            logger.info("⚠️ [DataInitializationService] Usuario admin creado solo con ROLE_USER. Asignar ROLE_ADMIN manualmente si es necesario.");
        }
    }

    private void initializeDocumentTypes() {
        List<DocumentTypeEntity> existingTypes = documentTypeRepository.findByIsActiveTrue();
        if (existingTypes.isEmpty()) {
            logger.warn("⚠️ [DataInitializationService] No se encontraron tipos de documento activos. Creando tipos básicos...");
            createBasicDocumentTypes();
        } else {
            logger.info("📋 [DataInitializationService] Se encontraron {} tipos de documento existentes", existingTypes.size());
            verifyEssentialDocumentTypes(existingTypes);
            // NUEVA FUNCIONALIDAD: Verificar y corregir campos 'required'
            verifyAndFixRequiredFields(existingTypes);
        }
    }

    private void createBasicDocumentTypes() {
        logger.info("📝 [DataInitializationService] Creando tipos de documento básicos...");
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
            createDocumentTypeIfNotExists(type);
        }
        logger.info("📊 [DataInitializationService] Creación de tipos básicos completada");
    }

    private void createDocumentTypeIfNotExists(DocumentTypeEntity type) {
        if (documentTypeRepository.existsByCode(type.getCode())) {
            logger.debug("⏭️ [DataInitializationService] Tipo de documento ya existe: {}", type.getCode());
            return;
        }
        documentTypeRepository.save(type);
        logger.info("✅ [DataInitializationService] Tipo de documento creado: {} ({})", type.getName(), type.getCode());
    }

    private void verifyEssentialDocumentTypes(List<DocumentTypeEntity> existingTypes) {
        String[] essentialCodes = {"DNI_FRONTAL", "DNI_DORSO", "CONSTANCIA_CUIL", "ANTECEDENTES_PENALES", "DOCUMENTO_ADICIONAL"};
        for (String code : essentialCodes) {
            boolean exists = existingTypes.stream().anyMatch(type -> code.equals(type.getCode()));
            if (!exists) {
                logger.warn("⚠️ [DataInitializationService] Tipo esencial faltante: {}. Creando...", code);
                createMissingEssentialType(code);
            }
        }
    }

    private void createMissingEssentialType(String code) {
        if (documentTypeRepository.existsByCode(code)) {
            logger.debug("⏭️ [DataInitializationService] Tipo esencial ya existe: {}", code);
            return;
        }
        DocumentTypeEntity type = null;
        switch (code) {
            case "DNI_FRONTAL":
                type = createDocumentType("DNI_FRONTAL", "DNI (Frontal)", "Documento Nacional de Identidad - Lado frontal", true, 1);
                break;
            case "DNI_DORSO":
                type = createDocumentType("DNI_DORSO", "DNI (Dorso)", "Documento Nacional de Identidad - Lado posterior", true, 2);
                break;
            case "CONSTANCIA_CUIL":
                type = createDocumentType("CONSTANCIA_CUIL", "Constancia de CUIL", "Constancia de Código Único de Identificación Laboral", true, 3);
                break;
            case "ANTECEDENTES_PENALES":
                type = createDocumentType("ANTECEDENTES_PENALES", "Certificado de Antecedentes Penales", "Certificado de Antecedentes Penales vigente (antigüedad no mayor a 90 días)", true, 4);
                break;
            case "DOCUMENTO_ADICIONAL":
                type = createDocumentType("DOCUMENTO_ADICIONAL", "Documento Adicional", "Cualquier documento adicional requerido específicamente", false, 99);
                break;
        }
        if (type != null) {
            createDocumentTypeIfNotExists(type);
        }
    }

    private DocumentTypeEntity createDocumentType(String code, String name, String description, boolean required, int order) {
        DocumentTypeEntity entity = new DocumentTypeEntity();
        // NO asignar ID manualmente - dejar que JPA lo genere automáticamente para evitar conflictos de merge/persist
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
     * Verifica y corrige los campos 'required' de los tipos de documento existentes
     */
    private void verifyAndFixRequiredFields(List<DocumentTypeEntity> existingTypes) {
        logger.info("🔧 [DataInitializationService] Verificando campos 'required' de tipos de documento...");

        // Definir qué tipos deben ser obligatorios
        Map<String, Boolean> expectedRequiredStatus = Map.of(
            "DNI_FRONTAL", true,
            "DNI_DORSO", true,
            "CONSTANCIA_CUIL", true,
            "ANTECEDENTES_PENALES", true,
            "CERTIFICADO_PROFESIONAL_ANTIGUEDAD", true,
            "CERTIFICADO_SIN_SANCIONES", true,
            "CERTIFICADO_LEY_MICAELA", false,
            "DOCUMENTO_ADICIONAL", false
        );

        boolean hasChanges = false;

        for (DocumentTypeEntity type : existingTypes) {
            Boolean expectedRequired = expectedRequiredStatus.get(type.getCode());
            if (expectedRequired != null && type.isRequired() != expectedRequired) {
                logger.warn("🔧 [DataInitializationService] Corrigiendo campo 'required' para {}: {} → {}",
                    type.getCode(), type.isRequired(), expectedRequired);
                type.setRequired(expectedRequired);
                documentTypeRepository.save(type);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            logger.info("✅ [DataInitializationService] Campos 'required' corregidos exitosamente");
        } else {
            logger.info("✅ [DataInitializationService] Todos los campos 'required' están correctos");
        }
    }

    /**
     * Asigna el rol ROLE_ADMIN al usuario de forma segura, manejando conflictos de concurrencia
     */
    private void assignAdminRoleSafely(String username) {
        int maxRetries = 3;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                // Esperar un poco antes de intentar asignar el rol para evitar conflictos
                if (retryCount > 0) {
                    Thread.sleep(500 * retryCount); // Backoff exponencial
                }

                rolService.assignRoleToUser(username, RoleEnum.ROLE_ADMIN);
                logger.info("✅ [DataInitializationService] Rol ROLE_ADMIN asignado exitosamente a '{}' en intento {}",
                           username, retryCount + 1);
                return; // Éxito, salir del método

            } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
                retryCount++;
                logger.warn("⚠️ [DataInitializationService] Error de concurrencia optimista al asignar rol a '{}' (intento {}): {}",
                           username, retryCount, e.getMessage());

                if (retryCount >= maxRetries) {
                    logger.error("❌ [DataInitializationService] Falló la asignación de rol después de {} intentos", maxRetries);
                    throw new RuntimeException("No se pudo asignar el rol ROLE_ADMIN después de " + maxRetries + " intentos", e);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Proceso interrumpido durante la asignación de rol", e);

            } catch (Exception e) {
                logger.error("❌ [DataInitializationService] Error inesperado al asignar rol ROLE_ADMIN a '{}': {}",
                           username, e.getMessage(), e);
                throw e;
            }
        }
    }
}
