package ar.gov.mpd.concursobackend.shared.infrastructure.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Servicio para validar que la configuración de base de datos es segura
 * según el entorno de ejecución.
 * 
 * Este servicio verifica que:
 * 1. En producción se use ddl-auto=validate o none
 * 2. En desarrollo se permita ddl-auto=update con advertencias
 * 3. En testing se use ddl-auto=create-drop
 * 4. No se use ddl-auto=create o create-drop en producción
 * 
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-07
 */
@Service
public class DatabaseConfigurationValidationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfigurationValidationService.class);
    
    @Value("${spring.jpa.hibernate.ddl-auto:validate}")
    private String ddlAuto;
    
    @Value("${spring.jpa.generate-ddl:false}")
    private boolean generateDdl;
    
    private final Environment environment;
    
    public DatabaseConfigurationValidationService(Environment environment) {
        this.environment = environment;
    }
    
    /**
     * Valida la configuración de base de datos al iniciar la aplicación
     */
    @PostConstruct
    public void validateDatabaseConfiguration() {
        logger.info("=== VALIDACIÓN DE CONFIGURACIÓN DE BASE DE DATOS ===");
        
        String[] activeProfiles = environment.getActiveProfiles();
        logger.info("Perfiles activos: {}", Arrays.toString(activeProfiles));
        logger.info("DDL Auto: {}", ddlAuto);
        logger.info("Generate DDL: {}", generateDdl);
        
        validateByEnvironment(activeProfiles);
        validateSecurityRisks();
        
        logger.info("=== FIN VALIDACIÓN DE BASE DE DATOS ===");
    }
    
    /**
     * Valida la configuración según el entorno
     */
    private void validateByEnvironment(String[] activeProfiles) {
        boolean isProduction = Arrays.asList(activeProfiles).contains("prod");
        boolean isDevelopment = Arrays.asList(activeProfiles).contains("dev");
        boolean isTesting = Arrays.asList(activeProfiles).contains("test");
        
        if (isProduction) {
            validateProductionConfiguration();
        } else if (isDevelopment) {
            validateDevelopmentConfiguration();
        } else if (isTesting) {
            validateTestingConfiguration();
        } else {
            validateDefaultConfiguration();
        }
    }
    
    /**
     * Valida configuración de producción
     */
    private void validateProductionConfiguration() {
        logger.info("🔍 Validando configuración de PRODUCCIÓN...");
        
        if ("validate".equals(ddlAuto) || "none".equals(ddlAuto)) {
            logger.info("✅ DDL Auto configurado correctamente para producción: {}", ddlAuto);
        } else {
            logger.error("❌ PELIGRO: DDL Auto en producción debe ser 'validate' o 'none', actual: {}", ddlAuto);
            logger.error("❌ Esto puede causar pérdida de datos o cambios no deseados en el esquema");
        }
        
        if (!generateDdl) {
            logger.info("✅ Generate DDL deshabilitado correctamente en producción");
        } else {
            logger.error("❌ PELIGRO: Generate DDL habilitado en producción");
            logger.error("❌ Esto puede modificar el esquema automáticamente");
        }
    }
    
    /**
     * Valida configuración de desarrollo
     */
    private void validateDevelopmentConfiguration() {
        logger.info("🔍 Validando configuración de DESARROLLO...");
        
        if ("update".equals(ddlAuto)) {
            logger.warn("⚠️  DDL Auto en desarrollo: {} (permitido pero con precaución)", ddlAuto);
            logger.warn("⚠️  NUNCA usar esta configuración en producción");
        } else if ("create-drop".equals(ddlAuto)) {
            logger.warn("⚠️  DDL Auto en desarrollo: {} (datos se perderán al reiniciar)", ddlAuto);
        } else {
            logger.info("✅ DDL Auto en desarrollo: {}", ddlAuto);
        }
        
        if (generateDdl) {
            logger.warn("⚠️  Generate DDL habilitado en desarrollo (normal para desarrollo)");
        }
    }
    
    /**
     * Valida configuración de testing
     */
    private void validateTestingConfiguration() {
        logger.info("🔍 Validando configuración de TESTING...");
        
        if ("create-drop".equals(ddlAuto)) {
            logger.info("✅ DDL Auto configurado correctamente para testing: {}", ddlAuto);
        } else {
            logger.warn("⚠️  DDL Auto en testing: {} (recomendado: create-drop)", ddlAuto);
        }
        
        if (generateDdl) {
            logger.info("✅ Generate DDL habilitado para testing (correcto)");
        }
    }
    
    /**
     * Valida configuración por defecto
     */
    private void validateDefaultConfiguration() {
        logger.info("🔍 Validando configuración POR DEFECTO...");
        
        if ("validate".equals(ddlAuto)) {
            logger.info("✅ DDL Auto por defecto configurado de forma segura: {}", ddlAuto);
        } else {
            logger.warn("⚠️  DDL Auto por defecto: {} (considerar 'validate' para mayor seguridad)", ddlAuto);
        }
        
        if (!generateDdl) {
            logger.info("✅ Generate DDL deshabilitado por defecto (seguro)");
        } else {
            logger.warn("⚠️  Generate DDL habilitado por defecto (considerar deshabilitar)");
        }
    }
    
    /**
     * Valida riesgos de seguridad específicos
     */
    private void validateSecurityRisks() {
        logger.info("🔍 Validando riesgos de seguridad...");
        
        // Configuraciones peligrosas
        if ("create".equals(ddlAuto)) {
            logger.error("❌ PELIGRO CRÍTICO: ddl-auto=create eliminará todos los datos");
        }
        
        if ("create-drop".equals(ddlAuto) && !isTestingEnvironment()) {
            logger.error("❌ PELIGRO: ddl-auto=create-drop fuera de testing eliminará datos");
        }
        
        // Recomendaciones
        logger.info("📋 RECOMENDACIONES:");
        logger.info("   - Producción: ddl-auto=validate, generate-ddl=false");
        logger.info("   - Desarrollo: ddl-auto=update, generate-ddl=true (con precaución)");
        logger.info("   - Testing: ddl-auto=create-drop, generate-ddl=true");
        logger.info("   - Usar migraciones explícitas (Flyway/Liquibase) en producción");
    }
    
    /**
     * Verifica si estamos en entorno de testing
     */
    private boolean isTestingEnvironment() {
        String[] activeProfiles = environment.getActiveProfiles();
        return Arrays.asList(activeProfiles).contains("test");
    }
    
    /**
     * Genera un reporte de configuración de base de datos
     */
    public String generateDatabaseConfigurationReport() {
        StringBuilder report = new StringBuilder();
        report.append("=== REPORTE DE CONFIGURACIÓN DE BASE DE DATOS ===\n");
        report.append("Fecha: ").append(java.time.LocalDateTime.now()).append("\n\n");
        
        String[] activeProfiles = environment.getActiveProfiles();
        report.append("ENTORNO:\n");
        report.append("- Perfiles activos: ").append(Arrays.toString(activeProfiles)).append("\n\n");
        
        report.append("CONFIGURACIÓN ACTUAL:\n");
        report.append("- DDL Auto: ").append(ddlAuto).append("\n");
        report.append("- Generate DDL: ").append(generateDdl).append("\n\n");
        
        report.append("EVALUACIÓN DE SEGURIDAD:\n");
        if (Arrays.asList(activeProfiles).contains("prod")) {
            if ("validate".equals(ddlAuto) && !generateDdl) {
                report.append("- Estado: SEGURO ✅\n");
                report.append("- Configuración apropiada para producción\n");
            } else {
                report.append("- Estado: PELIGROSO ❌\n");
                report.append("- Configuración inapropiada para producción\n");
            }
        } else {
            report.append("- Estado: ACEPTABLE ⚠️\n");
            report.append("- Configuración apropiada para desarrollo/testing\n");
        }
        
        report.append("\nRECOMENDACIONES:\n");
        report.append("- Usar migraciones explícitas en producción\n");
        report.append("- Validar esquema antes de despliegues\n");
        report.append("- Hacer backups antes de cambios de esquema\n");
        
        report.append("=== FIN REPORTE ===");
        
        return report.toString();
    }
}
