#!/bin/bash
# Script 3: Restauración final (ejecutar después de restaurar al backup del 5/8)

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

echo "🔄 [$(date)] RESTAURANDO ARCHIVOS RECUPERADOS AL SISTEMA ACTUAL"
echo "📁 Origen: $RECOVERED_DIR"
echo "📁 Destino: $STORAGE_PATH"

# Contar archivos a restaurar
TOTAL_FILES=$(find "$RECOVERED_DIR" -type f -name "*.pdf" | wc -l)
echo "📊 Total de archivos PDF a restaurar: $TOTAL_FILES"

# Crear backup de seguridad del estado actual
BACKUP_DIR="/root/storage_backup_before_final_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Creando backup de seguridad en: $BACKUP_DIR"
cp -r "$STORAGE_PATH" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ Warning: Error parcial en backup de seguridad"

# Verificar que el directorio de storage existe
if [ ! -d "$STORAGE_PATH" ]; then
    echo "❌ Error: El directorio de storage $STORAGE_PATH no existe"
    exit 1
fi

# Restaurar archivos
echo "🔄 Restaurando archivos..."
RESTORED=0
ERRORS=0

find "$RECOVERED_DIR" -type f -name "*.pdf" | while read -r file; do
    # Obtener ruta relativa
    REL_PATH=$(realpath --relative-to="$RECOVERED_DIR" "$file")
    TARGET_PATH="$STORAGE_PATH/$REL_PATH"
    
    # Crear directorio destino si no existe
    mkdir -p "$(dirname "$TARGET_PATH")"
    
    # Copiar archivo
    if cp "$file" "$TARGET_PATH"; then
        echo "✅ Restaurado: $REL_PATH"
        RESTORED=$((RESTORED + 1))
    else
        echo "❌ Error restaurando: $REL_PATH"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📊 RESUMEN DE RESTAURACIÓN:"
echo "   ✅ Archivos procesados: $TOTAL_FILES"
echo "   💾 Backup de seguridad en: $BACKUP_DIR"
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
echo "   Total PDFs en storage: $(find "$STORAGE_PATH" -name "*.pdf" | wc -l)"
echo ""
echo "✅ PROCESO COMPLETADO - Verificar funcionamiento de la aplicación"

