#!/bin/bash

# =======================================================
# SCRIPT DE RESTAURACIÓN POST-RECUPERACIÓN
# Ejecutar DESPUÉS de volver al backup del 5/8
# =======================================================

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debe proporcionar la ruta del directorio de archivos recuperados"
    echo "📋 Uso: $0 /ruta/al/directorio/recovered_files"
    exit 1
fi

RECOVERED_DIR="$1"
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

if [ ! -d "$RECOVERED_DIR" ]; then
    echo "❌ Error: El directorio $RECOVERED_DIR no existe"
    exit 1
fi

echo "🔄 [$(date)] INICIANDO RESTAURACIÓN DE ARCHIVOS RECUPERADOS"
echo "📁 Origen: $RECOVERED_DIR"
echo "📁 Destino: $STORAGE_PATH"

# Contar archivos a restaurar
TOTAL_FILES=$(find "$RECOVERED_DIR" -type f | wc -l)
echo "📊 Total de archivos a restaurar: $TOTAL_FILES"

# Crear backup de seguridad del estado actual
BACKUP_DIR="/root/concursos/mpd_concursos/storage_backup_before_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Creando backup de seguridad en: $BACKUP_DIR"
cp -r "$STORAGE_PATH" "$BACKUP_DIR/" || echo "⚠️ Warning: Error en backup de seguridad"

# Restaurar archivos
echo "🔄 Restaurando archivos..."
RESTORED=0
ERRORS=0

find "$RECOVERED_DIR" -type f | while read -r file; do
    # Obtener ruta relativa
    REL_PATH=$(realpath --relative-to="$RECOVERED_DIR" "$file")
    TARGET_PATH="$STORAGE_PATH/$REL_PATH"
    
    # Crear directorio destino si no existe
    mkdir -p "$(dirname "$TARGET_PATH")"
    
    # Copiar archivo
    if cp "$file" "$TARGET_PATH"; then
        echo "✅ Restaurado: $REL_PATH"
        ((RESTORED++))
    else
        echo "❌ Error restaurando: $REL_PATH"
        ((ERRORS++))
    fi
done

echo ""
echo "📊 RESUMEN DE RESTAURACIÓN:"
echo "   ✅ Archivos restaurados: $RESTORED"
echo "   ❌ Errores: $ERRORS"
echo "   💾 Backup de seguridad en: $BACKUP_DIR"
echo ""
echo "🎯 Verificar que los contenedores puedan acceder a los archivos restaurados"

