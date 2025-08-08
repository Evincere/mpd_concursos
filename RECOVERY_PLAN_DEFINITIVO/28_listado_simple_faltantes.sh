#!/bin/bash

# ============================================================================
# SCRIPT: Listado Simple de Documentos Faltantes
# PROPÓSITO: Generar listado básico de usuarios con documentos faltantes
# FECHA: 2025-08-07
# ============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LISTADO_CSV="USUARIOS_DOCUMENTOS_FALTANTES_${TIMESTAMP}.csv"
LISTADO_EMAILS="EMAILS_USUARIOS_AFECTADOS_${TIMESTAMP}.txt"

echo "=== GENERANDO LISTADO DE DOCUMENTOS FALTANTES ==="
echo "Timestamp: $TIMESTAMP"
echo

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
MYSQL_CONTAINER="mpd-concursos-mysql"

# Crear encabezados
echo "DNI,EMAIL,USERNAME,DOCS_BD,DOCS_FISICOS,DOCS_FALTANTES" > "$LISTADO_CSV"
echo "# Lista de emails de usuarios con documentos faltantes - $TIMESTAMP" > "$LISTADO_EMAILS"

echo "📊 Analizando usuarios con documentos faltantes..."

# Obtener usuarios con documentos
USERS_QUERY="SELECT DISTINCT u.dni, u.email, u.username FROM user_entity u INNER JOIN documents d ON d.user_id = u.id WHERE d.is_archived = 0 ORDER BY u.dni;"

contador=0
usuarios_afectados=0
total_docs_faltantes=0

docker exec "$MYSQL_CONTAINER" mysql -u root -p'root1234' mpd_concursos -e "$USERS_QUERY" 2>/dev/null | tail -n +2 | while IFS=$'\t' read -r dni email username; do
    ((contador++))
    
    if [ $((contador % 25)) -eq 0 ]; then
        echo "  Procesados: $contador usuarios..."
    fi
    
    # Contar documentos en BD
    docs_bd=$(docker exec "$MYSQL_CONTAINER" mysql -u root -p'root1234' mpd_concursos -e "SELECT COUNT(*) FROM documents d INNER JOIN user_entity u ON d.user_id = u.id WHERE u.dni = '$dni' AND d.is_archived = 0;" 2>/dev/null | tail -n +2)
    
    # Contar archivos físicos
    if [ -d "$DOCKER_STORAGE/documents/$dni" ]; then
        docs_fisicos=$(ls "$DOCKER_STORAGE/documents/$dni" 2>/dev/null | wc -l)
    else
        docs_fisicos=0
    fi
    
    # Calcular faltantes
    docs_faltantes=$((docs_bd - docs_fisicos))
    
    # Si hay documentos faltantes, agregar a listado
    if [ $docs_faltantes -gt 0 ]; then
        echo "$dni,$email,$username,$docs_bd,$docs_fisicos,$docs_faltantes" >> "$LISTADO_CSV"
        
        if [ -n "$email" ] && [ "$email" != "NULL" ]; then
            echo "$email" >> "$LISTADO_EMAILS"
        fi
        
        echo "❌ $dni ($username): $docs_faltantes documentos faltantes"
        ((usuarios_afectados++))
        total_docs_faltantes=$((total_docs_faltantes + docs_faltantes))
    fi
done

echo
echo "📊 RESUMEN:"
echo "• Usuarios con documentos faltantes: $usuarios_afectados"
echo "• Total documentos faltantes: $total_docs_faltantes"
echo
echo "📄 Archivos generados:"
echo "• Listado CSV: $LISTADO_CSV"
echo "• Lista de emails: $LISTADO_EMAILS"

echo
echo "=== LISTADO COMPLETADO ==="