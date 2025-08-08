#!/bin/bash

# ============================================================================
# SCRIPT: Auditoría de Muestra - 20 usuarios
# PROPÓSITO: Identificar patrones en una muestra pequeña
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
REPORT_FILE="AUDITORIA_MUESTRA_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 AUDITORÍA DE MUESTRA - 20 USUARIOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando auditoría de muestra..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"
MYSQL_CONTAINER="mpd-concursos-mysql"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# Contadores
USUARIOS_OK=0
USUARIOS_PROBLEMAS=0
USUARIOS_RECUPERABLES=0

# ============================================================================
# 1. OBTENER MUESTRA DE 20 USUARIOS
# ============================================================================
echo -e "${BLUE}📊 1. OBTENIENDO MUESTRA DE USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

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
LIMIT 20;
"

echo "🔍 Ejecutando consulta de muestra..." | tee -a "$REPORT_FILE"

TEMP_USERS_FILE="/tmp/sample_users_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Obtenidos $TOTAL_USUARIOS usuarios de muestra" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. AUDITAR CADA USUARIO
# ============================================================================
echo -e "${BLUE}📊 2. AUDITANDO USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

contador=0
while IFS=$'\t' read -r dni username uuid_hex total_docs_bd; do
    ((contador++))
    echo -e "${YELLOW}🔍 [$contador/$TOTAL_USUARIOS] $dni ($username)${NC}"
    echo "👤 Usuario: $dni ($username)" | tee -a "$REPORT_FILE"
    echo "   📊 Documentos en BD: $total_docs_bd" | tee -a "$REPORT_FILE"
    
    # Formatear UUID si existe
    if [ -n "$uuid_hex" ] && [ "$uuid_hex" != "NULL" ]; then
        FORMATTED_UUID=$(echo "$uuid_hex" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
    else
        FORMATTED_UUID=""
    fi
    
    # Verificar archivos físicos
    USER_DOCS_DIR="$DOCKER_STORAGE/documents/$dni"
    if [ -d "$USER_DOCS_DIR" ]; then
        docs_fisicos=$(find "$USER_DOCS_DIR" -type f 2>/dev/null | wc -l)
    else
        docs_fisicos=0
    fi
    
    # Verificar CV documents
    cv_fisicos=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" ]; then
        cv_fisicos=$(find "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" -type f 2>/dev/null | wc -l)
    fi
    
    # Verificar profile images
    img_fisicas=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" ]; then
        img_fisicas=$(find "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" -type f 2>/dev/null | wc -l)
    fi
    
    total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
    diferencia=$((total_docs_bd - total_fisicos))
    
    echo "   📄 Físicos: docs=$docs_fisicos, cv=$cv_fisicos, img=$img_fisicas (total=$total_fisicos)" | tee -a "$REPORT_FILE"
    echo "   📊 Diferencia: $diferencia" | tee -a "$REPORT_FILE"
    
    # Determinar estado
    if [ $diferencia -eq 0 ]; then
        echo "   ✅ OK: Coinciden BD y físicos" | tee -a "$REPORT_FILE"
        ((USUARIOS_OK++))
    else
        echo "   ❌ PROBLEMA: Diferencia de $diferencia" | tee -a "$REPORT_FILE"
        ((USUARIOS_PROBLEMAS++))
        
        # Verificar si es recuperable
        recuperable="NO"
        if [ -d "$BACKUPS_DIR" ] && [ $diferencia -gt 0 ]; then
            for fecha in "04_agosto" "05_agosto" "06_agosto"; do
                if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                    recuperable="SI"
                    ((USUARIOS_RECUPERABLES++))
                    echo "   🔄 RECUPERABLE: Disponible en respaldos" | tee -a "$REPORT_FILE"
                    break
                fi
            done
            
            if [ "$recuperable" = "NO" ]; then
                echo "   ⚠️  NO RECUPERABLE: Sin respaldos disponibles" | tee -a "$REPORT_FILE"
            fi
        fi
    fi
    
    echo | tee -a "$REPORT_FILE"
    
done < "$TEMP_USERS_FILE"

# ============================================================================
# 3. RESUMEN DE MUESTRA
# ============================================================================
echo -e "${BLUE}📊 3. RESUMEN DE MUESTRA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 RESULTADOS DE MUESTRA:" | tee -a "$REPORT_FILE"
echo "   • Total usuarios: $TOTAL_USUARIOS" | tee -a "$REPORT_FILE"
echo "   • Sin problemas: $USUARIOS_OK" | tee -a "$REPORT_FILE"
echo "   • Con problemas: $USUARIOS_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Recuperables: $USUARIOS_RECUPERABLES" | tee -a "$REPORT_FILE"

if [ $TOTAL_USUARIOS -gt 0 ]; then
    porcentaje_problemas=$((USUARIOS_PROBLEMAS * 100 / TOTAL_USUARIOS))
    porcentaje_recuperables=$((USUARIOS_RECUPERABLES * 100 / TOTAL_USUARIOS))
    
    echo "   • % con problemas: $porcentaje_problemas%" | tee -a "$REPORT_FILE"
    echo "   • % recuperables: $porcentaje_recuperables%" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. PROYECCIÓN PARA TODOS LOS USUARIOS
# ============================================================================
echo -e "${BLUE}📊 4. PROYECCIÓN TOTAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Obtener total de usuarios en el sistema
TOTAL_QUERY="
SELECT COUNT(DISTINCT u.dni) as total
FROM user_entity u 
INNER JOIN documents d ON d.user_id = u.id 
WHERE d.is_archived = 0;
"

TOTAL_SISTEMA=$(docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$TOTAL_QUERY" 2>/dev/null | tail -n +2)

echo "📊 PROYECCIÓN BASADA EN MUESTRA:" | tee -a "$REPORT_FILE"
echo "   • Total usuarios en sistema: $TOTAL_SISTEMA" | tee -a "$REPORT_FILE"

if [ $TOTAL_USUARIOS -gt 0 ] && [ $TOTAL_SISTEMA -gt 0 ]; then
    proyeccion_problemas=$((USUARIOS_PROBLEMAS * TOTAL_SISTEMA / TOTAL_USUARIOS))
    proyeccion_recuperables=$((USUARIOS_RECUPERABLES * TOTAL_SISTEMA / TOTAL_USUARIOS))
    
    echo "   • Usuarios con problemas estimados: ~$proyeccion_problemas" | tee -a "$REPORT_FILE"
    echo "   • Usuarios recuperables estimados: ~$proyeccion_recuperables" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. RECOMENDACIONES
# ============================================================================
echo -e "${BLUE}📊 5. RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "💡 PRÓXIMOS PASOS:" | tee -a "$REPORT_FILE"

if [ $USUARIOS_PROBLEMAS -eq 0 ]; then
    echo "🎉 EXCELENTE: La muestra no presenta problemas" | tee -a "$REPORT_FILE"
    echo "   • Considerar ejecutar auditoría completa para confirmar" | tee -a "$REPORT_FILE"
elif [ $USUARIOS_RECUPERABLES -eq $USUARIOS_PROBLEMAS ]; then
    echo "⚡ BUENAS NOTICIAS: Todos los problemas son recuperables" | tee -a "$REPORT_FILE"
    echo "   • Proceder con recuperación masiva usando respaldos" | tee -a "$REPORT_FILE"
else
    echo "⚠️  SITUACIÓN MIXTA: Algunos problemas son recuperables" | tee -a "$REPORT_FILE"
    echo "   • Recuperar usuarios disponibles en respaldos" | tee -a "$REPORT_FILE"
    echo "   • Investigar casos no recuperables individualmente" | tee -a "$REPORT_FILE"
fi

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" 2>/dev/null || true

echo | tee -a "$REPORT_FILE"
echo -e "${GREEN}✅ AUDITORÍA DE MUESTRA COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN:${NC}"
echo "• Muestra: $TOTAL_USUARIOS usuarios"
echo "• Problemas: $USUARIOS_PROBLEMAS"
echo "• Recuperables: $USUARIOS_RECUPERABLES"
echo "• Proyección total problemas: ~$proyeccion_problemas"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡AUDITORÍA DE MUESTRA COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"