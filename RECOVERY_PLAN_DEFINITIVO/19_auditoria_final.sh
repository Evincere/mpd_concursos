#!/bin/bash

# ============================================================================
# SCRIPT: Auditoría Final de Documentos - Versión Robusta
# PROPÓSITO: Identificar todos los usuarios con problemas de documentos
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
REPORT_FILE="AUDITORIA_FINAL_${TIMESTAMP}.txt"
PROBLEMAS_FILE="USUARIOS_PROBLEMATICOS_${TIMESTAMP}.csv"
RECUPERABLES_FILE="USUARIOS_RECUPERABLES_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 AUDITORÍA FINAL DE DOCUMENTOS - VERSIÓN COMPLETA${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando auditoría final completa..." | tee "$REPORT_FILE"
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
TOTAL_USUARIOS=0
USUARIOS_OK=0
USUARIOS_PROBLEMAS=0
USUARIOS_RECUPERABLES=0
TOTAL_DOCS_BD=0
TOTAL_DOCS_FISICOS=0

# ============================================================================
# 1. OBTENER TODOS LOS USUARIOS CON DOCUMENTOS
# ============================================================================
echo -e "${BLUE}📊 1. OBTENIENDO USUARIOS CON DOCUMENTOS:${NC}" | tee -a "$REPORT_FILE"
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
ORDER BY u.dni;
"

echo "🔍 Ejecutando consulta completa..." | tee -a "$REPORT_FILE"

TEMP_USERS_FILE="/tmp/all_users_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

if [ ! -s "$TEMP_USERS_FILE" ]; then
    echo "❌ ERROR: No se pudieron obtener usuarios" | tee -a "$REPORT_FILE"
    exit 1
fi

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Encontrados $TOTAL_USUARIOS usuarios con documentos en BD" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Inicializar archivos de salida
echo "DNI,USERNAME,UUID,DOCS_BD,DOCS_FISICOS,CV_FISICOS,IMG_FISICAS,TOTAL_FISICOS,DIFERENCIA,ESTADO,RECUPERABLE" > "$PROBLEMAS_FILE"
echo "# USUARIOS RECUPERABLES - $TIMESTAMP" > "$RECUPERABLES_FILE"
echo "# Formato: ./17_recuperar_usuario_especifico.sh DNI USERNAME" >> "$RECUPERABLES_FILE"
echo >> "$RECUPERABLES_FILE"

# ============================================================================
# 2. AUDITAR TODOS LOS USUARIOS
# ============================================================================
echo -e "${BLUE}📊 2. AUDITANDO TODOS LOS USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

contador=0
while IFS=$'\t' read -r dni username uuid_hex total_docs_bd; do
    ((contador++))
    
    # Mostrar progreso cada 25 usuarios
    if [ $((contador % 25)) -eq 0 ] || [ $contador -eq 1 ]; then
        echo -e "${YELLOW}🔍 Progreso: $contador/$TOTAL_USUARIOS usuarios procesados${NC}"
    fi
    
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
    
    # Actualizar contadores globales
    TOTAL_DOCS_BD=$((TOTAL_DOCS_BD + total_docs_bd))
    TOTAL_DOCS_FISICOS=$((TOTAL_DOCS_FISICOS + total_fisicos))
    
    # Determinar estado y recuperabilidad
    if [ $diferencia -ne 0 ]; then
        # Hay problemas
        ((USUARIOS_PROBLEMAS++))
        
        if [ $diferencia -gt 0 ]; then
            estado="FALTANTES_$diferencia"
        else
            estado="HUERFANOS_${diferencia#-}"
        fi
        
        # Verificar si es recuperable desde respaldos
        recuperable="NO"
        if [ -d "$BACKUPS_DIR" ] && [ $diferencia -gt 0 ]; then
            for fecha in "04_agosto" "05_agosto" "06_agosto"; do
                if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                    recuperable="SI"
                    ((USUARIOS_RECUPERABLES++))
                    echo "./17_recuperar_usuario_especifico.sh \"$dni\" \"$username\"" >> "$RECUPERABLES_FILE"
                    break
                fi
            done
        fi
        
        # Registrar en archivo de problemas
        echo "$dni,$username,$FORMATTED_UUID,$total_docs_bd,$docs_fisicos,$cv_fisicos,$img_fisicas,$total_fisicos,$diferencia,$estado,$recuperable" >> "$PROBLEMAS_FILE"
        
    else
        # Sin problemas
        ((USUARIOS_OK++))
    fi
    
done < "$TEMP_USERS_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. ESTADÍSTICAS DETALLADAS
# ============================================================================
echo -e "${BLUE}📊 3. ESTADÍSTICAS DETALLADAS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 USUARIOS:" | tee -a "$REPORT_FILE"
echo "   • Total analizados: $TOTAL_USUARIOS" | tee -a "$REPORT_FILE"
echo "   • Sin problemas: $USUARIOS_OK" | tee -a "$REPORT_FILE"
echo "   • Con problemas: $USUARIOS_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Recuperables: $USUARIOS_RECUPERABLES" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📊 DOCUMENTOS:" | tee -a "$REPORT_FILE"
echo "   • Total en BD: $TOTAL_DOCS_BD" | tee -a "$REPORT_FILE"
echo "   • Total físicos: $TOTAL_DOCS_FISICOS" | tee -a "$REPORT_FILE"
echo "   • Diferencia: $((TOTAL_DOCS_BD - TOTAL_DOCS_FISICOS))" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Calcular porcentajes
if [ $TOTAL_USUARIOS -gt 0 ]; then
    porcentaje_problemas=$((USUARIOS_PROBLEMAS * 100 / TOTAL_USUARIOS))
    porcentaje_recuperables=$((USUARIOS_RECUPERABLES * 100 / TOTAL_USUARIOS))
    porcentaje_ok=$((USUARIOS_OK * 100 / TOTAL_USUARIOS))
    
    echo "📊 PORCENTAJES:" | tee -a "$REPORT_FILE"
    echo "   • Sin problemas: $porcentaje_ok%" | tee -a "$REPORT_FILE"
    echo "   • Con problemas: $porcentaje_problemas%" | tee -a "$REPORT_FILE"
    echo "   • Recuperables: $porcentaje_recuperables%" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. ANÁLISIS DE PROBLEMAS MÁS COMUNES
# ============================================================================
echo -e "${BLUE}📊 4. ANÁLISIS DE PROBLEMAS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ $USUARIOS_PROBLEMAS -gt 0 ]; then
    echo "🔍 Analizando tipos de problemas..." | tee -a "$REPORT_FILE"
    
    # Contar usuarios con documentos faltantes
    faltantes=$(grep "FALTANTES" "$PROBLEMAS_FILE" | wc -l)
    huerfanos=$(grep "HUERFANOS" "$PROBLEMAS_FILE" | wc -l)
    
    echo "   • Usuarios con documentos faltantes: $faltantes" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentos huérfanos: $huerfanos" | tee -a "$REPORT_FILE"
    
    # Mostrar los 5 casos más críticos (más documentos faltantes)
    echo | tee -a "$REPORT_FILE"
    echo "🚨 TOP 5 CASOS MÁS CRÍTICOS:" | tee -a "$REPORT_FILE"
    tail -n +2 "$PROBLEMAS_FILE" | grep "FALTANTES" | sort -t',' -k9 -nr | head -5 | while IFS=',' read -r dni username uuid docs_bd docs_fis cv_fis img_fis total_fis diff estado recup; do
        echo "   • $dni ($username): $diff documentos faltantes" | tee -a "$REPORT_FILE"
    done
else
    echo "🎉 ¡EXCELENTE! No se encontraron problemas" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. RECOMENDACIONES Y PRÓXIMOS PASOS
# ============================================================================
echo -e "${BLUE}📊 5. RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "💡 ACCIONES RECOMENDADAS:" | tee -a "$REPORT_FILE"

if [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo "1️⃣  RECUPERACIÓN AUTOMÁTICA:" | tee -a "$REPORT_FILE"
    echo "   • Ejecutar comandos del archivo: $RECUPERABLES_FILE" | tee -a "$REPORT_FILE"
    echo "   • Esto recuperará $USUARIOS_RECUPERABLES usuarios automáticamente" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
fi

if [ $USUARIOS_PROBLEMAS -gt $USUARIOS_RECUPERABLES ]; then
    no_recuperables=$((USUARIOS_PROBLEMAS - USUARIOS_RECUPERABLES))
    echo "2️⃣  CASOS NO RECUPERABLES:" | tee -a "$REPORT_FILE"
    echo "   • $no_recuperables usuarios requieren atención manual" | tee -a "$REPORT_FILE"
    echo "   • Revisar archivo detallado: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
fi

echo "3️⃣  MONITOREO:" | tee -a "$REPORT_FILE"
echo "   • Ejecutar esta auditoría periódicamente" | tee -a "$REPORT_FILE"
echo "   • Implementar alertas para nuevos problemas" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. ARCHIVOS GENERADOS
# ============================================================================
echo -e "${BLUE}📊 6. ARCHIVOS GENERADOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📄 Archivos de salida:" | tee -a "$REPORT_FILE"
echo "   • Reporte completo: $REPORT_FILE" | tee -a "$REPORT_FILE"
echo "   • Lista detallada de problemas: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
if [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo "   • Comandos de recuperación: $RECUPERABLES_FILE" | tee -a "$REPORT_FILE"
    chmod +x "$RECUPERABLES_FILE"
fi

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" 2>/dev/null || true

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ AUDITORÍA FINAL COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte completo: $REPORT_FILE${NC}"
echo -e "${CYAN}📋 Problemas detallados: $PROBLEMAS_FILE${NC}"
if [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo -e "${CYAN}🔧 Comandos de recuperación: $RECUPERABLES_FILE${NC}"
fi

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo -e "${YELLOW}=====================${NC}"
echo "• Total usuarios: $TOTAL_USUARIOS"
echo "• Sin problemas: $USUARIOS_OK ($porcentaje_ok%)"
echo "• Con problemas: $USUARIOS_PROBLEMAS ($porcentaje_problemas%)"
echo "• Recuperables: $USUARIOS_RECUPERABLES ($porcentaje_recuperables%)"
echo "• Documentos faltantes: $((TOTAL_DOCS_BD - TOTAL_DOCS_FISICOS))"

if [ $USUARIOS_PROBLEMAS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡SISTEMA EN PERFECTO ESTADO!${NC}"
elif [ $USUARIOS_RECUPERABLES -eq $USUARIOS_PROBLEMAS ]; then
    echo -e "${YELLOW}⚡ TODOS LOS PROBLEMAS SON RECUPERABLES${NC}"
    echo -e "${YELLOW}   Revisar: $RECUPERABLES_FILE${NC}"
else
    echo -e "${RED}⚠️  REQUIERE ATENCIÓN MIXTA${NC}"
    echo -e "${RED}   Recuperables: $USUARIOS_RECUPERABLES${NC}"
    echo -e "${RED}   Manuales: $((USUARIOS_PROBLEMAS - USUARIOS_RECUPERABLES))${NC}"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡AUDITORÍA FINAL COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"