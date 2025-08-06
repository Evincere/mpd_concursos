#!/bin/bash
# Script 2: Extracción (ejecutar después de restaurar al backup del 3/8)

set -e

echo "🔄 [$(date)] EXTRAYENDO DOCUMENTOS DEL BACKUP 3/8"

STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
WORK_DIR="/root/recovery_toolkit_portable"

cd "$WORK_DIR"

# Buscar el archivo de lista de documentos (puede venir del directorio descargado)
if [ -f "documentos_limpios.txt" ]; then
    LISTA_FILE="documentos_limpios.txt"
elif [ -f "recovery_temp_*/documentos_limpios.txt" ]; then
    LISTA_FILE=$(find . -name "documentos_limpios.txt" | head -1)
else
    echo "❌ Error: No se encontró la lista de documentos a recuperar"
    echo "   Asegúrate de haber subido el directorio recovery_temp_* desde local"
    exit 1
fi

echo "📋 Usando lista de archivos: $LISTA_FILE"
echo "📊 Total de archivos a buscar: $(wc -l < "$LISTA_FILE")"

# Crear directorio para archivos recuperados
mkdir -p recovered_files

ENCONTRADOS=0
NO_ENCONTRADOS=0

# Extraer archivos
while IFS= read -r file_path; do
    if [ -f "$STORAGE_PATH/$file_path" ]; then
        # Crear directorio destino
        mkdir -p "$(dirname "recovered_files/$file_path")"
        # Copiar archivo
        cp "$STORAGE_PATH/$file_path" "recovered_files/$file_path"
        echo "✅ Recuperado: $file_path"
        ((ENCONTRADOS++))
    else
        echo "❌ No encontrado: $file_path"
        ((NO_ENCONTRADOS++))
    fi
done < "$LISTA_FILE"

echo ""
echo "📊 RESUMEN DE EXTRACCIÓN:"
echo "   ✅ Archivos recuperados: $ENCONTRADOS"
echo "   ❌ No encontrados: $NO_ENCONTRADOS"

# Crear paquete comprimido
tar -czf "documentos_recuperados_$(date +%Y%m%d_%H%M%S).tar.gz" recovered_files/

echo ""
echo "📦 Archivos empaquetados en: documentos_recuperados_*.tar.gz"
echo "⬇️  DESCARGAR EL DIRECTORIO recovered_files/ A TU MÁQUINA LOCAL"
echo "🔄 Siguiente: Restaurar backup del 5/8 y ejecutar script 03"

