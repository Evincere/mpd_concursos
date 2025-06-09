#!/bin/bash

# Script de backup para producción
# MPD Concursos - Backup de base de datos y documentos
# Servidor: vps-4778464-x.dattaweb.com (149.50.132.23)

set -e

# Configuración
BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_CONTAINER="mpd-concursos-mysql-prod"
BACKEND_CONTAINER="mpd-concursos-backend-prod"
RETENTION_DAYS=30

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

log "🗄️ Iniciando backup de producción..."

# Verificar que los contenedores están corriendo
if ! docker ps | grep -q $MYSQL_CONTAINER; then
    error "Contenedor MySQL no está corriendo"
fi

if ! docker ps | grep -q $BACKEND_CONTAINER; then
    error "Contenedor Backend no está corriendo"
fi

# Backup de la base de datos
log "📊 Creando backup de la base de datos..."
DB_BACKUP_FILE="$BACKUP_DIR/mpd_concursos_db_$DATE.sql"

docker exec $MYSQL_CONTAINER mysqldump \
    -u root \
    -p${MYSQL_ROOT_PASSWORD:-root1234} \
    --single-transaction \
    --routines \
    --triggers \
    --all-databases > $DB_BACKUP_FILE

if [ $? -eq 0 ]; then
    log "✅ Backup de base de datos creado: $DB_BACKUP_FILE"
    
    # Comprimir el backup
    gzip $DB_BACKUP_FILE
    log "✅ Backup comprimido: $DB_BACKUP_FILE.gz"
else
    error "❌ Error al crear backup de base de datos"
fi

# Backup de documentos
log "📁 Creando backup de documentos..."
DOCS_BACKUP_FILE="$BACKUP_DIR/mpd_concursos_docs_$DATE.tar.gz"

docker run --rm \
    -v mpd-concursos_document_storage_prod:/source:ro \
    -v $BACKUP_DIR:/backup \
    alpine:latest \
    tar czf /backup/mpd_concursos_docs_$DATE.tar.gz -C /source .

if [ $? -eq 0 ]; then
    log "✅ Backup de documentos creado: $DOCS_BACKUP_FILE"
else
    warn "⚠️ Error al crear backup de documentos (puede ser normal si no hay documentos)"
fi

# Backup de configuración
log "⚙️ Creando backup de configuración..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/mpd_concursos_config_$DATE.tar.gz"

tar czf $CONFIG_BACKUP_FILE \
    docker-compose.prod.yml \
    .env.production \
    mpd-concursos-app-frontend/nginx.conf \
    deploy-production.sh \
    verify-production.sh \
    backup-production.sh

if [ $? -eq 0 ]; then
    log "✅ Backup de configuración creado: $CONFIG_BACKUP_FILE"
else
    warn "⚠️ Error al crear backup de configuración"
fi

# Limpiar backups antiguos
log "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find $BACKUP_DIR -name "mpd_concursos_*" -type f -mtime +$RETENTION_DAYS -delete

# Mostrar resumen
log "📋 Resumen del backup:"
echo "  📊 Base de datos: $(ls -lh $DB_BACKUP_FILE.gz 2>/dev/null | awk '{print $5}' || echo 'Error')"
echo "  📁 Documentos: $(ls -lh $DOCS_BACKUP_FILE 2>/dev/null | awk '{print $5}' || echo 'Error')"
echo "  ⚙️ Configuración: $(ls -lh $CONFIG_BACKUP_FILE 2>/dev/null | awk '{print $5}' || echo 'Error')"
echo "  📍 Ubicación: $BACKUP_DIR"

# Verificar espacio en disco
DISK_USAGE=$(df -h $BACKUP_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    warn "⚠️ Espacio en disco bajo: ${DISK_USAGE}% usado"
fi

log "✅ Backup completado exitosamente"

# Opcional: Enviar backup a almacenamiento remoto
# Descomenta y configura según tus necesidades
# log "☁️ Enviando backup a almacenamiento remoto..."
# rsync -avz $BACKUP_DIR/ user@remote-server:/path/to/backups/
# log "✅ Backup enviado a almacenamiento remoto"

echo ""
echo "📋 Comandos para restaurar:"
echo "  Base de datos: gunzip < $DB_BACKUP_FILE.gz | docker exec -i $MYSQL_CONTAINER mysql -u root -p"
echo "  Documentos: docker run --rm -v mpd-concursos_document_storage_prod:/target -v $BACKUP_DIR:/backup alpine:latest tar xzf /backup/mpd_concursos_docs_$DATE.tar.gz -C /target"
