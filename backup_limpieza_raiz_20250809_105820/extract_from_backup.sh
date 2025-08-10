#!/bin/bash
# Script para extraer documentos después de restaurar a fecha específica

FECHA="$1"
if [ -z "$FECHA" ]; then
    echo "❌ Error: Debe especificar la fecha"
    echo "Uso: $0 [4agosto|5agosto]"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RECOVERY_DIR="/tmp/recovery_$FECHA"
BACKUP_FILE="/root/recovery_${FECHA}_$TIMESTAMP.tar.gz"

echo "🔄 [$(date)] EXTRAYENDO DOCUMENTOS - $FECHA"

# Verificar que los contenedores estén ejecutándose
if ! docker ps | grep -q mpd-concursos-backend-prod; then
    echo "⚠️ Esperando a que los contenedores se inicien..."
    sleep 30
fi

# Crear directorio de recuperación
mkdir -p "$RECOVERY_DIR"

echo "📁 Extrayendo documentos de storage..."

# Verificar que el directorio existe
if [ ! -d "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents" ]; then
    echo "❌ Error: Directorio de documentos no encontrado"
    echo "Verificar que la restauración se completó correctamente"
    exit 1
fi

# Copiar documentos
cp -r /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents "$RECOVERY_DIR/"
cp -r /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/cv-documents "$RECOVERY_DIR/" 2>/dev/null || echo "No hay cv-documents"
cp -r /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/profile-images "$RECOVERY_DIR/" 2>/dev/null || echo "No hay profile-images"

# Crear inventario
echo "📋 Creando inventario..."
find "$RECOVERY_DIR" -name "*.pdf" | wc -l > "$RECOVERY_DIR/pdf_count.txt"
find "$RECOVERY_DIR" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l > "$RECOVERY_DIR/image_count.txt"
ls "$RECOVERY_DIR/documents" | wc -l > "$RECOVERY_DIR/user_count.txt"

# Crear archivo comprimido
echo "📦 Comprimiendo archivos..."
tar -czf "$BACKUP_FILE" -C "$RECOVERY_DIR" .

# Mostrar estadísticas
PDF_COUNT=$(cat "$RECOVERY_DIR/pdf_count.txt")
IMG_COUNT=$(cat "$RECOVERY_DIR/image_count.txt")
USER_COUNT=$(cat "$RECOVERY_DIR/user_count.txt")

echo "✅ Extracción completada - $FECHA"
echo "📊 Estadísticas:"
echo "   📄 PDFs: $PDF_COUNT"
echo "   🖼️ Imágenes: $IMG_COUNT"
echo "   👥 Usuarios: $USER_COUNT"
echo "   📦 Archivo: $BACKUP_FILE"
echo "   💾 Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"

# Limpiar directorio temporal
rm -rf "$RECOVERY_DIR"

echo ""
echo "🎯 PRÓXIMO PASO:"
if [ "$FECHA" = "4agosto" ]; then
    echo "Restaurar al 5 agosto y ejecutar: extract_from_backup.sh 5agosto"
else
    echo "Restaurar al estado actual (6 agosto) y ejecutar: restore_current_state.sh"
fi
