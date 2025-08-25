# PLAN DE CORRECCIÓN: MAPEO DE VOLÚMENES Y RECONEXIÓN

## 🎯 PROBLEMA IDENTIFICADO

### Configuración Actual
- **Docker-compose:** `storage_data_prod:/app/storage` 
- **Aplicación busca:** `./storage/` (relativo = `/app/storage/`)
- **Contenedor real:** NO tiene volumen montado
- **Resultado:** Aplicación no encuentra archivos históricos

### Causa Raíz
El contenedor se creó **SIN** el mapeo de volumen activo, por lo que aunque el docker-compose.yml lo especifica, el contenedor en ejecución no lo tiene.

## 🛠️ SOLUCIÓN COMPLETA

### PASO 1: BACKUP DE SEGURIDAD PREVIO
```bash
# Crear backup del estado actual
docker exec mpd-concursos-backend tar -czf /tmp/current_app_backup.tar.gz /app/ 2>/dev/null || true
docker cp mpd-concursos-backend:/tmp/current_app_backup.tar.gz ./backup_pre_fix_$(date +%Y%m%d_%H%M%S).tar.gz

# Backup del volumen Docker (ya existe pero por seguridad)
tar -czf "./backup_storage_volume_$(date +%Y%m%d_%H%M%S).tar.gz" /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/
```

### PASO 2: DETENER SERVICIOS
```bash
# Detener contenedores manteniendo los datos
docker compose down
```

### PASO 3: VERIFICAR/CREAR ESTRUCTURA EN VOLUMEN
```bash
# Verificar que el volumen tiene la estructura correcta
ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/

# Si falta algún directorio base, crearlos:
mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents
mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/cv-documents  
mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/profile-images
mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/contest-bases
mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/temp
```

### PASO 4: RECREAR CONTENEDORES CON VOLUMEN CORRECTO
```bash
# Recrear todo desde cero para que tome la configuración actual
docker compose up -d --force-recreate
```

### PASO 5: VERIFICAR MAPEO ACTIVO
```bash
# Verificar que el volumen está montado
docker inspect mpd-concursos-backend | grep -A 5 "Mounts"

# Verificar dentro del contenedor
docker exec -it mpd-concursos-backend ls -la /app/storage/
```

### PASO 6: VERIFICAR RECONEXIÓN CON ARCHIVOS
```bash
# La aplicación debería encontrar los archivos
docker exec -it mpd-concursos-backend find /app/storage -name "*.pdf" | wc -l
# Debería mostrar ~2240 archivos

# Verificar estructura completa
docker exec -it mpd-concursos-backend ls -la /app/storage/documents/ | wc -l
# Debería mostrar ~266 directorios de usuarios
```

## ✅ VERIFICACIÓN FINAL

### Checks de Funcionamiento
1. **Volumen montado:** `docker inspect mpd-concursos-backend | grep Mounts`
2. **Archivos visibles:** `docker exec mpd-concursos-backend ls /app/storage/documents | wc -l`
3. **Aplicación funcional:** `docker logs mpd-concursos-backend | tail -20`
4. **Healthcheck:** `docker ps` (debería mostrar "healthy")

### Estructura Esperada Dentro del Contenedor
```
/app/storage/
├── documents/          <- 266 directorios de usuarios con ~2240 PDFs
├── cv-documents/       <- CVs de usuarios (~282 archivos)  
├── profile-images/     <- Fotos de perfil (~85 imágenes)
├── contest-bases/      <- Bases de concursos
└── temp/               <- Directorio temporal
```

## 🚨 CONSIDERACIONES CRÍTICAS

### Antes de Ejecutar
- ✅ El volumen `storage_data_prod` contiene todos los archivos históricos
- ✅ El docker-compose.yml tiene la configuración correcta
- ⚠️  La aplicación debe poder conectarse a MySQL para arrancar completamente

### Durante la Ejecución
- ⏱️  El proceso puede tomar 2-5 minutos (recreación de contenedores)
- 📊 Monitorear logs: `docker compose logs -f backend`
- 🔍 No debería perderse ningún dato (volúmenes persisten)

### Después de la Corrección
- ✅ Los usuarios podrán ver sus documentos históricos
- ✅ Los usuarios podrán subir nuevos documentos
- ✅ Todo se guardará correctamente en el volumen persistente
- ✅ Los backups futuros incluirán los nuevos archivos

## 📋 TIEMPO ESTIMADO
- **Backup:** 2-3 minutos
- **Detener servicios:** 30 segundos
- **Recrear contenedores:** 2-3 minutos  
- **Verificación:** 1-2 minutos
- **TOTAL:** 5-10 minutos

## 🎯 RESULTADO ESPERADO
Aplicación completamente funcional con acceso a los 2,240 archivos históricos y capacidad de recibir nuevos uploads.

