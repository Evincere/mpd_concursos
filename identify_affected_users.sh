#!/bin/bash

echo "🔍 IDENTIFICANDO USUARIOS AFECTADOS"
echo "===================================="
echo "Usuarios con documentos en BD pero archivos perdidos"
echo ""

DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS=$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2)
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage"

echo "📊 Analizando documentos desde el 5 de agosto 2025..."

# Obtener usuarios con documentos recientes
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT CONCAT(HEX(d.user_id), '|', u.email, '|', u.first_name, '|', u.last_name, '|', u.dni, '|', COUNT(*)) as user_info
FROM documents d 
JOIN user_entity u ON d.user_id = u.id 
WHERE d.upload_date >= '2025-08-05 00:00:00' 
  AND d.is_archived = 0 
GROUP BY d.user_id, u.email, u.first_name, u.last_name, u.dni
ORDER BY MAX(d.upload_date) DESC;" 2>/dev/null | grep -v user_info | while IFS='|' read -r user_id email first_name last_name dni doc_count; do
    
    if [ -n "$dni" ] && [ "$dni" != "NULL" ]; then
        user_dir="$STORAGE_PATH/documents/$dni"
        
        # Contar archivos físicos
        if [ -d "$user_dir" ]; then
            physical_files=$(find "$user_dir" -name "*.pdf" 2>/dev/null | wc -l)
        else
            physical_files=0
        fi
        
        # Si hay documentos en BD pero pocos o ningún archivo físico
        if [ "$doc_count" -gt "$physical_files" ]; then
            missing_files=$((doc_count - physical_files))
            echo "❌ USUARIO AFECTADO:"
            echo "   📧 Email: $email"
            echo "   👤 Nombre: $first_name $last_name"
            echo "   🆔 DNI: $dni"
            echo "   📄 Docs en BD: $doc_count"
            echo "   💾 Archivos físicos: $physical_files"
            echo "   ⚠️  Archivos perdidos: $missing_files"
            echo ""
        else
            echo "✅ $email - OK ($doc_count docs, $physical_files archivos)"
        fi
    fi
done

echo ""
echo "🎯 CASO ESPECÍFICO: Sergio Pereyra"
echo "================================="

# Información específica de Sergio Pereyra
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    d.file_name,
    d.file_path,
    d.upload_date,
    d.status
FROM documents d 
WHERE d.user_id = UNHEX('74245CB93D024BDE95528A9CBC1AB253') 
ORDER BY d.upload_date DESC;" 2>/dev/null

sergio_dir="$STORAGE_PATH/documents/26598410"
if [ -d "$sergio_dir" ]; then
    echo ""
    echo "📁 Contenido del directorio de Sergio Pereyra:"
    sudo ls -la "$sergio_dir"
else
    echo ""
    echo "❌ Directorio de Sergio Pereyra no existe o está vacío"
fi

