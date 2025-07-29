# Auditoría del Sistema de Almacenamiento de Archivos y Backups

## 🔍 Problemas Identificados

### 1. Duplicación y Inconsistencia de Carpetas

**Ubicaciones actuales encontradas:**
- `./document-storage-dev/` (raíz del proyecto) - Contiene documentos de usuario 87654321
- `./concurso-backend/document-storage/` (dentro del backend) - Vacía
- `./concurso-backend/uploads/` (dentro del backend)
  - `contest-bases/` - 1 archivo PDF de bases de concurso
  - `cv-documents/` - Vacía
  - `profile-images/` - Vacía

**Configuraciones inconsistentes:**
```properties
# En application.properties
app.document.storage.location=./document-storage
app.file.upload-dir=uploads
app.file.contest-bases-dir=contest-bases
app.cv.document.storage.location=uploads/cv-documents
```

### 2. Servicios con Rutas Diferentes

- **FileStorageService**: `uploads/contest-bases`
- **CvDocumentService**: `uploads/cv-documents`
- **FileSystemDocumentStorageService**: `./document-storage`
- **ProfileImageService**: `uploads/profile-images`

## 📋 Estructura Unificada Propuesta

### Producción
```
/app/storage/
├── documents/          # Documentos MPD (DNI, CUIL, certificados)
├── contest-bases/      # Bases de concursos (generadas automáticamente)
├── cv-documents/       # Documentos de experiencia laboral y educación
├── profile-images/     # Imágenes de perfil de usuarios
└── temp/              # Archivos temporales
```

### Desarrollo
```
./storage/
├── documents/
├── contest-bases/
├── cv-documents/
├── profile-images/
└── temp/
```

## 🔧 Plan de Implementación

### Fase 1: Actualización de Configuraciones

#### 1.1 Modificar application.properties
```properties
# Configuración unificada de almacenamiento
app.storage.base-dir=./storage
app.storage.documents-dir=documents
app.storage.contest-bases-dir=contest-bases
app.storage.cv-documents-dir=cv-documents
app.storage.profile-images-dir=profile-images
app.storage.temp-dir=temp

# Configuración específica por ambiente
app.document.storage.location=${app.storage.base-dir}/${app.storage.documents-dir}
app.file.upload-dir=${app.storage.base-dir}
app.file.contest-bases-dir=${app.storage.contest-bases-dir}
app.cv.document.storage.location=${app.storage.base-dir}/${app.storage.cv-documents-dir}
```

#### 1.2 Configuración para Producción (.env.production)
```bash
# Almacenamiento unificado
STORAGE_BASE_DIR=/app/storage
DOCUMENT_STORAGE_PATH=/app/storage/documents
CONTEST_BASES_PATH=/app/storage/contest-bases
CV_DOCUMENTS_PATH=/app/storage/cv-documents
PROFILE_IMAGES_PATH=/app/storage/profile-images
TEMP_STORAGE_PATH=/app/storage/temp
```

### Fase 2: Actualización de Servicios

#### 2.1 Crear Servicio de Configuración de Storage
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
    
    // getters y setters
    
    public Path getDocumentsPath() {
        return Paths.get(baseDir, documentsDir);
    }
    
    public Path getContestBasesPath() {
        return Paths.get(baseDir, contestBasesDir);
    }
    
    // ... otros métodos helper
}
```

#### 2.2 Modificar Servicios Existentes
- **FileStorageService**: Usar StorageConfig
- **CvDocumentService**: Usar StorageConfig
- **FileSystemDocumentStorageService**: Usar StorageConfig
- **ProfileImageService**: Usar StorageConfig

### Fase 3: Migración de Archivos

#### 3.1 Script de Migración
```bash
#!/bin/bash
# migrate-storage.sh

echo "🔄 Iniciando migración de archivos..."

# Crear nueva estructura
mkdir -p ./storage/{documents,contest-bases,cv-documents,profile-images,temp}

# Migrar archivos existentes
if [ -d "./document-storage-dev" ]; then
    echo "📁 Migrando documentos de document-storage-dev..."
    cp -r ./document-storage-dev/* ./storage/documents/
fi

if [ -d "./concurso-backend/uploads/contest-bases" ]; then
    echo "📁 Migrando bases de concursos..."
    cp -r ./concurso-backend/uploads/contest-bases/* ./storage/contest-bases/
fi

if [ -d "./concurso-backend/uploads/cv-documents" ]; then
    echo "📁 Migrando documentos CV..."
    cp -r ./concurso-backend/uploads/cv-documents/* ./storage/cv-documents/
fi

if [ -d "./concurso-backend/uploads/profile-images" ]; then
    echo "📁 Migrando imágenes de perfil..."
    cp -r ./concurso-backend/uploads/profile-images/* ./storage/profile-images/
fi

echo "✅ Migración completada"
```

### Fase 4: Actualización de Docker

#### 4.1 Modificar docker-compose.yml
```yaml
services:
  backend:
    volumes:
      - storage_data:/app/storage  # Volumen unificado
      - ./logs:/app/logs

volumes:
  storage_data:
    driver: local
```

### Fase 5: Actualización de .gitignore

```gitignore
# Almacenamiento unificado
storage/
!storage/.gitkeep

# Carpetas legacy (mantener hasta migración completa)
document-storage/
document-storage-dev/
concurso-backend/uploads/
concurso-backend/document-storage/
```

## 🗄️ Sistema de Backups

### Estado Actual

**Configuración existente:**
- Script manual en `deploy-production.sh`
- Configuración en `.env.production`
- Interfaz de administración en frontend

**Funcionalidades faltantes:**
- Backup automático programado
- Rotación de backups
- Backup de archivos (solo DB actualmente)
- Notificaciones de estado
- Scripts de restauración

### Implementación Completa de Backups

#### 1. Script de Backup Completo
```bash
#!/bin/bash
# backup-system.sh

BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
FILES_BACKUP_FILE="$BACKUP_DIR/files_backup_$DATE.tar.gz"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Backup de base de datos
echo "🗄️ Creando backup de base de datos..."
mysqldump -h mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$DB_BACKUP_FILE"

# Backup de archivos
echo "📁 Creando backup de archivos..."
tar -czf "$FILES_BACKUP_FILE" -C /app storage/

# Comprimir backup de DB
gzip "$DB_BACKUP_FILE"

# Limpiar backups antiguos (mantener últimos 30 días)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completado: $DATE"
```

#### 2. Configuración de Cron para Backups Automáticos
```bash
# Crontab para backups diarios a las 2:00 AM
0 2 * * * /app/scripts/backup-system.sh >> /app/logs/backup.log 2>&1
```

#### 3. Script de Restauración
```bash
#!/bin/bash
# restore-system.sh

BACKUP_DATE=$1
BACKUP_DIR="/app/backups"

if [ -z "$BACKUP_DATE" ]; then
    echo "❌ Uso: $0 <YYYYMMDD_HHMMSS>"
    exit 1
fi

DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$BACKUP_DATE.sql.gz"
FILES_BACKUP_FILE="$BACKUP_DIR/files_backup_$BACKUP_DATE.tar.gz"

# Restaurar base de datos
if [ -f "$DB_BACKUP_FILE" ]; then
    echo "🗄️ Restaurando base de datos..."
    gunzip -c "$DB_BACKUP_FILE" | mysql -h mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"
fi

# Restaurar archivos
if [ -f "$FILES_BACKUP_FILE" ]; then
    echo "📁 Restaurando archivos..."
    tar -xzf "$FILES_BACKUP_FILE" -C /app
fi

echo "✅ Restauración completada"
```

## 📝 Archivos a Modificar

### Backend
1. `concurso-backend/src/main/resources/application.properties`
2. `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/shared/config/StorageConfig.java` (nuevo)
3. `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/file/application/service/FileStorageService.java`
4. `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/shared/infrastructure/service/CvDocumentService.java`
5. `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/document/infrastructure/storage/FileSystemDocumentStorageService.java`
6. `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/auth/application/service/ProfileImageService.java`

### Configuración
1. `.env.production`
2. `docker-compose.yml`
3. `docker-compose.prod.yml`
4. `.gitignore`

### Scripts
1. `scripts/migrate-storage.sh` (nuevo)
2. `scripts/backup-system.sh` (nuevo)
3. `scripts/restore-system.sh` (nuevo)

## ⚠️ Consideraciones Importantes

1. **Migración gradual**: Implementar en fases para evitar interrupciones
2. **Backup antes de migración**: Respaldar archivos existentes antes de mover
3. **Testing**: Probar en ambiente de desarrollo antes de producción
4. **Monitoreo**: Implementar logs para seguimiento de la migración
5. **Rollback**: Mantener archivos originales hasta confirmar éxito de migración

## 🎯 Beneficios Esperados

1. **Estructura unificada**: Una sola ubicación para todos los archivos
2. **Configuración centralizada**: Fácil mantenimiento y modificación
3. **Backups completos**: Respaldo tanto de DB como archivos
4. **Mejor organización**: Separación clara por tipo de contenido
5. **Escalabilidad**: Estructura preparada para crecimiento futuro
