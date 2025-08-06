# DOCUMENTACIÓN DE SCRIPTS DE RECUPERACIÓN

## 📋 Índice de Scripts

### Scripts Principales (Orden de Ejecución)
1. **[00_verify_system_state.sh](#script-0-verificación)** - Verificación del sistema
2. **[01_backup_current_state.sh](#script-1-backup)** - Backup del estado actual
3. **[02_extract_from_backup_enhanced.sh](#script-2-extracción)** - Extracción por fecha
4. **[03_consolidate_external_enhanced.sh](#script-3-consolidación)** - Consolidación externa
5. **[04_final_integration_enhanced.sh](#script-4-integración)** - Integración final

---

## Script 0: Verificación {#script-0-verificación}

### Archivo: `00_verify_system_state.sh`

#### Propósito
Verificar que el sistema esté en condiciones óptimas antes de iniciar la recuperación.

#### Verificaciones Realizadas
- ✅ Estado de contenedores Docker
- ✅ Conteo de documentos actuales
- ✅ Estado de la base de datos
- ✅ Espacio en disco disponible
- ✅ Conectividad del backend
- ✅ Estado del repositorio Git
- ✅ Disponibilidad de scripts
- ✅ Conectividad externa

#### Uso
```bash
./recovery_scripts_external/00_verify_system_state.sh
```

#### Salida Esperada
```
✅ SISTEMA LISTO PARA RECUPERACIÓN HÍBRIDA

🚀 PRÓXIMO PASO:
   ./recovery_scripts_external/01_backup_current_state.sh
```

#### Criterios de Éxito
- Contenedores funcionando: 3/3
- Backend respondiendo: UP
- Código fuente respaldado: commit fa63bd9a
- Documentos actuales: >300 archivos

---

## Script 1: Backup {#script-1-backup}

### Archivo: `01_backup_current_state.sh`

#### Propósito
Crear un backup completo del estado actual del sistema antes de iniciar la recuperación.

#### Operaciones Realizadas
1. **Backup de volúmenes Docker** → `current_storage_TIMESTAMP.tar.gz`
2. **Backup de base de datos** → `current_db_TIMESTAMP.sql`
3. **Inventario de archivos** → `current_inventory_TIMESTAMP.txt`
4. **Metadatos del sistema** → `metadata_TIMESTAMP.txt`
5. **Preparación de estructura** para extracciones

#### Uso
```bash
./recovery_scripts_external/01_backup_current_state.sh
```

#### Archivos Generados
```
/root/external_recovery/
├── current_storage_TIMESTAMP.tar.gz    # Backup completo del storage
├── current_db_TIMESTAMP.sql            # Backup de la base de datos
├── current_inventory_TIMESTAMP.txt     # Inventario de archivos
├── metadata_TIMESTAMP.txt              # Metadatos del sistema
└── extractions/                        # Directorios preparados
    ├── 03_agosto/
    ├── 04_agosto/
    └── 05_agosto/
```

#### Siguiente Paso
Descargar backup a máquina externa y proceder con primera extracción.

---

## Script 2: Extracción {#script-2-extracción}

### Archivo: `02_extract_from_backup_enhanced.sh`

#### Propósito
Extraer documentos de un respaldo específico del proveedor.

#### Parámetros
- `FECHA_RESPALDO`: `03_agosto`, `04_agosto`, o `05_agosto`

#### Operaciones Realizadas
1. **Inventario completo** de archivos en el respaldo
2. **Extracción de documentos** por categoría:
   - Documentos de inscripción (`/app/storage/documents`)
   - Documentos CV (`/app/storage/cv-documents`)
   - Fotos de perfil (`/app/storage/profile-images`)
3. **Backup de base de datos** del respaldo
4. **Generación de metadatos** y checksums
5. **Reporte de usuarios** con documentos

#### Uso
```bash
# Después de restaurar al respaldo del 3 de agosto
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 03_agosto

# Después de restaurar al respaldo del 4 de agosto
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 04_agosto

# Después de restaurar al respaldo del 5 de agosto
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 05_agosto
```

#### Estructura de Salida
```
/root/external_recovery/extractions/FECHA/
├── documents/                          # PDFs de inscripción extraídos
├── cv-documents/                       # PDFs de CV extraídos
├── profile-images/                     # Fotos extraídas
└── metadata/                           # Metadatos y logs
    ├── documents_inventory_TIMESTAMP.txt
    ├── cv_inventory_TIMESTAMP.txt
    ├── images_inventory_TIMESTAMP.txt
    ├── database_FECHA_TIMESTAMP.sql
    ├── usuarios_con_documentos_FECHA_TIMESTAMP.csv
    ├── extraction_metadata_TIMESTAMP.txt
    └── checksums_TIMESTAMP.md5
```

#### Validaciones
- Conteo de archivos extraídos vs inventario
- Verificación de integridad con checksums
- Comparación de archivos físicos vs registros BD

---

## Script 3: Consolidación {#script-3-consolidación}

### Archivo: `03_consolidate_external_enhanced.sh`

#### Propósito
Consolidar inteligentemente los archivos extraídos de las 3 fechas, eliminando duplicados y preservando diferencias.

#### Ubicación de Ejecución
**Máquina externa** (no en el servidor)

#### Algoritmo de Consolidación
1. **Detección de extracciones** disponibles
2. **Procesamiento por tipo** de archivo (documents, cv-documents, profile-images)
3. **Manejo inteligente de duplicados**:
   - Archivos idénticos → Omitir
   - Archivos diferentes con mismo nombre → Renombrar con sufijo de fecha
   - Archivos únicos → Copiar directamente
4. **Generación de logs** detallados de consolidación
5. **Creación de checksums** finales
6. **Empaquetado** para transferencia

#### Uso
```bash
# En la máquina externa
cd ~/mpd_recovery_backup
./03_consolidate_external_enhanced.sh
```

#### Archivos Generados
```
~/mpd_recovery_backup/
├── consolidated/                       # Archivos consolidados
│   ├── documents/                      # Todos los PDFs de inscripción
│   ├── cv-documents/                   # Todos los PDFs de CV
│   ├── profile-images/                 # Todas las fotos
│   └── metadata/                       # Logs de consolidación
│       ├── consolidation_summary_TIMESTAMP.txt
│       ├── duplicates_documents_TIMESTAMP.log
│       ├── duplicates_cv-documents_TIMESTAMP.log
│       ├── duplicates_profile-images_TIMESTAMP.log
│       ├── final_documents_inventory_TIMESTAMP.txt
│       ├── final_cv_inventory_TIMESTAMP.txt
│       ├── final_images_inventory_TIMESTAMP.txt
│       └── final_checksums_TIMESTAMP.md5
└── consolidated_recovery_TIMESTAMP.tar.gz  # Paquete final
```

#### Métricas de Consolidación
- Total archivos procesados por tipo
- Archivos consolidados (únicos)
- Duplicados idénticos omitidos
- Duplicados diferentes renombrados

---

## Script 4: Integración {#script-4-integración}

### Archivo: `04_final_integration_enhanced.sh`

#### Propósito
Integrar los archivos consolidados al sistema actual, restaurando el código fuente y asegurando la consistencia.

#### Parámetros
- `CONSOLIDATED_PACKAGE`: Ruta al archivo `consolidated_recovery_TIMESTAMP.tar.gz`

#### Operaciones Realizadas
1. **Backup de seguridad** pre-integración
2. **Restauración del código fuente** desde Git
3. **Extracción del paquete** consolidado
4. **Integración inteligente** de archivos:
   - Verificación de duplicados
   - Renombrado de conflictos
   - Preservación de archivos existentes
5. **Reinicio de servicios** para consistencia
6. **Verificación final** del sistema
7. **Generación de reporte** final

#### Uso
```bash
./recovery_scripts_external/04_final_integration_enhanced.sh /root/external_recovery/consolidated_recovery_TIMESTAMP.tar.gz
```

#### Medidas de Seguridad
- Backup automático antes de integrar
- Restauración de código fuente desde Git
- Manejo de stash para cambios locales
- Verificación de integridad post-integración

#### Reporte Final
```
INTEGRACIÓN FINAL COMPLETADA
============================

ARCHIVOS INTEGRADOS:
- Documentos disponibles para integrar: XXX
- CV disponibles para integrar: XXX
- Fotos disponibles para integrar: XXX

ESTADO FINAL DEL SISTEMA:
- Documentos totales: XXX
- CV totales: XXX
- Fotos totales: XXX
- Total archivos: XXX

BACKUPS DE SEGURIDAD:
- Storage pre-integración: /path/to/backup
- BD pre-integración: /path/to/backup

CÓDIGO FUENTE:
- Restaurado desde repositorio Git (commit fa63bd9a)
```

---

## 🔧 Configuración y Variables

### Variables de Entorno Utilizadas
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)        # Timestamp único para archivos
BACKUP_DIR="/root/external_recovery"    # Directorio base de recuperación
EXTRACTION_DIR="$BACKUP_DIR/extractions" # Directorio de extracciones
```

### Rutas Importantes
```bash
# Storage Docker
/app/storage/documents/                  # Documentos de inscripción
/app/storage/cv-documents/              # Documentos CV
/app/storage/profile-images/            # Fotos de perfil

# Volúmenes Docker
mpd_concursos_storage_data_prod         # Volumen principal de storage
mpd_concursos_mysql_data_prod           # Volumen de base de datos

# Contenedores
mpd-concursos-backend-prod              # Backend de la aplicación
mpd-concursos-mysql-prod                # Base de datos MySQL
```

### Comandos Docker Utilizados
```bash
# Backup de volúmenes
docker run --rm -v VOLUME:/data -v HOST_DIR:/backup alpine tar czf /backup/file.tar.gz -C /data .

# Copia de archivos desde contenedor
docker cp CONTAINER:/source/path /host/destination/

# Ejecución de comandos en contenedor
docker exec CONTAINER command

# Reinicio de servicios
docker compose -f docker-compose.prod.yml restart SERVICE
```

---

## 🚨 Manejo de Errores

### Errores Comunes y Soluciones

#### Error: Contenedores no funcionando
```bash
# Verificar estado
docker ps | grep mpd-concursos

# Reiniciar si es necesario
docker compose -f docker-compose.prod.yml up -d
```

#### Error: Espacio insuficiente
```bash
# Verificar espacio
df -h

# Limpiar archivos temporales si es necesario
docker system prune -f
```

#### Error: Archivos no encontrados
```bash
# Verificar estructura de storage
docker exec mpd-concursos-backend-prod ls -la /app/storage/

# Verificar volúmenes
docker volume ls | grep mpd_concursos
```

#### Error: Base de datos no responde
```bash
# Verificar conexión
docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 -e "SELECT 1;"

# Reiniciar MySQL si es necesario
docker compose -f docker-compose.prod.yml restart mysql
```

### Logs de Depuración
Todos los scripts generan logs detallados que incluyen:
- Timestamp de cada operación
- Conteo de archivos procesados
- Errores y advertencias
- Checksums para verificación
- Metadatos de cada paso

---

## 📊 Métricas y Monitoreo

### Métricas Recolectadas
- **Tiempo de ejecución** de cada script
- **Cantidad de archivos** procesados por tipo
- **Espacio utilizado** en cada paso
- **Tasa de éxito** de cada operación
- **Integridad de datos** mediante checksums

### Archivos de Log
Cada script genera logs específicos para facilitar el monitoreo y depuración:
- `extraction_metadata_TIMESTAMP.txt`
- `consolidation_summary_TIMESTAMP.txt`
- `final_integration_report_TIMESTAMP.txt`

---

**🎯 Estos scripts están diseñados para ser robustos, seguros y proporcionar máxima visibilidad del proceso de recuperación.**