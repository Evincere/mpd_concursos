#!/bin/bash

echo "🔍 DIAGNÓSTICO DE DOCUMENTOS - $(date)"
echo "========================================"

# Variables
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS=$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2)
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

echo "📊 Estadísticas generales:"
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    COUNT(*) as total_documents,
    SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived_docs,
    SUM(CASE WHEN file_path LIKE 'documents/%' THEN 1 ELSE 0 END) as docs_with_prefix
FROM documents;" 2>/dev/null

echo ""
echo "🔍 Buscando documentos con problemas potenciales:"

# Obtener lista de documentos recientes no archivados
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT CONCAT(HEX(id), '|', file_path) as doc_info
FROM documents 
WHERE is_archived = 0 
  AND file_path IS NOT NULL 
  AND upload_date >= '2025-08-01'
ORDER BY upload_date DESC 
LIMIT 20;" 2>/dev/null | grep -v doc_info | while IFS='|' read -r doc_id file_path; do
    
    if [ -n "$file_path" ] && [ "$file_path" != "NULL" ]; then
        full_path="$STORAGE_PATH/$file_path"
        if [ ! -f "$full_path" ]; then
            echo "❌ ARCHIVO NO ENCONTRADO: $doc_id -> $file_path"
        else
            echo "✅ OK: $doc_id"
        fi
    fi
done

echo ""
echo "📁 Verificando estructura de directorios:"
echo "Storage path: $STORAGE_PATH"
if [ -d "$STORAGE_PATH" ]; then
    echo "✅ Directorio storage existe"
    echo "📂 Contenido del directorio documents:"
    sudo ls -la "$STORAGE_PATH/documents/" | head -5
else
    echo "❌ Directorio storage NO existe"
fi

