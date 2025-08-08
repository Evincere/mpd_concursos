#!/bin/bash

# ============================================================================
# SCRIPT: Auditoría Integral de Documentos de Usuarios
# PROPÓSITO: Identificar discrepancias entre registros BD y archivos físicos
# FECHA: 2025-08-07
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="AUDITORIA_INTEGRAL_${TIMESTAMP}.txt"
PROBLEMAS_FILE="USUARIOS_CON_PROBLEMAS_${TIMESTAMP}.txt"
RECOVERY_SCRIPT="RECOVERY_BATCH_${TIMESTAMP}.sh"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 AUDITORÍA INTEGRAL DE DOCUMENTOS DE USUARIOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Iniciando auditoría integral de documentos..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo "Propósito: Identificar usuarios con registros BD sin archivos físicos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Variables globales
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"
MYSQL_CONTAINER="mpd-concursos-mysql"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# Contadores
TOTAL_USUARIOS=0
USUARIOS_CON_PROBLEMAS=0
USUARIOS_SIN_PROBLEMAS=0
TOTAL_DOCUMENTOS_BD=0
TOTAL_DOCUMENTOS_FISICOS=0
DOCUMENTOS_HUERFANOS=0

# Arrays para almacenar resultados
declare -a USUARIOS_PROBLEMATICOS
declare -a USUARIOS_RECUPERABLES

# ============================================================================
# 1. VERIFICAR PRERREQUISITOS
# ============================================================================
echo -e "${BLUE}📊 1. VERIFICANDO PRERREQUISITOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Verificar contenedor MySQL
if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo "❌ ERROR: Contenedor MySQL no está corriendo" | tee -a "$REPORT_FILE"
    exit 1
fi
echo "✅ Contenedor MySQL activo" | tee -a "$REPORT_FILE"

# Verificar volumen de storage
if [ ! -d "$DOCKER_STORAGE" ]; then
    echo "❌ ERROR: Volumen de storage no encontrado: $DOCKER_STORAGE" | tee -a "$REPORT_FILE"
    exit 1
fi
echo "✅ Volumen de storage accesible" | tee -a "$REPORT_FILE"

# Verificar respaldos
if [ ! -d "$BACKUPS_DIR" ]; then
    echo "⚠️  ADVERTENCIA: Directorio de respaldos no encontrado: $BACKUPS_DIR" | tee -a "$REPORT_FILE"
    echo "   La recuperación automática no estará disponible" | tee -a "$REPORT_FILE"
    BACKUPS_DISPONIBLES=false
else
    echo "✅ Respaldos disponibles para recuperación" | tee -a "$REPORT_FILE"
    BACKUPS_DISPONIBLES=true
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. OBTENER LISTA DE USUARIOS CON DOCUMENTOS EN BD
# ============================================================================
echo -e "${BLUE}📊 2. OBTENIENDO USUARIOS CON DOCUMENTOS EN BD:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Query para obtener usuarios con documentos
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

echo "🔍 Ejecutando consulta de usuarios con documentos..." | tee -a "$REPORT_FILE"

# Ejecutar query y procesar resultados
TEMP_USERS_FILE="/tmp/users_with_docs_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

if [ ! -s "$TEMP_USERS_FILE" ]; then
    echo "❌ ERROR: No se pudieron obtener usuarios con documentos" | tee -a "$REPORT_FILE"
    exit 1
fi

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Encontrados $TOTAL_USUARIOS usuarios con documentos en BD" | tee -a "$REPORT_FILE"

# Mostrar muestra de usuarios
echo "📋 Muestra de usuarios (primeros 5):" | tee -a "$REPORT_FILE"
head -5 "$TEMP_USERS_FILE" | while read line; do
    echo "   $line" | tee -a "$REPORT_FILE"
done

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. AUDITAR CADA USUARIO
# ============================================================================
echo -e "${BLUE}📊 3. AUDITANDO DOCUMENTOS POR USUARIO:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Inicializar archivo de problemas
echo "# USUARIOS CON PROBLEMAS DE DOCUMENTOS - $TIMESTAMP" > "$PROBLEMAS_FILE"
echo "# Formato: DNI|USERNAME|UUID|DOCS_BD|DOCS_FISICOS|ESTADO|RECUPERABLE" >> "$PROBLEMAS_FILE"
echo >> "$PROBLEMAS_FILE"

# Inicializar script de recuperación
echo "#!/bin/bash" > "$RECOVERY_SCRIPT"
echo "# Script de recuperación masiva generado automáticamente - $TIMESTAMP" >> "$RECOVERY_SCRIPT"
echo "set -e" >> "$RECOVERY_SCRIPT"
echo >> "$RECOVERY_SCRIPT"

contador=0
while IFS=$'\t' read -r dni username uuid_hex total_docs_bd; do
    ((contador++))
    echo -e "${YELLOW}🔍 [$contador/$TOTAL_USUARIOS] Auditando usuario: $dni ($username)${NC}"
    
    # Formatear UUID
    if [ -n "$uuid_hex" ] && [ "$uuid_hex" != "NULL" ]; then
        FORMATTED_UUID=$(echo "$uuid_hex" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
    else
        FORMATTED_UUID=""
    fi
    
    # Verificar archivos físicos en documents/
    USER_DOCS_DIR="$DOCKER_STORAGE/documents/$dni"
    if [ -d "$USER_DOCS_DIR" ]; then
        docs_fisicos=$(find "$USER_DOCS_DIR" -type f | wc -l)
    else
        docs_fisicos=0
    fi
    
    # Verificar CV documents
    cv_fisicos=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" ]; then
        cv_fisicos=$(find "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" -type f | wc -l)
    fi
    
    # Verificar profile images
    img_fisicas=0
    if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" ]; then
        img_fisicas=$(find "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" -type f | wc -l)
    fi
    
    total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
    
    # Determinar estado
    if [ "$total_docs_bd" -gt "$total_fisicos" ]; then
        # Hay más documentos en BD que físicos - PROBLEMA
        diferencia=$((total_docs_bd - total_fisicos))
        
        # Verificar si es recuperable desde respaldos
        recuperable="NO"
        if [ "$BACKUPS_DISPONIBLES" = true ]; then
            for fecha in "04_agosto" "05_agosto" "06_agosto"; do
                if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ] || 
                   [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                    recuperable="SI"
                    break
                fi
            done
        fi
        
        # Registrar problema
        echo "❌ PROBLEMA: $dni - BD:$total_docs_bd vs Físicos:$total_fisicos (Faltantes:$diferencia)" | tee -a "$REPORT_FILE"
        echo "$dni|$username|$FORMATTED_UUID|$total_docs_bd|$total_fisicos|FALTANTES_$diferencia|$recuperable" >> "$PROBLEMAS_FILE"
        
        USUARIOS_PROBLEMATICOS+=("$dni")
        ((USUARIOS_CON_PROBLEMAS++))
        
        # Agregar al script de recuperación si es recuperable
        if [ "$recuperable" = "SI" ]; then
            echo "echo \"🔄 Recuperando usuario $dni ($username)...\"" >> "$RECOVERY_SCRIPT"
            echo "./17_recuperar_usuario_especifico.sh \"$dni\" \"$username\"" >> "$RECOVERY_SCRIPT"
            echo "echo" >> "$RECOVERY_SCRIPT"
            USUARIOS_RECUPERABLES+=("$dni")
        fi
        
    elif [ "$total_docs_bd" -lt "$total_fisicos" ]; then
        # Hay más archivos físicos que registros en BD - HUÉRFANOS
        huerfanos=$((total_fisicos - total_docs_bd))
        echo "⚠️  HUÉRFANOS: $dni - BD:$total_docs_bd vs Físicos:$total_fisicos (Huérfanos:$huerfanos)" | tee -a "$REPORT_FILE"
        echo "$dni|$username|$FORMATTED_UUID|$total_docs_bd|$total_fisicos|HUERFANOS_$huerfanos|N/A" >> "$PROBLEMAS_FILE"
        DOCUMENTOS_HUERFANOS=$((DOCUMENTOS_HUERFANOS + huerfanos))
        ((USUARIOS_CON_PROBLEMAS++))
        
    else
        # Coinciden - OK
        echo "✅ OK: $dni - BD:$total_docs_bd = Físicos:$total_fisicos" | tee -a "$REPORT_FILE"
        ((USUARIOS_SIN_PROBLEMAS++))
    fi
    
    # Actualizar contadores globales
    TOTAL_DOCUMENTOS_BD=$((TOTAL_DOCUMENTOS_BD + total_docs_bd))
    TOTAL_DOCUMENTOS_FISICOS=$((TOTAL_DOCUMENTOS_FISICOS + total_fisicos))
    
    # Mostrar progreso cada 10 usuarios
    if [ $((contador % 10)) -eq 0 ]; then
        echo "   📊 Progreso: $contador/$TOTAL_USUARIOS usuarios procesados"
    fi
    
done < "$TEMP_USERS_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. ANÁLISIS DETALLADO DE DOCUMENTOS ESPECÍFICOS
# ============================================================================
echo -e "${BLUE}📊 4. ANÁLISIS DETALLADO DE DOCUMENTOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Analizando documentos específicos con problemas..." | tee -a "$REPORT_FILE"

# Query para obtener documentos específicos de usuarios problemáticos
if [ ${#USUARIOS_PROBLEMATICOS[@]} -gt 0 ]; then
    # Crear lista de DNIs problemáticos para la query
    dni_list=$(printf "'%s'," "${USUARIOS_PROBLEMATICOS[@]}")
    dni_list=${dni_list%,}  # Remover última coma
    
    DOCS_QUERY="
    SELECT 
        u.dni,
        HEX(d.id) as doc_id,
        d.file_name,
        d.file_path,
        dt.name as document_type,
        d.upload_date
    FROM user_entity u 
    INNER JOIN documents d ON d.user_id = u.id 
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    WHERE u.dni IN ($dni_list) AND d.is_archived = 0
    ORDER BY u.dni, d.upload_date;
    "
    
    TEMP_DOCS_FILE="/tmp/docs_problematicos_${TIMESTAMP}.txt"
    docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$DOCS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_DOCS_FILE"
    
    echo "📄 Documentos específicos con problemas:" | tee -a "$REPORT_FILE"
    
    current_dni=""
    while IFS=$'\t' read -r dni doc_id file_name file_path doc_type created_at; do
        if [ "$dni" != "$current_dni" ]; then
            echo "   👤 Usuario: $dni" | tee -a "$REPORT_FILE"
            current_dni="$dni"
        fi
        
        # Verificar si el archivo físico existe
        expected_path="$DOCKER_STORAGE/documents/$dni/$file_name"
        if [ -f "$expected_path" ]; then
            status="✅ EXISTE"
        else
            status="❌ FALTANTE"
        fi
        
        echo "      📄 $file_name ($doc_type) - $status" | tee -a "$REPORT_FILE"
        
    done < "$TEMP_DOCS_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. ESTADÍSTICAS FINALES
# ============================================================================
echo -e "${BLUE}📊 5. ESTADÍSTICAS FINALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📈 RESUMEN EJECUTIVO:" | tee -a "$REPORT_FILE"
echo "   • Total usuarios analizados: $TOTAL_USUARIOS" | tee -a "$REPORT_FILE"
echo "   • Usuarios sin problemas: $USUARIOS_SIN_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Usuarios con problemas: $USUARIOS_CON_PROBLEMAS" | tee -a "$REPORT_FILE"
echo "   • Usuarios recuperables: ${#USUARIOS_RECUPERABLES[@]}" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📊 DOCUMENTOS:" | tee -a "$REPORT_FILE"
echo "   • Total en BD: $TOTAL_DOCUMENTOS_BD" | tee -a "$REPORT_FILE"
echo "   • Total físicos: $TOTAL_DOCUMENTOS_FISICOS" | tee -a "$REPORT_FILE"
echo "   • Documentos faltantes: $((TOTAL_DOCUMENTOS_BD - TOTAL_DOCUMENTOS_FISICOS))" | tee -a "$REPORT_FILE"
echo "   • Documentos huérfanos: $DOCUMENTOS_HUERFANOS" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Calcular porcentajes
if [ $TOTAL_USUARIOS -gt 0 ]; then
    porcentaje_problemas=$((USUARIOS_CON_PROBLEMAS * 100 / TOTAL_USUARIOS))
    porcentaje_recuperables=$((${#USUARIOS_RECUPERABLES[@]} * 100 / TOTAL_USUARIOS))
    
    echo "📊 PORCENTAJES:" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con problemas: $porcentaje_problemas%" | tee -a "$REPORT_FILE"
    echo "   • Usuarios recuperables: $porcentaje_recuperables%" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. RECOMENDACIONES
# ============================================================================
echo -e "${BLUE}📊 6. RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "💡 ACCIONES RECOMENDADAS:" | tee -a "$REPORT_FILE"

if [ ${#USUARIOS_RECUPERABLES[@]} -gt 0 ]; then
    echo "1️⃣  RECUPERACIÓN AUTOMÁTICA:" | tee -a "$REPORT_FILE"
    echo "   • Ejecutar: chmod +x $RECOVERY_SCRIPT && ./$RECOVERY_SCRIPT" | tee -a "$REPORT_FILE"
    echo "   • Esto recuperará ${#USUARIOS_RECUPERABLES[@]} usuarios automáticamente" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
fi

if [ $USUARIOS_CON_PROBLEMAS -gt ${#USUARIOS_RECUPERABLES[@]} ]; then
    usuarios_no_recuperables=$((USUARIOS_CON_PROBLEMAS - ${#USUARIOS_RECUPERABLES[@]}))
    echo "2️⃣  USUARIOS NO RECUPERABLES:" | tee -a "$REPORT_FILE"
    echo "   • $usuarios_no_recuperables usuarios requieren atención manual" | tee -a "$REPORT_FILE"
    echo "   • Revisar archivo: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
fi

if [ $DOCUMENTOS_HUERFANOS -gt 0 ]; then
    echo "3️⃣  DOCUMENTOS HUÉRFANOS:" | tee -a "$REPORT_FILE"
    echo "   • $DOCUMENTOS_HUERFANOS archivos sin registro en BD" | tee -a "$REPORT_FILE"
    echo "   • Considerar limpieza o re-indexación" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
fi

echo "4️⃣  MONITOREO CONTINUO:" | tee -a "$REPORT_FILE"
echo "   • Ejecutar esta auditoría periódicamente" | tee -a "$REPORT_FILE"
echo "   • Implementar alertas automáticas" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 7. FINALIZACIÓN
# ============================================================================
echo -e "${BLUE}📊 7. ARCHIVOS GENERADOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📄 Archivos de salida:" | tee -a "$REPORT_FILE"
echo "   • Reporte completo: $REPORT_FILE" | tee -a "$REPORT_FILE"
echo "   • Lista de problemas: $PROBLEMAS_FILE" | tee -a "$REPORT_FILE"
if [ ${#USUARIOS_RECUPERABLES[@]} -gt 0 ]; then
    echo "   • Script de recuperación: $RECOVERY_SCRIPT" | tee -a "$REPORT_FILE"
    chmod +x "$RECOVERY_SCRIPT"
fi

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" "$TEMP_DOCS_FILE" 2>/dev/null || true

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ AUDITORÍA INTEGRAL COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte principal: $REPORT_FILE${NC}"
echo -e "${CYAN}📋 Lista de problemas: $PROBLEMAS_FILE${NC}"
if [ ${#USUARIOS_RECUPERABLES[@]} -gt 0 ]; then
    echo -e "${CYAN}🔧 Script de recuperación: $RECOVERY_SCRIPT${NC}"
fi

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo -e "${YELLOW}=====================${NC}"
echo "• Total usuarios: $TOTAL_USUARIOS"
echo "• Con problemas: $USUARIOS_CON_PROBLEMAS"
echo "• Recuperables: ${#USUARIOS_RECUPERABLES[@]}"
echo "• Documentos faltantes: $((TOTAL_DOCUMENTOS_BD - TOTAL_DOCUMENTOS_FISICOS))"

if [ $USUARIOS_CON_PROBLEMAS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡SISTEMA EN PERFECTO ESTADO!${NC}"
elif [ ${#USUARIOS_RECUPERABLES[@]} -eq $USUARIOS_CON_PROBLEMAS ]; then
    echo -e "${YELLOW}⚡ TODOS LOS PROBLEMAS SON RECUPERABLES${NC}"
    echo -e "${YELLOW}   Ejecutar: ./$RECOVERY_SCRIPT${NC}"
else
    echo -e "${RED}⚠️  REQUIERE ATENCIÓN MANUAL${NC}"
    echo -e "${RED}   Revisar: $PROBLEMAS_FILE${NC}"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡AUDITORÍA INTEGRAL COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"