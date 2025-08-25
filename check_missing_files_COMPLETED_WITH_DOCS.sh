#!/bin/bash

BASE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
INPUT_FILE="documents_paths_COMPLETED_WITH_DOCS.txt"
MISSING_FILE="missing_files_COMPLETED_WITH_DOCS_final.txt"

echo "=== VERIFICACIÓN DE ARCHIVOS FALTANTES - COMPLETED_WITH_DOCS ==="
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Ruta base: $BASE_PATH"
echo ""

# Limpiar archivo anterior
> "$MISSING_FILE"

found=0
missing=0

echo "🔍 Verificando existencia de archivos..."

# Leer archivo línea por línea, saltando el header MySQL
tail -n +5 "$INPUT_FILE" | head -n -1 | while read -r line; do
    # Extraer solo el path del archivo (remover bordes de tabla MySQL)
    file_path=$(echo "$line" | sed 's/^| *//' | sed 's/ *|$//')
    
    if [ ! -z "$file_path" ] && [ "$file_path" != "file_path" ]; then
        full_path="$BASE_PATH/$file_path"
        
        if [ -f "$full_path" ]; then
            found=$((found + 1))
            if [ $((found % 50)) -eq 0 ]; then
                echo "  ✅ Encontrados: $found archivos..."
            fi
        else
            missing=$((missing + 1))
            echo "$file_path" >> "$MISSING_FILE"
            if [ $((missing % 10)) -eq 0 ]; then
                echo "  ❌ Faltantes: $missing archivos..."
            fi
        fi
    fi
done

# Leer contadores finales del archivo temporal
total_found=$(cat "$MISSING_FILE" 2>/dev/null | wc -l)
total_files=$(tail -n +5 "$INPUT_FILE" | head -n -1 | grep -c '|')

echo ""
echo "=== RESUMEN FINAL ==="
echo "📊 Total archivos procesados: $total_files"
echo "✅ Archivos encontrados: $((total_files - total_found))"
echo "❌ Archivos faltantes: $total_found"
echo "📈 Porcentaje de consistencia: $(( (total_files - total_found) * 100 / total_files ))%"
echo ""

if [ $total_found -gt 0 ]; then
    echo "💾 Lista de archivos faltantes guardada en: $MISSING_FILE"
    echo "📋 Primeros 10 archivos faltantes:"
    head -10 "$MISSING_FILE" | nl -w2 -s'. '
    
    if [ $total_found -gt 10 ]; then
        echo "  ... y $((total_found - 10)) archivos más"
    fi
else
    echo "🎉 ¡Todos los documentos existen físicamente!"
    rm -f "$MISSING_FILE"
fi
