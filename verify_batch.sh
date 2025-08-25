#!/bin/bash

BASE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
BATCH_SIZE=100
found=0
missing=0
batch_num=1

echo "=== VERIFICACIÓN POR LOTES DE DOCUMENTOS ==="
echo "Ruta base: $BASE_PATH"
echo ""

# Obtener total de archivos únicos
total=$(docker exec -i mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos -e "
SELECT COUNT(DISTINCT d.file_path)
FROM inscriptions i
JOIN user_entity u ON i.user_id = u.id
JOIN documents d ON d.user_id = u.id 
WHERE i.status = 'COMPLETED_WITH_DOCS'
    AND d.is_archived = 0
    AND d.file_path IS NOT NULL;
" 2>/dev/null | tail -n +2)

echo "Total de archivos a verificar: $total"
echo ""

# Procesar en lotes
offset=0
while [ $offset -lt $total ]; do
    echo "Procesando lote $batch_num (archivos $((offset+1)) - $((offset+BATCH_SIZE)))..."
    
    docker exec -i mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos -e "
    SELECT DISTINCT d.file_path
    FROM inscriptions i
    JOIN user_entity u ON i.user_id = u.id
    JOIN documents d ON d.user_id = u.id 
    WHERE i.status = 'COMPLETED_WITH_DOCS'
        AND d.is_archived = 0
        AND d.file_path IS NOT NULL
    ORDER BY d.file_path
    LIMIT $BATCH_SIZE OFFSET $offset;
    " 2>/dev/null | tail -n +2 | while read -r file_path; do
        if [ ! -z "$file_path" ]; then
            full_path="$BASE_PATH/$file_path"
            if [ -f "$full_path" ]; then
                echo "$((found+1))" > found.tmp
            else
                echo "$((missing+1))" > missing.tmp
                echo "✗ FALTANTE: $file_path"
                echo "$file_path" >> missing_files_list.txt
            fi
        fi
    done
    
    offset=$((offset + BATCH_SIZE))
    batch_num=$((batch_num + 1))
    
    # Solo procesar los primeros 300 archivos para esta verificación inicial
    if [ $offset -ge 300 ]; then
        echo ""
        echo "Procesando primeros 300 archivos como muestra..."
        break
    fi
done

# Contar archivos faltantes
if [ -f missing_files_list.txt ]; then
    missing_count=$(wc -l < missing_files_list.txt)
else
    missing_count=0
fi

found_count=$((300 - missing_count))

echo ""
echo "=== RESUMEN (MUESTRA DE 300 ARCHIVOS) ==="
echo "Archivos verificados: 300"
echo "Archivos ENCONTRADOS: $found_count"
echo "Archivos FALTANTES: $missing_count"

if [ $missing_count -gt 0 ]; then
    echo ""
    echo "=== ARCHIVOS FALTANTES DETECTADOS ==="
    cat missing_files_list.txt
fi

# Limpiar archivos temporales
rm -f found.tmp missing.tmp
