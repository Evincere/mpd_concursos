#!/bin/bash
# Script para recuperar documentos desde respaldo del proveedor
# Ejecutar cuando se tenga acceso al respaldo

BACKUP_MOUNT_POINT="$1"
RECOVERY_TARGET="/tmp/provider_recovery"

if [ -z "$BACKUP_MOUNT_POINT" ]; then
    echo "❌ Error: Debe proporcionar el punto de montaje del respaldo"
    echo "Uso: $0 /path/to/backup/mount"
    exit 1
fi

echo "🔄 Iniciando recuperación desde respaldo del proveedor..."
echo "📁 Respaldo montado en: $BACKUP_MOUNT_POINT"

# Crear directorio de recuperación
mkdir -p "$RECOVERY_TARGET"

# Lista de usuarios críticos
USUARIOS_CRITICOS=(
    "23520516" "24467884" "26569905" "27544194" "27651864" "27931606" 
    "28226117" "28511308" "29267571" "29277615" "30108615" "30724462" 
    "30984162" "31432016" "31737951" "31821855" "31854739" "32161223" 
    "33579011" "33583216" "36746208" "36859594" "37002217" "37513884" 
    "38207799" "39238641" "40787955" "41991997"
)

RECOVERED=0
NOT_FOUND=0

echo "🔍 Buscando documentos de ${#USUARIOS_CRITICOS[@]} usuarios..."

for dni in "${USUARIOS_CRITICOS[@]}"; do
    SOURCE_DIR="$BACKUP_MOUNT_POINT/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/$dni"
    
    if [ -d "$SOURCE_DIR" ]; then
        echo "✅ Encontrado: $dni"
        cp -r "$SOURCE_DIR" "$RECOVERY_TARGET/"
        ((RECOVERED++))
    else
        echo "❌ No encontrado: $dni"
        ((NOT_FOUND++))
    fi
done

echo ""
echo "📊 RESUMEN DE RECUPERACIÓN:"
echo "   ✅ Usuarios recuperados: $RECOVERED"
echo "   ❌ Usuarios no encontrados: $NOT_FOUND"
echo "   📁 Archivos en: $RECOVERY_TARGET"

if [ $RECOVERED -gt 0 ]; then
    echo ""
    echo "🔄 Creando archivo comprimido..."
    tar -czf "/root/concursos/mpd_concursos/provider_recovery_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$RECOVERY_TARGET" .
    echo "✅ Recuperación completada"
else
    echo "⚠️ No se recuperaron documentos"
fi
