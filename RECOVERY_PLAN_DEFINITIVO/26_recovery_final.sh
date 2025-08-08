#!/bin/bash

# ============================================================================
# SCRIPT: Recuperación Final - Sin Interacción
# PROPÓSITO: Recuperar documentos sin confirmaciones interactivas
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
LOG_FILE="RECOVERY_FINAL_${TIMESTAMP}.log"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔄 RECUPERACIÓN FINAL - SIN INTERACCIÓN${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔄 Iniciando recuperación final..." | tee "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
echo | tee -a "$LOG_FILE"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

# Lista de usuarios críticos para recuperar
USUARIOS=(
    "23520516"
    "23856207" 
    "24207375"
    "24467884"
    "24866484"
    "25793147"
    "26524903"
    "26569905"
    "26598410"
    "27544194"
    "28511308"
    "29267678"
    "30536058"
    "34785507"
    "38207799"
)

# Contadores
TOTAL_USUARIOS=${#USUARIOS[@]}
PROCESADOS=0
EXITOSOS=0
FALLIDOS=0

echo -e "${BLUE}📊 PROCESANDO $TOTAL_USUARIOS USUARIOS CRÍTICOS:${NC}" | tee -a "$LOG_FILE"
echo "===========================================" | tee -a "$LOG_FILE"

for dni in "${USUARIOS[@]}"; do
    ((PROCESADOS++))
    
    echo -e "${YELLOW}🔄 [$PROCESADOS/$TOTAL_USUARIOS] Usuario: $dni${NC}"
    echo "[$PROCESADOS/$TOTAL_USUARIOS] Usuario: $dni" | tee -a "$LOG_FILE"
    
    # Crear directorio de destino
    USER_TARGET_DIR="$DOCKER_STORAGE/documents/$dni"
    mkdir -p "$USER_TARGET_DIR"
    
    archivos_copiados=0
    usuario_exitoso=false
    
    # Buscar archivos en respaldos
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        SOURCE_DIR="$BACKUPS_DIR/$fecha/documents/$dni"
        
        if [ -d "$SOURCE_DIR" ]; then
            echo "   📅 Respaldo: $fecha" | tee -a "$LOG_FILE"
            
            # Contar archivos en origen
            archivos_origen=$(find "$SOURCE_DIR" -type f 2>/dev/null | wc -l)
            
            if [ $archivos_origen -gt 0 ]; then
                # Copiar archivos SIN confirmación interactiva
                if cp -rf "$SOURCE_DIR"/* "$USER_TARGET_DIR/" 2>/dev/null; then
                    archivos_copiados=$((archivos_copiados + archivos_origen))
                    echo "      ✅ Copiados: $archivos_origen archivos" | tee -a "$LOG_FILE"
                    usuario_exitoso=true
                else
                    echo "      ❌ Error copiando desde $fecha" | tee -a "$LOG_FILE"
                fi
            else
                echo "      ⚠️  Sin archivos en $fecha" | tee -a "$LOG_FILE"
            fi
        else
            echo "   ❌ No existe: $fecha" | tee -a "$LOG_FILE"
        fi
    done
    
    # Ajustar permisos
    chown -R root:root "$USER_TARGET_DIR" 2>/dev/null || true
    chmod -R 755 "$USER_TARGET_DIR" 2>/dev/null || true
    
    # Verificar resultado final
    archivos_finales=$(find "$USER_TARGET_DIR" -type f 2>/dev/null | wc -l)
    
    if [ $usuario_exitoso = true ] && [ $archivos_finales -gt 0 ]; then
        echo "   ✅ EXITOSO: $archivos_finales archivos totales" | tee -a "$LOG_FILE"
        ((EXITOSOS++))
    else
        echo "   ❌ FALLIDO: Sin archivos recuperados" | tee -a "$LOG_FILE"
        ((FALLIDOS++))
    fi
    
    echo | tee -a "$LOG_FILE"
    
    # Pausa breve entre usuarios
    sleep 1
done

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo -e "${BLUE}📊 RESUMEN FINAL:${NC}" | tee -a "$LOG_FILE"
echo "===========================================" | tee -a "$LOG_FILE"

echo "📈 ESTADÍSTICAS:" | tee -a "$LOG_FILE"
echo "   • Total usuarios procesados: $PROCESADOS" | tee -a "$LOG_FILE"
echo "   • Recuperaciones exitosas: $EXITOSOS" | tee -a "$LOG_FILE"
echo "   • Recuperaciones fallidas: $FALLIDOS" | tee -a "$LOG_FILE"

if [ $PROCESADOS -gt 0 ]; then
    porcentaje_exito=$((EXITOSOS * 100 / PROCESADOS))
    echo "   • Porcentaje de éxito: $porcentaje_exito%" | tee -a "$LOG_FILE"
fi

echo | tee -a "$LOG_FILE"

if [ $FALLIDOS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡RECUPERACIÓN COMPLETADA SIN ERRORES!${NC}" | tee -a "$LOG_FILE"
elif [ $EXITOSOS -gt $FALLIDOS ]; then
    echo -e "${YELLOW}⚡ RECUPERACIÓN MAYORMENTE EXITOSA${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}⚠️  RECUPERACIÓN CON PROBLEMAS${NC}" | tee -a "$LOG_FILE"
fi

echo | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ RECUPERACIÓN FINAL COMPLETADA${NC}"
echo -e "${CYAN}📄 Log detallado: $LOG_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo "• Procesados: $PROCESADOS/$TOTAL_USUARIOS"
echo "• Exitosos: $EXITOSOS"
echo "• Fallidos: $FALLIDOS"
if [ $PROCESADOS -gt 0 ]; then
    echo "• Éxito: $porcentaje_exito%"
fi

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡RECUPERACIÓN FINAL COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"