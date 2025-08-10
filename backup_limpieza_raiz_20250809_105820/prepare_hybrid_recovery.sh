#!/bin/bash
# Script de preparación para recuperación híbrida

set -e

BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 [$(date)] INICIANDO PREPARACIÓN PARA RECUPERACIÓN HÍBRIDA"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

echo "💾 Creando backup del estado actual..."

# Backup de volúmenes Docker
echo "📁 Backup de storage..."
docker run --rm \
    -v mpd_concursos_storage_data_prod:/data \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/current_state_$TIMESTAMP.tar.gz" -C /data .

# Backup de base de datos
echo "🗄️ Backup de base de datos..."
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$BACKUP_DIR/current_db_$TIMESTAMP.sql"

# Crear lista de usuarios actuales
echo "📋 Creando inventario actual..."
docker exec mpd-concursos-backend-prod ls /app/storage/documents > "$BACKUP_DIR/current_users_$TIMESTAMP.txt"
docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l > "$BACKUP_DIR/current_docs_count_$TIMESTAMP.txt"

# Información del sistema
echo "ℹ️ Guardando información del sistema..."
docker ps > "$BACKUP_DIR/docker_status_$TIMESTAMP.txt"
df -h > "$BACKUP_DIR/disk_usage_$TIMESTAMP.txt"

echo "✅ Preparación completada"
echo "📊 Archivos de backup:"
ls -la "$BACKUP_DIR"/*$TIMESTAMP*

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Verificar que los backups se crearon correctamente"
echo "2. Descargar archivos críticos a máquina local (opcional)"
echo "3. Proceder con restauración al 4 agosto en el dashboard"
echo "4. Ejecutar: extract_from_backup.sh 4agosto"

echo ""
echo "⚠️ IMPORTANTE:"
echo "- Guarda este timestamp: $TIMESTAMP"
echo "- Los backups están en: $BACKUP_DIR"
echo "- Tiempo estimado total: 3-4 horas"
