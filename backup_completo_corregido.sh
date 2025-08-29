#!/bin/bash
# BACKUP COMPLETO CORREGIDO PARA MPD CONCURSOS
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
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" > "$BACKUP_DIR/docker_info/containers_status.txt"
docker volume ls > "$BACKUP_DIR/docker_info/volumes_list.txt"
docker network ls > "$BACKUP_DIR/docker_info/networks_list.txt"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" > "$BACKUP_DIR/docker_info/images_list.txt"

echo "💾 2. Backup de TODOS los volúmenes Docker..."
# Respaldar volúmenes específicos identificados
for vol in mpd_concursos_storage_data_prod mpd_concursos_storage_data mpd_concursos_mysql_data_prod mpd_concursos_backup_data_prod; do
    if docker volume ls --format "{{.Name}}" | grep -q "^${vol}$"; then
        echo "  📦 Respaldando volumen: $vol"
        docker run --rm \
            -v "$vol":/data \
            -v "$BACKUP_DIR/volumes":/backup \
            alpine tar czf "/backup/vol_${vol}_${TIMESTAMP}.tar.gz" -C /data . 2>/dev/null && echo "    ✅ Volumen $vol respaldado" || echo "    ⚠️ Error en volumen $vol"
    else
        echo "  ⚠️ Volumen $vol no encontrado"
    fi
done

echo "🗄️ 3. Backup de base de datos..."
# Usar el nombre correcto del contenedor
if docker exec mpd-concursos-mysql mysqldump -u root -proot1234 mpd_concursos > "$BACKUP_DIR/database/db_complete_$TIMESTAMP.sql" 2>/dev/null; then
    echo "  ✅ Base de datos respaldada con root"
elif docker exec mpd-concursos-mysql mysqldump -u concursos -pconcursos123 mpd_concursos > "$BACKUP_DIR/database/db_complete_$TIMESTAMP.sql" 2>/dev/null; then
    echo "  ✅ Base de datos respaldada con usuario concursos"
else
    echo "  ❌ No se pudo respaldar la BD - probando otras credenciales..."
    # Intentar con otras posibles credenciales
    docker exec mpd-concursos-mysql mysqldump -u root --password="" mpd_concursos > "$BACKUP_DIR/database/db_complete_$TIMESTAMP.sql" 2>/dev/null && echo "  ✅ BD respaldada sin password" || echo "  ❌ No se pudo respaldar la BD"
fi

echo "⚙️ 4. Backup de configuraciones..."
cp docker-compose*.yml "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ Algunos docker-compose no encontrados"
cp .env* "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ Algunos .env no encontrados"
cp -r recovery_scripts_external "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ recovery_scripts_external no encontrado"
cp -r docs "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ docs no encontrado"

# Copiar este directorio completo
cp -r RECOVERY_PLAN_DEFINITIVO "$BACKUP_DIR/config/" 2>/dev/null || echo "  ⚠️ RECOVERY_PLAN_DEFINITIVO no encontrado"

echo "📊 5. Creando inventarios detallados..."

# Inventario de archivos actuales por ubicación
echo "  📄 Inventario en contenedor backend..."
# Usar el nombre correcto del contenedor
docker exec mpd-concursos-backend find /app/storage -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$BACKUP_DIR/logs/inventory_container_storage_$TIMESTAMP.txt" 2>/dev/null || echo "    ⚠️ No se pudo acceder al storage del contenedor"

echo "  🗂️ Inventario en volúmenes del host..."
find /var/lib/docker/volumes/ -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$BACKUP_DIR/logs/inventory_host_volumes_$TIMESTAMP.txt" 2>/dev/null

echo "  📋 Conteos por tipo..."
{
    echo "=== CONTEOS DE ARCHIVOS ACTUALES ==="
    echo "Fecha: $(date)"
    echo ""
    echo "PDFs en contenedor: $(docker exec mpd-concursos-backend find /app/storage -name "*.pdf" | wc -l 2>/dev/null || echo "N/A")"
    echo "Imágenes en contenedor: $(docker exec mpd-concursos-backend find /app/storage \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l 2>/dev/null || echo "N/A")"
    echo "Total archivos en contenedor: $(docker exec mpd-concursos-backend find /app/storage -type f | wc -l 2>/dev/null || echo "N/A")"
    echo ""
    echo "Archivos en host volumes: $(find /var/lib/docker/volumes/ -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l 2>/dev/null)"
    echo ""
    echo "Directorios de usuarios: $(docker exec mpd-concursos-backend ls /app/storage/documents 2>/dev/null | wc -l || echo "N/A")"
} > "$BACKUP_DIR/logs/conteos_actuales_$TIMESTAMP.txt"

echo "📈 6. Información del sistema..."
df -h > "$BACKUP_DIR/logs/disk_usage_$TIMESTAMP.txt"
free -h > "$BACKUP_DIR/logs/memory_usage_$TIMESTAMP.txt"
ps aux > "$BACKUP_DIR/logs/processes_$TIMESTAMP.txt"

echo "🔍 7. Estado del repositorio Git..."
git status > "$BACKUP_DIR/logs/git_status_$TIMESTAMP.txt" 2>/dev/null || echo "  ⚠️ Git no disponible"
git log --oneline -10 > "$BACKUP_DIR/logs/git_commits_$TIMESTAMP.txt" 2>/dev/null || echo "  ⚠️ Git log no disponible"
git diff > "$BACKUP_DIR/logs/git_diff_$TIMESTAMP.txt" 2>/dev/null || echo "  ⚠️ Git diff no disponible"

echo "📋 8. Creando manifiesto de backup..."
{
    echo "=== MANIFIESTO DE BACKUP ESTADO ACTUAL ==="
    echo "Timestamp: $TIMESTAMP"
    echo "Fecha: $(date)"
    echo "Directorio: $BACKUP_DIR"
    echo ""
    echo "=== CONTENEDORES IDENTIFICADOS ==="
    echo "Backend: mpd-concursos-backend"
    echo "MySQL: mpd-concursos-mysql"
    echo ""
    echo "=== VOLÚMENES RESPALDADOS ==="
    ls -la "$BACKUP_DIR/volumes/" | grep ".tar.gz" || echo "No hay volúmenes respaldados"
    echo ""
    echo "=== CONTENIDO DEL BACKUP ==="
    find "$BACKUP_DIR" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -k2
    echo ""
    echo "=== TAMAÑO TOTAL ==="
    du -sh "$BACKUP_DIR"
} > "$BACKUP_DIR/MANIFIESTO_BACKUP.txt"

echo ""
echo "✅ ¡BACKUP COMPLETO TERMINADO!"
echo "=================================================="
echo "📁 Ubicación: $BACKUP_DIR"
echo "📊 Tamaño total: $(du -sh "$BACKUP_DIR" | awk '{print $1}')"
echo "📋 Archivos creados: $(find "$BACKUP_DIR" -type f | wc -l)"
echo ""
echo "🔍 VERIFICACIÓN RÁPIDA:"
echo "  📦 Volúmenes: $(ls -1 "$BACKUP_DIR/volumes/"*.tar.gz 2>/dev/null | wc -l) archivos"
echo "  🗄️ Base de datos: $(ls -la "$BACKUP_DIR/database/"*.sql 2>/dev/null | wc -l) archivo(s)"
echo "  ⚙️ Configuraciones: $(find "$BACKUP_DIR/config/" -type f 2>/dev/null | wc -l) archivos"
