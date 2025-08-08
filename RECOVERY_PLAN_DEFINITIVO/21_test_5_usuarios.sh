#!/bin/bash

# ============================================================================
# SCRIPT: Test con 5 usuarios específicos
# PROPÓSITO: Debuggear el problema paso a paso
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
REPORT_FILE="TEST_5_USUARIOS_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 TEST CON 5 USUARIOS ESPECÍFICOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando test con 5 usuarios..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

# Array de usuarios para probar
declare -a USUARIOS=(
    "21877460|sILVI-54|D2916D49BA4C467486C36891CEB37787|8"
    "22189733|Alefor|65156E0E660447778087C2E8FEAD56B1|7"
    "22835359|Igodoy|CB26A5C86FC24BC8A8F6D2B57F3C0845|6"
    "22901294|dagaferce07|05C23E2AC87146DAB317F0595CD223C8|7"
    "23520516|enriquehbravo|A67A16E2D2D14C1AA0DE4C9D6CEC5185|8"
)

# Contadores
USUARIOS_OK=0
USUARIOS_PROBLEMAS=0
USUARIOS_RECUPERABLES=0

# ============================================================================
# PROCESAR CADA USUARIO
# ============================================================================
echo -e "${BLUE}📊 PROCESANDO USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

contador=0
for usuario_data in "${USUARIOS[@]}"; do
    ((contador++))
    
    # Parsear datos del usuario
    IFS='|' read -r dni username uuid_hex total_docs_bd <<< "$usuario_data"
    
    echo -e "${YELLOW}🔍 [$contador/5] Procesando: $dni ($username)${NC}"
    echo "👤 Usuario: $dni ($username)" | tee -a "$REPORT_FILE"
    echo "   📊 Documentos en BD: $total_docs_bd" | tee -a "$REPORT_FILE"
    echo "   🆔 UUID HEX: $uuid_hex" | tee -a "$REPORT_FILE"
    
    # Formatear UUID
    if [ -n "$uuid_hex" ] && [ "$uuid_hex" != "NULL" ]; then
        FORMATTED_UUID=$(echo "$uuid_hex" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
        echo "   🆔 UUID formateado: $FORMATTED_UUID" | tee -a "$REPORT_FILE"
    else
        FORMATTED_UUID=""
        echo "   🆔 UUID formateado: No disponible" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar documents/
    USER_DOCS_DIR="$DOCKER_STORAGE/documents/$dni"
    echo "   📂 Verificando: $USER_DOCS_DIR" | tee -a "$REPORT_FILE"
    if [ -d "$USER_DOCS_DIR" ]; then
        docs_fisicos=$(find "$USER_DOCS_DIR" -type f 2>/dev/null | wc -l)
        echo "   📄 Documents físicos: $docs_fisicos" | tee -a "$REPORT_FILE"
        
        if [ $docs_fisicos -gt 0 ]; then
            echo "   📁 Archivos encontrados:" | tee -a "$REPORT_FILE"
            ls -la "$USER_DOCS_DIR" 2>/dev/null | tail -n +2 | head -2 | while read line; do
                echo "      $line" | tee -a "$REPORT_FILE"
            done
            if [ $docs_fisicos -gt 2 ]; then
                echo "      ... y $((docs_fisicos - 2)) más" | tee -a "$REPORT_FILE"
            fi
        fi
    else
        docs_fisicos=0
        echo "   📄 Documents físicos: 0 (directorio no existe)" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar CV documents
    cv_fisicos=0
    if [ -n "$FORMATTED_UUID" ]; then
        CV_DIR="$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID"
        echo "   📂 Verificando CV: $CV_DIR" | tee -a "$REPORT_FILE"
        if [ -d "$CV_DIR" ]; then
            cv_fisicos=$(find "$CV_DIR" -type f 2>/dev/null | wc -l)
            echo "   📝 CV Documents físicos: $cv_fisicos" | tee -a "$REPORT_FILE"
        else
            echo "   📝 CV Documents físicos: 0 (directorio no existe)" | tee -a "$REPORT_FILE"
        fi
    else
        echo "   📝 CV Documents: Omitido (sin UUID)" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar profile images
    img_fisicas=0
    if [ -n "$FORMATTED_UUID" ]; then
        IMG_DIR="$DOCKER_STORAGE/profile-images/$FORMATTED_UUID"
        echo "   📂 Verificando IMG: $IMG_DIR" | tee -a "$REPORT_FILE"
        if [ -d "$IMG_DIR" ]; then
            img_fisicas=$(find "$IMG_DIR" -type f 2>/dev/null | wc -l)
            echo "   🖼️  Profile Images físicas: $img_fisicas" | tee -a "$REPORT_FILE"
        else
            echo "   🖼️  Profile Images físicas: 0 (directorio no existe)" | tee -a "$REPORT_FILE"
        fi
    else
        echo "   🖼️  Profile Images: Omitido (sin UUID)" | tee -a "$REPORT_FILE"
    fi
    
    # Calcular totales
    total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
    diferencia=$((total_docs_bd - total_fisicos))
    
    echo "   📊 Total físicos: $total_fisicos" | tee -a "$REPORT_FILE"
    echo "   📊 Diferencia: $diferencia" | tee -a "$REPORT_FILE"
    
    # Determinar estado
    if [ $diferencia -eq 0 ]; then
        echo "   ✅ ESTADO: OK - Coinciden BD y físicos" | tee -a "$REPORT_FILE"
        ((USUARIOS_OK++))
    else
        echo "   ❌ ESTADO: PROBLEMA - Diferencia de $diferencia" | tee -a "$REPORT_FILE"
        ((USUARIOS_PROBLEMAS++))
        
        # Verificar recuperabilidad
        recuperable="NO"
        if [ -d "$BACKUPS_DIR" ] && [ $diferencia -gt 0 ]; then
            echo "   🔍 Verificando recuperabilidad..." | tee -a "$REPORT_FILE"
            for fecha in "04_agosto" "05_agosto" "06_agosto"; do
                docs_backup=""
                cv_backup=""
                img_backup=""
                
                if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ]; then
                    docs_backup="documents"
                fi
                if [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ]; then
                    cv_backup="cv-documents"
                fi
                if [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                    img_backup="profile-images"
                fi
                
                if [ -n "$docs_backup" ] || [ -n "$cv_backup" ] || [ -n "$img_backup" ]; then
                    recuperable="SI"
                    echo "   🔄 RECUPERABLE: Disponible en $fecha ($docs_backup $cv_backup $img_backup)" | tee -a "$REPORT_FILE"
                    ((USUARIOS_RECUPERABLES++))
                    break
                else
                    echo "   ❌ $fecha: No disponible" | tee -a "$REPORT_FILE"
                fi
            done
            
            if [ "$recuperable" = "NO" ]; then
                echo "   ⚠️  NO RECUPERABLE: Sin respaldos disponibles" | tee -a "$REPORT_FILE"
            fi
        else
            echo "   ⚠️  Verificación de recuperabilidad omitida" | tee -a "$REPORT_FILE"
        fi
    fi
    
    echo | tee -a "$REPORT_FILE"
done

# ============================================================================
# RESUMEN
# ============================================================================
echo -e "${BLUE}📊 RESUMEN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 RESULTADOS:" | tee -a "$REPORT_FILE"
echo "   • Total usuarios: 5" | tee -a "$REPORT_FILE"
echo "   • Sin problemas: $USUARIOS_OK" | tee -a "$REPORT_FILE"
echo "   • Con problemas: $USUARIOS_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Recuperables: $USUARIOS_RECUPERABLES" | tee -a "$REPORT_FILE"

porcentaje_problemas=$((USUARIOS_PROBLEMAS * 100 / 5))
porcentaje_recuperables=$((USUARIOS_RECUPERABLES * 100 / 5))

echo "   • % con problemas: $porcentaje_problemas%" | tee -a "$REPORT_FILE"
echo "   • % recuperables: $porcentaje_recuperables%" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"
echo -e "${GREEN}✅ TEST COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo "• Usuarios OK: $USUARIOS_OK/5"
echo "• Usuarios con problemas: $USUARIOS_PROBLEMAS/5"
echo "• Usuarios recuperables: $USUARIOS_RECUPERABLES/5"

if [ $USUARIOS_PROBLEMAS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODOS LOS USUARIOS ESTÁN OK!${NC}"
elif [ $USUARIOS_RECUPERABLES -eq $USUARIOS_PROBLEMAS ]; then
    echo -e "${YELLOW}⚡ TODOS LOS PROBLEMAS SON RECUPERABLES${NC}"
else
    echo -e "${RED}⚠️  ALGUNOS PROBLEMAS NO SON RECUPERABLES${NC}"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡TEST COMPLETADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"