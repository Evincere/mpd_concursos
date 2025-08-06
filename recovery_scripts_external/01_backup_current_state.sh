#!/bin/bash
# Script 1: Crear backup completo del estado actual - VERSIÓN 3 FECHAS

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/external_recovery"
EXTRACTION_DIR="/root/external_recovery/extractions"

echo "🔄 [$(date)] CREANDO BACKUP COMPLETO DEL ESTADO ACTUAL"
echo "📅 Timestamp: $TIMESTAMP"
echo "🎯 ESTRATEGIA: Recuperación con 3 fechas de respaldo (3/8, 4/8, 5/8)"

# Crear directorios de backup y extracción
mkdir -p "$BACKUP_DIR"
mkdir -p "$EXTRACTION_DIR"
mkdir -p "$EXTRACTION_DIR/03_agosto"
mkdir -p "$EXTRACTION_DIR/04_agosto" 
mkdir -p "$EXTRACTION_DIR/05_agosto"

echo "💾 Backup de volúmenes Docker..."
docker run --rm \
    -v mpd_concursos_storage_data_prod:/data \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/current_storage_$TIMESTAMP.tar.gz" -C /data .

echo "🗄️ Backup de base de datos..."
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$BACKUP_DIR/current_db_$TIMESTAMP.sql"

echo "📊 Creando inventario detallado..."
docker exec mpd-concursos-backend-prod find /app/storage -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$BACKUP_DIR/current_inventory_$TIMESTAMP.txt"

# Información del sistema
docker ps > "$BACKUP_DIR/docker_status_$TIMESTAMP.txt"
df -h > "$BACKUP_DIR/disk_usage_$TIMESTAMP.txt"

# Crear archivo de metadatos
cat > "$BACKUP_DIR/metadata_$TIMESTAMP.txt" << METADATA
BACKUP_TIMESTAMP=$TIMESTAMP
BACKUP_DATE=$(date)
TOTAL_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l)
TOTAL_CV=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" | wc -l)
TOTAL_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l)
TOTAL_USERS=$(docker exec mpd-concursos-backend-prod ls /app/storage/documents | wc -l)
METADATA

echo "✅ Backup completo creado en: $BACKUP_DIR"
echo "📦 Archivos creados:"
ls -la "$BACKUP_DIR"/*$TIMESTAMP*

echo ""
echo "📁 Estructura de directorios preparada:"
echo "   $BACKUP_DIR/                    # Backup del estado actual"
echo "   $EXTRACTION_DIR/03_agosto/      # Extracción del respaldo 3/8"
echo "   $EXTRACTION_DIR/04_agosto/      # Extracción del respaldo 4/8"
echo "   $EXTRACTION_DIR/05_agosto/      # Extracción del respaldo 5/8"

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Descargar backup a máquina externa:"
echo "   scp -r root@$(hostname -I | awk '{print $1}'):$BACKUP_DIR ~/mpd_recovery_backup/"
echo ""
echo "2. Ejecutar extracciones secuenciales:"
echo "   - Restaurar al 3/8 → Ejecutar extracción"
echo "   - Restaurar al 4/8 → Ejecutar extracción"  
echo "   - Restaurar al 5/8 → Ejecutar extracción"
echo ""
echo "3. Consolidar en máquina externa"
echo "4. Restaurar estado actual + integrar documentos"

echo ""
echo "⚠️ IMPORTANTE: Guarda este timestamp: $TIMESTAMP"
echo "📋 CÓDIGO FUENTE: Respaldado en repositorio Git (commit fa63bd9a)"
