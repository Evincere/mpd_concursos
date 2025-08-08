#!/bin/bash

# ============================================================================
# SCRIPT: Auditoría Simple de Documentos
# PROPÓSITO: Versión simplificada para identificar problemas
# FECHA: 2025-08-07
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="AUDITORIA_SIMPLE_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 AUDITORÍA SIMPLE DE DOCUMENTOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando auditoría simple..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
MYSQL_CONTAINER="mpd-concursos-mysql"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# ============================================================================
# 1. OBTENER MUESTRA DE USUARIOS
# ============================================================================
echo -e "${BLUE}📊 1. OBTENIENDO MUESTRA DE USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Query simplificada para obtener 10 usuarios con documentos
USERS_QUERY="
SELECT DISTINCT 
    u.dni,
    u.username,
    HEX(u.id) as uuid,
    COUNT(d.id) as total_documentos
FROM user_entity u 
INNER JOIN documents d ON d.user_id = u.id 
WHERE d.is_archived = 0
GROUP BY u.dni, u.username, u.id
ORDER BY u.dni
LIMIT 10;
"

echo "🔍 Ejecutando consulta de muestra..." | tee -a "$REPORT_FILE"

# Ejecutar query
TEMP_USERS_FILE="/tmp/users_sample_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

if [ ! -s "$TEMP_USERS_FILE" ]; then
    echo "❌ ERROR: No se pudieron obtener usuarios" | tee -a "$REPORT_FILE"
    exit 1
fi

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Obtenidos $TOTAL_USUARIOS usuarios de muestra" | tee -a "$REPORT_FILE"

echo "📋 Usuarios de muestra:" | tee -a "$REPORT_FILE"
cat "$TEMP_USERS_FILE" | while read line; do
    echo "   $line" | tee -a "$REPORT_FILE"
done

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. AUDITAR CADA USUARIO DE LA MUESTRA
# ============================================================================
echo -e "${BLUE}📊 2. AUDITANDO USUARIOS DE MUESTRA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

contador=0
usuarios_con_problemas=0

while IFS=$'\t' read -r dni username uuid_hex total_docs_bd; do
    ((contador++))
    echo -e "${YELLOW}🔍 [$contador/$TOTAL_USUARIOS] Auditando: $dni ($username)${NC}"
    echo "👤 Usuario: $dni ($username)" | tee -a "$REPORT_FILE"
    echo "   📊 Documentos en BD: $total_docs_bd" | tee -a "$REPORT_FILE"
    
    # Formatear UUID si existe
    if [ -n "$uuid_hex" ] && [ "$uuid_hex" != "NULL" ]; then
        FORMATTED_UUID=$(echo "$uuid_hex" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
        echo "   🆔 UUID: $FORMATTED_UUID" | tee -a "$REPORT_FILE"
    else
        FORMATTED_UUID=""
        echo "   🆔 UUID: No disponible" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar archivos físicos en documents/
    USER_DOCS_DIR="$DOCKER_STORAGE/documents/$dni"
    if [ -d "$USER_DOCS_DIR" ]; then
        docs_fisicos=$(find "$USER_DOCS_DIR" -type f 2>/dev/null | wc -l)
        echo "   📄 Documents físicos: $docs_fisicos" | tee -a "$REPORT_FILE"
        
        if [ $docs_fisicos -gt 0 ]; then
            echo "   📁 Archivos encontrados:" | tee -a "$REPORT_FILE"
            ls -la "$USER_DOCS_DIR" 2>/dev/null | tail -n +2 | head -3 | while read line; do
                echo "      $line" | tee -a "$REPORT_FILE"
            done
            if [ $docs_fisicos -gt 3 ]; then
                echo "      ... y $((docs_fisicos - 3)) más" | tee -a "$REPORT_FILE"
            fi
        fi
    else
        docs_fisicos=0
        echo "   📄 Documents físicos: 0 (directorio no existe)" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar CV documents si hay UUID
    cv_fisicos=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" ]; then
        cv_fisicos=$(find "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" -type f 2>/dev/null | wc -l)
        echo "   📝 CV Documents físicos: $cv_fisicos" | tee -a "$REPORT_FILE"
    else
        echo "   📝 CV Documents físicos: 0" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar profile images si hay UUID
    img_fisicas=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" ]; then
        img_fisicas=$(find "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" -type f 2>/dev/null | wc -l)
        echo "   🖼️  Profile Images físicas: $img_fisicas" | tee -a "$REPORT_FILE"
    else
        echo "   🖼️  Profile Images físicas: 0" | tee -a "$REPORT_FILE"
    fi
    
    total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
    echo "   📊 Total físicos: $total_fisicos" | tee -a "$REPORT_FILE"
    
    # Determinar estado
    if [ "$total_docs_bd" -gt "$total_fisicos" ]; then
        diferencia=$((total_docs_bd - total_fisicos))
        echo "   ❌ PROBLEMA: Faltan $diferencia archivos" | tee -a "$REPORT_FILE"
        ((usuarios_con_problemas++))
    elif [ "$total_docs_bd" -lt "$total_fisicos" ]; then
        huerfanos=$((total_fisicos - total_docs_bd))
        echo "   ⚠️  HUÉRFANOS: $huerfanos archivos extra" | tee -a "$REPORT_FILE"
        ((usuarios_con_problemas++))
    else
        echo "   ✅ OK: Coinciden BD y físicos" | tee -a "$REPORT_FILE"
    fi
    
    echo | tee -a "$REPORT_FILE"
    
done < "$TEMP_USERS_FILE"

# ============================================================================
# 3. RESUMEN
# ============================================================================
echo -e "${BLUE}📊 3. RESUMEN DE MUESTRA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 RESULTADOS:" | tee -a "$REPORT_FILE"
echo "   • Usuarios analizados: $TOTAL_USUARIOS" | tee -a "$REPORT_FILE"
echo "   • Usuarios con problemas: $usuarios_con_problemas" | tee -a "$REPORT_FILE"
echo "   • Usuarios sin problemas: $((TOTAL_USUARIOS - usuarios_con_problemas))" | tee -a "$REPORT_FILE"

if [ $usuarios_con_problemas -gt 0 ]; then
    porcentaje=$((usuarios_con_problemas * 100 / TOTAL_USUARIOS))
    echo "   • Porcentaje con problemas: $porcentaje%" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    echo "💡 RECOMENDACIÓN: Ejecutar auditoría completa" | tee -a "$REPORT_FILE"
else
    echo | tee -a "$REPORT_FILE"
    echo "🎉 EXCELENTE: Muestra sin problemas" | tee -a "$REPORT_FILE"
fi

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" 2>/dev/null || true

echo | tee -a "$REPORT_FILE"
echo -e "${GREEN}✅ AUDITORÍA SIMPLE COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN:${NC}"
echo "• Usuarios analizados: $TOTAL_USUARIOS"
echo "• Con problemas: $usuarios_con_problemas"
echo "• Estado: $([ $usuarios_con_problemas -eq 0 ] && echo "✅ PERFECTO" || echo "⚠️ REQUIERE ATENCIÓN")"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡AUDITORÍA SIMPLE COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"