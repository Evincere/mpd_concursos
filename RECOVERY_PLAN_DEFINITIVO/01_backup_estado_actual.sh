#!/bin/bash
# SCRIPT 1: BACKUP COMPLETO DEL ESTADO ACTUAL
# ============================================

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE="/root/BACKUP_ESTADO_ACTUAL"
BACKUP_DIR="$BACKUP_BASE/backup_$TIMESTAMP"

echo "🔄 [$(date)] INICIANDO BACKUP COMPLETO DEL ESTADO ACTUAL"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio: $BACKUP_DIR"
echo "=================================================="

# Crear directorios
mkdir -p "$BACKUP_DIR"/{volumes,database,config,logs,docker_info}

echo "🐳 1. Información del estado de Docker..."
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" > "$BACKUP_DIR/docker_info/containers_status.txt"
docker volume ls > "$BACKUP_DIR/docker_info/volumes_list.txt"
docker network ls > "$BACKUP_DIR/docker_info/networks_list.txt"
docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}" > "$BACKUP_DIR/docker_info/images_list.txt"

echo "💾 2. Backup de TODOS los volúmenes Docker..."
for vol in $(docker volume ls --format "{{.Name}}" | grep -E "(mpd|storage|mysql|backup)"); do
    echo "  📦 Respaldando volumen: $vol"
    docker run --rm \
        -v "$vol":/data \
        -v "$BACKUP_DIR/volumes":/backup \
        alpine tar czf "/backup/vol_${vol}_${TIMESTAMP}.tar.gz" -C /data . 2>/dev/null || echo "    ⚠️ Error en volumen $vol"
done

echo "🗄️ 3. Backup de base de datos..."
if docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$BACKUP_DIR/database/db_complete_$TIMESTAMP.sql" 2>/dev/null; then
    echo "  ✅ Base de datos respaldada"
else
    echo "  ⚠️ Error en backup de BD - intentando con diferentes credenciales"
    docker exec mpd-concursos-mysql-prod mysqldump -u concursos -pconcursos123 mpd_concursos > "$BACKUP_DIR/database/db_complete_$TIMESTAMP.sql" 2>/dev/null || echo "  ❌ No se pudo respaldar la BD"
fi

echo "⚙️ 4. Backup de configuraciones..."
cp docker-compose*.yml "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ Algunos docker-compose no encontrados"
cp .env* "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ Algunos .env no encontrados"
cp -r recovery_scripts_external "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ recovery_scripts_external no encontrado"
cp -r docs "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ docs no encontrado"

# Copiar este directorio completo
cp -r /root/RECOVERY_PLAN_DEFINITIVO "$BACKUP_DIR/config/" 2>/dev/null

echo "📊 5. Creando inventarios detallados..."

# Inventario de archivos actuales por ubicación
echo "  📄 Inventario en contenedor backend..."
docker exec mpd-concursos-backend-prod find /app/storage -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$BACKUP_DIR/logs/inventory_container_storage_$TIMESTAMP.txt" 2>/dev/null || echo "    ⚠️ Contenedor no accesible"

echo "  🗂️ Inventario en volúmenes del host..."
find /var/lib/docker/volumes/ -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$BACKUP_DIR/logs/inventory_host_volumes_$TIMESTAMP.txt" 2>/dev/null

echo "  📋 Conteos por tipo..."
{
    echo "=== CONTEOS DE ARCHIVOS ACTUALES ==="
    echo "Fecha: $(date)"
    echo ""
    echo "PDFs en contenedor: $(docker exec mpd-concursos-backend-prod find /app/storage -name "*.pdf" | wc -l 2>/dev/null || echo "N/A")"
    echo "Imágenes en contenedor: $(docker exec mpd-concursos-backend-prod find /app/storage \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l 2>/dev/null || echo "N/A")"
    echo "Total archivos en contenedor: $(docker exec mpd-concursos-backend-prod find /app/storage -type f | wc -l 2>/dev/null || echo "N/A")"
    echo ""
    echo "Archivos en host volumes: $(find /var/lib/docker/volumes/ -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l 2>/dev/null)"
    echo ""
    echo "Directorios de usuarios: $(docker exec mpd-concursos-backend-prod ls /app/storage/documents | wc -l 2>/dev/null || echo "N/A")"
} > "$BACKUP_DIR/logs/conteos_actuales_$TIMESTAMP.txt"

echo "📈 6. Información del sistema..."
df -h > "$BACKUP_DIR/logs/disk_usage_$TIMESTAMP.txt"
free -h > "$BACKUP_DIR/logs/memory_usage_$TIMESTAMP.txt"
ps aux > "$BACKUP_DIR/logs/processes_$TIMESTAMP.txt"

echo "🔍 7. Estado del repositorio Git..."
git status > "$BACKUP_DIR/logs/git_status_$TIMESTAMP.txt" 2>/dev/null
git log --oneline -10 > "$BACKUP_DIR/logs/git_commits_$TIMESTAMP.txt" 2>/dev/null
git diff > "$BACKUP_DIR/logs/git_diff_$TIMESTAMP.txt" 2>/dev/null

echo "📋 8. Creando manifiesto de backup..."
{
    echo "=== MANIFIESTO DE BACKUP ESTADO ACTUAL ==="
    echo "Timestamp: $TIMESTAMP"
    echo "Fecha: $(date)"
    echo "Directorio: $BACKUP_DIR"
    echo ""
    echo "=== CONTENIDO DEL BACKUP ==="
    find "$BACKUP_DIR" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -k2
    echo ""
    echo "=== TAMAÑO TOTAL ==="
    du -sh "$BACKUP_DIR"
    echo ""
    echo "=== PRÓXIMO PASO ==="
    echo "Descargar este directorio completo a máquina externa:"
    echo "scp -r $BACKUP_BASE user@external_machine:~/mpd_recovery_master/"
} > "$BACKUP_DIR/MANIFIESTO_BACKUP.txt"

# Crear script de descarga
cat > "$BACKUP_BASE/DESCARGAR_BACKUP.sh" << 'DOWNLOAD_SCRIPT'
#!/bin/bash
echo "📥 DESCARGANDO BACKUP COMPLETO A MÁQUINA EXTERNA"
echo "================================================"
echo ""
echo "🔧 EJECUTAR EN MÁQUINA EXTERNA:"
echo "mkdir -p ~/mpd_recovery_master"
echo "scp -r root@$(hostname -I | awk '{print $1}'):/root/BACKUP_ESTADO_ACTUAL ~/mpd_recovery_master/"
echo ""
echo "📊 TAMAÑO ESTIMADO DE DESCARGA:"
du -sh /root/BACKUP_ESTADO_ACTUAL
echo ""
echo "⏱️ TIEMPO ESTIMADO: 10-30 minutos (según conexión)"
DOWNLOAD_SCRIPT

chmod +x "$BACKUP_BASE/DESCARGAR_BACKUP.sh"

echo ""
echo "✅ ¡BACKUP COMPLETO TERMINADO!"
echo "=================================================="
echo "📁 Ubicación: $BACKUP_DIR"
echo "📊 Tamaño total: $(du -sh "$BACKUP_DIR" | awk '{print $1}')"
echo "📋 Archivos creados: $(find "$BACKUP_DIR" -type f | wc -l)"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   1. Ejecutar: $BACKUP_BASE/DESCARGAR_BACKUP.sh"
echo "   2. Descargar a máquina externa"
echo "   3. Proceder con exploración de backups"
echo ""
echo "⚠️ IMPORTANTE: No continuar hasta confirmar que backup está descargado"
