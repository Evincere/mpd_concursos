#!/bin/bash

# Script para verificar integridad de backups descargados
# Uso: ./verificar-integridad-backups.sh [directorio-backups]

BACKUP_DIR=${1:-"./mpd-monitor-backups"}
CHECKSUMS_FILE="mpd-monitor-backups-checksums-updated.md5"

echo "🔍 Verificando integridad de backups descargados..."
echo "📁 Directorio: $BACKUP_DIR"
echo "📋 Archivo checksums: $CHECKSUMS_FILE"
echo ""

# Verificar que existe el directorio de backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Directorio de backups no encontrado: $BACKUP_DIR"
    exit 1
fi

# Verificar que existe el archivo de checksums
if [ ! -f "$CHECKSUMS_FILE" ]; then
    echo "❌ Error: Archivo de checksums no encontrado: $CHECKSUMS_FILE"
    echo "💡 Descárgalo con: scp root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/mpd-monitor-backups-checksums-updated.md5 ./"
    exit 1
fi

echo "📊 Contando archivos..."
LOCAL_FILES=$(find "$BACKUP_DIR" -type f | wc -l)
SERVER_FILES=$(wc -l < "$CHECKSUMS_FILE")

echo "   - Archivos locales: $LOCAL_FILES"
echo "   - Archivos servidor: $SERVER_FILES"

if [ "$LOCAL_FILES" -ne "$SERVER_FILES" ]; then
    echo "❌ Error: Número de archivos no coincide"
    exit 1
fi

echo ""
echo "🔐 Generando checksums locales..."
cd "$BACKUP_DIR"
find . -type f -exec md5sum {} \; | sort > ../checksums-local.md5
cd ..

echo "🔄 Preparando checksums del servidor..."
sed 's|/opt/mpd-monitor/backups/|./|g' "$CHECKSUMS_FILE" | sort > checksums-server.md5

echo "⚖️  Comparando checksums..."
if diff checksums-local.md5 checksums-server.md5 > /dev/null; then
    echo ""
    echo "✅ ¡INTEGRIDAD VERIFICADA!"
    echo "🎉 Todos los $LOCAL_FILES archivos coinciden perfectamente"
    echo "💾 Tamaño total verificado: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo ""
    echo "🗑️  Puedes proceder a eliminar los backups del servidor con seguridad"
    
    # Limpiar archivos temporales
    rm -f checksums-local.md5 checksums-server.md5
    
    exit 0
else
    echo ""
    echo "❌ ERROR DE INTEGRIDAD"
    echo "🚨 Algunos archivos no coinciden o están corruptos"
    echo ""
    echo "🔍 Diferencias encontradas:"
    diff checksums-local.md5 checksums-server.md5 | head -10
    echo ""
    echo "⚠️  NO elimines los backups del servidor hasta resolver este problema"
    
    exit 1
fi