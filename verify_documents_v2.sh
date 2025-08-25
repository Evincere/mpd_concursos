#!/bin/bash

BASE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"

echo "=== VERIFICACIÓN DE EXISTENCIA FÍSICA DE DOCUMENTOS ==="
echo "Ruta base: $BASE_PATH"
echo ""

# Crear archivos temporales para contadores
echo "0" > found.tmp
echo "0" > missing.tmp

# Obtener todas las rutas
docker exec -i mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos -e "
SELECT DISTINCT d.file_path
FROM inscriptions i
JOIN user_entity u ON i.user_id = u.id
JOIN documents d ON d.user_id = u.id 
JOIN document_types dt ON d.document_type_id = dt.id
WHERE i.status = 'COMPLETED_WITH_DOCS'
    AND d.is_archived = 0
    AND d.file_path IS NOT NULL
ORDER BY d.file_path;
" 2>/dev/null | tail -n +2 > all_paths.tmp

total_files=$(wc -l < all_paths.tmp)
found=0
missing=0

echo "Total de archivos a verificar: $total_files"
echo ""

while read -r file_path; do
    if [ ! -z "$file_path" ]; then
        full_path="$BASE_PATH/$file_path"
        if [ -f "$full_path" ]; then
            found=$((found + 1))
            echo "✓ ENCONTRADO: $file_path"
        else
            missing=$((missing + 1))
            echo "✗ FALTANTE: $file_path"
            echo "$file_path" >> missing_files.txt
        fi
    fi
done < all_paths.tmp

echo ""
echo "=== RESUMEN FINAL ==="
echo "Total verificado: $total_files archivos"
echo "Archivos ENCONTRADOS: $found"
echo "Archivos FALTANTES: $missing"

# Limpiar archivos temporales
rm -f all_paths.tmp found.tmp missing.tmp

if [ -f missing_files.txt ] && [ -s missing_files.txt ]; then
    echo ""
    echo "=== LISTA DE ARCHIVOS FALTANTES ==="
    cat missing_files.txt
fi
