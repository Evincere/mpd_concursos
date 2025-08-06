#!/bin/bash

echo "📊 REPORTE COMPLETO - USUARIOS AFECTADOS POR PÉRDIDA DE DOCUMENTOS"
echo "=================================================================="
echo "Fecha del reporte: $(date)"
echo "Período afectado: 5 de agosto 2025 - 6 de agosto 2025 (11:34 hrs)"
echo ""

OUTPUT_FILE="usuarios_afectados_$(date +%Y%m%d_%H%M%S).csv"

echo "📄 Generando reporte en formato CSV: $OUTPUT_FILE"
echo "Email,Nombre,Apellido,DNI,Documentos_BD,Archivos_Fisicos,Estado" > "$OUTPUT_FILE"

DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS=$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2)
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage"

echo ""
echo "🔍 Analizando usuarios con documentos desde el 5 de agosto..."

# Crear un archivo temporal con la lista de usuarios
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.dni,
    COUNT(*) as doc_count
FROM documents d 
JOIN user_entity u ON d.user_id = u.id 
WHERE d.upload_date >= '2025-08-05 00:00:00' 
  AND d.is_archived = 0 
GROUP BY u.email, u.first_name, u.last_name, u.dni
ORDER BY u.email;" 2>/dev/null > temp_users.txt

# Procesar cada usuario
TOTAL_USERS=0
AFFECTED_USERS=0

cat temp_users.txt | tail -n +2 | while read -r email first_name last_name dni doc_count; do
    TOTAL_USERS=$((TOTAL_USERS + 1))
    
    if [ -n "$dni" ] && [ "$dni" != "NULL" ] && [[ "$dni" =~ ^[0-9]+$ ]]; then
        user_dir="$STORAGE_PATH/documents/$dni"
        
        # Contar archivos físicos
        if [ -d "$user_dir" ]; then
            physical_files=$(find "$user_dir" -name "*.pdf" 2>/dev/null | wc -l)
        else
            physical_files=0
        fi
        
        # Determinar estado
        if [ "$doc_count" -gt "$physical_files" ]; then
            status="AFECTADO"
            AFFECTED_USERS=$((AFFECTED_USERS + 1))
            echo "❌ $email ($first_name $last_name) - $doc_count docs BD, $physical_files archivos físicos"
        else
            status="OK"
            echo "✅ $email - OK"
        fi
        
        # Agregar al CSV
        echo "$email,$first_name,$last_name,$dni,$doc_count,$physical_files,$status" >> "$OUTPUT_FILE"
    fi
done

# Limpiar archivo temporal
rm -f temp_users.txt

echo ""
echo "📋 RESUMEN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Total de usuarios analizados: $(wc -l < "$OUTPUT_FILE" | xargs expr -1 +)"
echo "❌ Usuarios afectados: $(grep -c "AFECTADO" "$OUTPUT_FILE")"
echo "✅ Usuarios sin problemas: $(grep -c "OK" "$OUTPUT_FILE")"
echo ""
echo "📄 Reporte completo guardado en: $OUTPUT_FILE"
echo ""
echo "🎯 CASO ESPECÍFICO - Sergio Pereyra:"
grep "spereyra.jus@gmail.com" "$OUTPUT_FILE" | while IFS=',' read -r email nombre apellido dni docs_bd archivos_fisicos estado; do
    echo "   📧 Email: $email"
    echo "   👤 Nombre: $nombre $apellido"
    echo "   🆔 DNI: $dni"
    echo "   📄 Documentos en BD: $docs_bd"
    echo "   💾 Archivos físicos: $archivos_fisicos"
    echo "   🚨 Estado: $estado"
done

