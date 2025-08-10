#!/bin/bash

set -e

echo "🔄 MIGRACIÓN DE DATOS DE STORAGE"
echo "================================"

# Crear backup antes de la migración
echo "📦 Creando backup pre-migración..."
BACKUP_FILE="storage_backup_pre_migration_$(date +%Y%m%d_%H%M%S).tar.gz"
sudo tar -czf "$BACKUP_FILE" -C /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/ .
echo "✅ Backup creado: $BACKUP_FILE"

# Verificar estructura actual
echo ""
echo "📂 Estructura actual del volumen:"
sudo ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/

# Contar archivos antes
echo ""
echo "📊 Contando archivos antes de migración:"
BEFORE_COUNT=$(sudo find /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/ -name "*.pdf" | wc -l)
echo "Archivos PDF encontrados: $BEFORE_COUNT"

echo ""
echo "🔄 Iniciando migración..."

# Parar contenedores para evitar conflictos
echo "⏹️  Deteniendo contenedores..."
docker compose -f docker-compose.prod.yml down

echo ""
echo "📁 Verificando si ya existe ./storage/ en el volumen..."
if [ -d "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage" ]; then
    echo "⚠️  El directorio storage/ ya existe - no se requiere migración"
    echo "✅ Los datos ya están en la ubicación correcta"
else
    echo "📦 Creando estructura de directorios..."
    sudo mkdir -p /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage
    
    echo "🔄 Moviendo datos existentes..."
    # Mover cada directorio individualmente
    for dir in contest-bases contest-descriptions cv-documents documents profile-images temp; do
        if [ -d "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/$dir" ]; then
            echo "  Moviendo $dir..."
            sudo mv "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/$dir" "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage/"
        fi
    done
    
    echo "✅ Migración de directorios completada"
fi

# Verificar después de la migración
echo ""
echo "📂 Estructura después de la migración:"
sudo ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/
echo ""
sudo ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage/

# Contar archivos después
echo ""
echo "📊 Contando archivos después de migración:"
AFTER_COUNT=$(sudo find /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage/documents/ -name "*.pdf" 2>/dev/null | wc -l)
echo "Archivos PDF encontrados en documents/: $AFTER_COUNT"

if [ "$BEFORE_COUNT" -eq "$AFTER_COUNT" ]; then
    echo "✅ Migración exitosa: $AFTER_COUNT archivos migrados"
else
    echo "⚠️  Advertencia: Conteo de archivos no coincide"
    echo "   Antes: $BEFORE_COUNT"
    echo "   Después: $AFTER_COUNT"
fi

echo ""
echo "🚀 Reiniciando contenedores con nueva configuración..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Migración completada!"
echo "📦 Backup disponible en: $BACKUP_FILE"

