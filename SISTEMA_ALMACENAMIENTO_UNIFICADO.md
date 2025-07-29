# Sistema de Almacenamiento Unificado - MPD Concursos

## 📋 Resumen de Implementación

Se ha implementado exitosamente un sistema de almacenamiento unificado que centraliza todas las operaciones de archivos del sistema MPD Concursos, junto con un sistema completo de backups automáticos.

## 🏗️ Arquitectura del Sistema

### Estructura de Carpetas Unificada

```
./storage/                    # Desarrollo
├── documents/               # Documentos MPD (DNI, CUIL, certificados)
├── contest-bases/          # Bases de concursos (PDFs generados automáticamente)
├── cv-documents/           # Documentos de experiencia laboral y educación
├── profile-images/         # Imágenes de perfil de usuarios
└── temp/                   # Archivos temporales

/app/storage/               # Producción
├── documents/
├── contest-bases/
├── cv-documents/
├── profile-images/
└── temp/
```

### Configuración Centralizada

#### StorageConfig.java
```java
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageConfig {
    private String baseDir = "./storage";
    private String documentsDir = "documents";
    private String contestBasesDir = "contest-bases";
    private String cvDocumentsDir = "cv-documents";
    private String profileImagesDir = "profile-images";
    private String tempDir = "temp";
    
    // Métodos helper para obtener rutas completas
    public Path getDocumentsPath() { ... }
    public Path getContestBasesPath() { ... }
    // ... otros métodos
}
```

#### application.properties
```properties
# Configuración unificada de almacenamiento
app.storage.base-dir=./storage
app.storage.documents-dir=documents
app.storage.contest-bases-dir=contest-bases
app.storage.cv-documents-dir=cv-documents
app.storage.profile-images-dir=profile-images
app.storage.temp-dir=temp

# Configuración legacy (mantenida para compatibilidad)
app.document.storage.location=${app.storage.base-dir}/${app.storage.documents-dir}
app.file.upload-dir=${app.storage.base-dir}
app.file.contest-bases-dir=${app.storage.contest-bases-dir}
app.cv.document.storage.location=${app.storage.base-dir}/${app.storage.cv-documents-dir}
```

## 🔧 Servicios Actualizados

### 1. FileStorageService
- **Antes**: Usaba `@Value` con rutas hardcodeadas
- **Después**: Inyecta `StorageConfig` y usa métodos centralizados
- **Beneficios**: Configuración unificada, fácil mantenimiento

### 2. CvDocumentService
- **Antes**: Múltiples `@Value` para diferentes rutas
- **Después**: Una sola dependencia `StorageConfig`
- **Beneficios**: Consistencia en rutas, mejor organización

### 3. FileSystemDocumentStorageService
- **Antes**: Configuración dispersa con `storageLocation`
- **Después**: Uso de `StorageConfig.getDocumentsPath()`
- **Beneficios**: Integración completa con sistema unificado

### 4. ProfileImageService
- **Antes**: Construcción manual de rutas
- **Después**: Uso de métodos helper de `StorageConfig`
- **Beneficios**: Eliminación de duplicación de código

## 🗄️ Sistema de Backups Completo

### Scripts Implementados

#### 1. backup-system.sh
**Funcionalidades:**
- Backup automático de base de datos MySQL
- Backup de todos los archivos en `/app/storage/`
- Compresión opcional con gzip
- Rotación automática de backups (30 días por defecto)
- Generación de reportes detallados
- Sistema de notificaciones
- Validación de dependencias

**Uso:**
```bash
# Ejecutar backup manual
./scripts/backup-system.sh

# Con variables de entorno personalizadas
BACKUP_RETENTION_DAYS=60 ./scripts/backup-system.sh
```

#### 2. restore-system.sh
**Funcionalidades:**
- Restauración de base de datos desde backup
- Restauración de archivos desde backup
- Validaciones de seguridad
- Backup de seguridad antes de restaurar
- Modo interactivo con confirmaciones
- Soporte para archivos comprimidos y sin comprimir

**Uso:**
```bash
# Listar backups disponibles
./scripts/restore-system.sh -l

# Restaurar todo desde backup específico
./scripts/restore-system.sh 20250729_020000

# Restaurar solo base de datos
./scripts/restore-system.sh -d 20250729_020000

# Restaurar solo archivos
./scripts/restore-system.sh -f 20250729_020000

# Modo no interactivo
./scripts/restore-system.sh -y 20250729_020000
```

#### 3. setup-backup-cron.sh
**Funcionalidades:**
- Configuración automática de cron jobs
- Soporte para backups diarios, semanales y mensuales
- Configuración flexible de horarios
- Gestión de logs de cron
- Visualización del estado actual

**Uso:**
```bash
# Backup diario a las 02:00 (por defecto)
./scripts/setup-backup-cron.sh

# Backup semanal los domingos a las 03:30
./scripts/setup-backup-cron.sh -f weekly -t 03:30 -d 0

# Backup mensual el día 15 a las 01:00
./scripts/setup-backup-cron.sh -f monthly -t 01:00 -d 15

# Ver estado actual
./scripts/setup-backup-cron.sh -s

# Remover configuración
./scripts/setup-backup-cron.sh -r
```

## 🐳 Configuración Docker

### docker-compose.yml (Desarrollo)
```yaml
services:
  backend:
    volumes:
      - storage_data:/app/storage

volumes:
  storage_data:
```

### docker-compose.prod.yml (Producción)
```yaml
services:
  backend:
    volumes:
      - storage_data_prod:/app/storage
      - backup_data_prod:/app/backups
      - ./logs:/app/logs
      - ./scripts:/app/scripts:ro

volumes:
  storage_data_prod:
    driver: local
  backup_data_prod:
    driver: local
```

### .env.production
```bash
# Configuración de almacenamiento unificado
STORAGE_BASE_DIR=/app/storage
DOCUMENT_STORAGE_PATH=/app/storage/documents
CONTEST_BASES_PATH=/app/storage/contest-bases
CV_DOCUMENTS_PATH=/app/storage/cv-documents
PROFILE_IMAGES_PATH=/app/storage/profile-images
TEMP_STORAGE_PATH=/app/storage/temp

# Configuración de backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_NOTIFICATION=true
BACKUP_NOTIFICATION_EMAIL=sistemas@defensamendoza.gob.ar
```

## 📁 Gestión de Archivos Legacy

### .gitignore Actualizado
```gitignore
# =============================================================================
# SISTEMA DE ALMACENAMIENTO UNIFICADO
# =============================================================================
# Nueva estructura unificada
storage/
!storage/.gitkeep

# Carpetas legacy (mantener hasta migración completa)
document-storage/
document-storage-dev/
concurso-backend/uploads/
concurso-backend/document-storage/
```

## 🚀 Despliegue en Producción

### 1. Configuración Inicial
```bash
# 1. Configurar variables de entorno
cp .env.production.example .env.production
# Editar .env.production con valores específicos

# 2. Configurar backups automáticos
./scripts/setup-backup-cron.sh -f daily -t 02:00

# 3. Verificar configuración
./scripts/setup-backup-cron.sh -s
```

### 2. Despliegue con Docker
```bash
# Desplegar con nueva configuración
docker-compose -f docker-compose.prod.yml up -d

# Verificar volúmenes
docker volume ls | grep storage
docker volume ls | grep backup
```

### 3. Verificación Post-Despliegue
```bash
# Verificar estructura de carpetas
docker exec mpd-concursos-backend-prod ls -la /app/storage/

# Probar backup manual
docker exec mpd-concursos-backend-prod /app/scripts/backup-system.sh

# Verificar logs
docker exec mpd-concursos-backend-prod tail -f /app/logs/backup.log
```

## 🔍 Monitoreo y Mantenimiento

### Logs Importantes
- `/app/logs/backup.log` - Log principal de backups
- `/app/logs/backup-error.log` - Errores de backup
- `/app/logs/restore.log` - Log de restauraciones
- `/app/logs/cron-backup.log` - Log de ejecuciones de cron

### Comandos de Monitoreo
```bash
# Ver estado de backups
./scripts/setup-backup-cron.sh -s

# Ver últimos backups
ls -la /app/backups/ | head -10

# Ver espacio en disco
df -h /app/storage/
df -h /app/backups/

# Ver logs en tiempo real
tail -f /app/logs/backup.log
```

## ✅ Beneficios Obtenidos

### 1. **Organización Mejorada**
- Estructura clara y consistente
- Separación lógica por tipo de contenido
- Fácil navegación y mantenimiento

### 2. **Configuración Centralizada**
- Una sola fuente de verdad para rutas
- Fácil modificación de configuraciones
- Reducción de duplicación de código

### 3. **Escalabilidad**
- Estructura preparada para crecimiento
- Fácil adición de nuevos tipos de almacenamiento
- Configuración flexible por ambiente

### 4. **Seguridad de Datos**
- Backups automáticos programados
- Restauración confiable y validada
- Retención configurable de backups
- Notificaciones de estado

### 5. **Mantenimiento Simplificado**
- Scripts automatizados para operaciones comunes
- Logs detallados para troubleshooting
- Configuración declarativa con Docker

## 🎯 Próximos Pasos Recomendados

1. **Monitoreo**: Implementar alertas para fallos de backup
2. **Cifrado**: Agregar cifrado opcional para backups sensibles
3. **Almacenamiento remoto**: Configurar backups en cloud storage
4. **Métricas**: Implementar métricas de uso de almacenamiento
5. **Automatización**: Crear scripts de migración para actualizaciones futuras

---

**Implementación completada exitosamente el 29 de julio de 2025**  
**Estado**: ✅ Producción Ready  
**Compilación**: ✅ Exitosa  
**Testing**: ✅ Requerido antes de despliegue
