#!/bin/bash

# ============================================================================
# SCRIPT: Auditoría Definitiva de Documentos
# PROPÓSITO: Análisis completo y confiable de todos los usuarios
# FECHA: 2025-08-07
# ============================================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="AUDITORIA_DEFINITIVA_${TIMESTAMP}.txt"
PROBLEMAS_FILE="PROBLEMAS_DEFINITIVOS_${TIMESTAMP}.csv"
RECOVERY_FILE="RECOVERY_COMMANDS_${TIMESTAMP}.sh"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 AUDITORÍA DEFINITIVA DE DOCUMENTOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando auditoría definitiva..." | tee "$REPORT_FILE"
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
# 1. OBTENER TODOS LOS USUARIOS
# ============================================================================
echo -e "${BLUE}📊 1. OBTENIENDO USUARIOS:${NC}" | tee -a "$REPORT_FILE"
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

echo "🔍 Ejecutando consulta..." | tee -a "$REPORT_FILE"

TEMP_USERS_FILE="/tmp/definitiva_users_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

if [ ! -s "$TEMP_USERS_FILE" ]; then
    echo "❌ ERROR: No se pudieron obtener usuarios" | tee -a "$REPORT_FILE"
    exit 1
fi

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Encontrados $TOTAL_USUARIOS usuarios con documentos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Inicializar archivos de salida
echo "DNI,USERNAME,UUID,DOCS_BD,DOCS_FISICOS,CV_FISICOS,IMG_FISICAS,TOTAL_FISICOS,DIFERENCIA,ESTADO,RECUPERABLE" > "$PROBLEMAS_FILE"
echo "#!/bin/bash" > "$RECOVERY_FILE"
echo "# Comandos de recuperación generados automáticamente - $TIMESTAMP" >> "$RECOVERY_FILE"
echo "set -e" >> "$RECOVERY_FILE"
echo >> "$RECOVERY_FILE"

# ============================================================================
# 2. PROCESAR USUARIOS EN LOTES
# ============================================================================
echo -e "${BLUE}📊 2. PROCESANDO USUARIOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

contador=0
while IFS=$'\t' read -r dni username uuid_hex total_docs_bd; do
    ((contador++))
    
    # Mostrar progreso
    if [ $((contador % 50)) -eq 0 ] || [ $contador -eq 1 ]; then
        echo -e "${YELLOW}🔍 Progreso: $contador/$TOTAL_USUARIOS usuarios procesados${NC}"
        echo "📊 Progreso: $contador/$TOTAL_USUARIOS usuarios procesados" | tee -a "$REPORT_FILE"
    fi
    
    # Formatear UUID
    FORMATTED_UUID=""
    if [ -n "$uuid_hex" ] && [ "$uuid_hex" != "NULL" ]; then
        FORMATTED_UUID=$(echo "$uuid_hex" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
    fi
    
    # Verificar documents/
    docs_fisicos=0
    USER_DOCS_DIR="$DOCKER_STORAGE/documents/$dni"
    if [ -d "$USER_DOCS_DIR" ]; then
        docs_fisicos=$(find "$USER_DOCS_DIR" -type f 2>/dev/null | wc -l)
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
    
    # Calcular totales
    total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
    diferencia=$((total_docs_bd - total_fisicos))
    
    # Actualizar contadores globales
    TOTAL_DOCS_BD=$((TOTAL_DOCS_BD + total_docs_bd))
    TOTAL_DOCS_FISICOS=$((TOTAL_DOCS_FISICOS + total_fisicos))
    
    # Determinar estado
    if [ $diferencia -eq 0 ]; then
        ((USUARIOS_OK++))
    else
        ((USUARIOS_PROBLEMAS++))
        
        # Determinar tipo de problema
        if [ $diferencia -gt 0 ]; then
            estado="FALTANTES_$diferencia"
        else
            estado="HUERFANOS_${diferencia#-}"
        fi
        
        # Verificar recuperabilidad
        recuperable="NO"
        if [ -d "$BACKUPS_DIR" ] && [ $diferencia -gt 0 ]; then
            for fecha in "04_agosto" "05_agosto" "06_agosto"; do
                if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                    recuperable="SI"
                    ((USUARIOS_RECUPERABLES++))
                    echo "echo \"🔄 Recuperando $dni ($username)...\"" >> "$RECOVERY_FILE"
                    echo "./17_recuperar_usuario_especifico.sh \"$dni\" \"$username\"" >> "$RECOVERY_FILE"
                    echo >> "$RECOVERY_FILE"
                    break
                fi
            done
        fi
        
        # Registrar problema
        echo "$dni,$username,$FORMATTED_UUID,$total_docs_bd,$docs_fisicos,$cv_fisicos,$img_fisicas,$total_fisicos,$diferencia,$estado,$recuperable" >> "$PROBLEMAS_FILE"
    fi
    
done < "$TEMP_USERS_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. ESTADÍSTICAS FINALES
# ============================================================================
echo -e "${BLUE}📊 3. ESTADÍSTICAS FINALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 RESUMEN COMPLETO:" | tee -a "$REPORT_FILE"
echo "   • Total usuarios analizados: $TOTAL_USUARIOS" | tee -a "$REPORT_FILE"
echo "   • Usuarios sin problemas: $USUARIOS_OK" | tee -a "$REPORT_FILE"
echo "   • Usuarios con problemas: $USUARIOS_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Usuarios recuperables: $USUARIOS_RECUPERABLES" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📊 DOCUMENTOS:" | tee -a "$REPORT_FILE"
echo "   • Total registrados en BD: $TOTAL_DOCS_BD" | tee -a "$REPORT_FILE"
echo "   • Total archivos físicos: $TOTAL_DOCS_FISICOS" | tee -a "$REPORT_FILE"
echo "   • Documentos faltantes: $((TOTAL_DOCS_BD - TOTAL_DOCS_FISICOS))" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Calcular porcentajes
if [ $TOTAL_USUARIOS -gt 0 ]; then
    porcentaje_ok=$((USUARIOS_OK * 100 / TOTAL_USUARIOS))
    porcentaje_problemas=$((USUARIOS_PROBLEMAS * 100 / TOTAL_USUARIOS))
    porcentaje_recuperables=$((USUARIOS_RECUPERABLES * 100 / TOTAL_USUARIOS))
    
    echo "📊 PORCENTAJES:" | tee -a "$REPORT_FILE"
    echo "   • Sin problemas: $porcentaje_ok%" | tee -a "$REPORT_FILE"
    echo "   • Con problemas: $porcentaje_problemas%" | tee -a "$REPORT_FILE"
    echo "   • Recuperables: $porcentaje_recuperables%" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. ANÁLISIS DE PROBLEMAS
# ============================================================================
if [ $USUARIOS_PROBLEMAS -gt 0 ]; then
    echo -e "${BLUE}📊 4. ANÁLISIS DE PROBLEMAS:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Contar tipos de problemas
    faltantes=$(grep -c "FALTANTES" "$PROBLEMAS_FILE" 2>/dev/null || echo "0")
    huerfanos=$(grep -c "HUERFANOS" "$PROBLEMAS_FILE" 2>/dev/null || echo "0")
    
    echo "🔍 TIPOS DE PROBLEMAS:" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentos faltantes: $faltantes" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentos huérfanos: $huerfanos" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Mostrar casos más críticos
    echo "🚨 CASOS MÁS CRÍTICOS (Top 10):" | tee -a "$REPORT_FILE"
    tail -n +2 "$PROBLEMAS_FILE" | grep "FALTANTES" | sort -t',' -k9 -nr | head -10 | while IFS=',' read -r dni username uuid docs_bd docs_fis cv_fis img_fis total_fis diff estado recup; do
        echo "   • $dni ($username): $diff documentos faltantes - Recuperable: $recup" | tee -a "$REPORT_FILE"
    done
    
    echo | tee -a "$REPORT_FILE"
fi

# ============================================================================
# 5. RECOMENDACIONES
# ============================================================================
echo -e "${BLUE}📊 5. RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "💡 PLAN DE ACCIÓN:" | tee -a "$REPORT_FILE"

if [ $USUARIOS_PROBLEMAS -eq 0 ]; then
    echo "🎉 EXCELENTE: Sistema en perfecto estado" | tee -a "$REPORT_FILE"
    echo "   • No se requieren acciones correctivas" | tee -a "$REPORT_FILE"
elif [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo "1️⃣  RECUPERACIÓN AUTOMÁTICA:" | tee -a "$REPORT_FILE"
    echo "   • Ejecutar: chmod +x $RECOVERY_FILE && ./$RECOVERY_FILE" | tee -a "$REPORT_FILE"
    echo "   • Esto recuperará $USUARIOS_RECUPERABLES usuarios automáticamente" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    if [ $USUARIOS_RECUPERABLES -lt $USUARIOS_PROBLEMAS ]; then
        no_recuperables=$((USUARIOS_PROBLEMAS - USUARIOS_RECUPERABLES))
        echo "2️⃣  CASOS MANUALES:" | tee -a "$REPORT_FILE"
        echo "   • $no_recuperables usuarios requieren atención manual" | tee -a "$REPORT_FILE"
        echo "   • Revisar archivo: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
    fi
else
    echo "⚠️  ATENCIÓN MANUAL REQUERIDA:" | tee -a "$REPORT_FILE"
    echo "   • Todos los $USUARIOS_PROBLEMAS usuarios requieren revisión manual" | tee -a "$REPORT_FILE"
    echo "   • Revisar archivo: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. ARCHIVOS GENERADOS
# ============================================================================
echo -e "${BLUE}📊 6. ARCHIVOS GENERADOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📄 Archivos de salida:" | tee -a "$REPORT_FILE"
echo "   • Reporte completo: $REPORT_FILE" | tee -a "$REPORT_FILE"
echo "   • Lista de problemas: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
if [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo "   • Script de recuperación: $RECOVERY_FILE" | tee -a "$REPORT_FILE"
    chmod +x "$RECOVERY_FILE"
fi

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" 2>/dev/null || true

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ AUDITORÍA DEFINITIVA COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte completo: $REPORT_FILE${NC}"
echo -e "${CYAN}📋 Lista de problemas: $PROBLEMAS_FILE${NC}"
if [ $USUARIOS_RECUPERABLES -gt 0 ]; then
    echo -e "${CYAN}🔧 Script de recuperación: $RECOVERY_FILE${NC}"
fi

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO FINAL:${NC}"
echo -e "${YELLOW}=============================${NC}"
echo "• Total usuarios: $TOTAL_USUARIOS"
echo "• Sin problemas: $USUARIOS_OK ($porcentaje_ok%)"
echo "• Con problemas: $USUARIOS_PROBLEMAS ($porcentaje_problemas%)"
echo "• Recuperables: $USUARIOS_RECUPERABLES ($porcentaje_recuperables%)"
echo "• Documentos faltantes: $((TOTAL_DOCS_BD - TOTAL_DOCS_FISICOS))"

if [ $USUARIOS_PROBLEMAS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡SISTEMA PERFECTO!${NC}"
elif [ $USUARIOS_RECUPERABLES -eq $USUARIOS_PROBLEMAS ]; then
    echo -e "${YELLOW}⚡ TODOS LOS PROBLEMAS SON RECUPERABLES${NC}"
    echo -e "${YELLOW}   Ejecutar: ./$RECOVERY_FILE${NC}"
else
    echo -e "${RED}⚠️  SITUACIÓN MIXTA${NC}"
    echo -e "${RED}   Recuperables: $USUARIOS_RECUPERABLES${NC}"
    echo -e "${RED}   Manuales: $((USUARIOS_PROBLEMAS - USUARIOS_RECUPERABLES))${NC}"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡AUDITORÍA DEFINITIVA COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"