#!/bin/bash

# ============================================================================
# SCRIPT: Recuperación Directa
# PROPÓSITO: Recuperar documentos de forma directa sin scripts complejos
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
LOG_FILE="RECOVERY_DIRECTO_${TIMESTAMP}.log"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔄 RECUPERACIÓN DIRECTA DE DOCUMENTOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔄 Iniciando recuperación directa..." | tee "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
echo | tee -a "$LOG_FILE"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

# Lista de usuarios para recuperar (primeros 10 más críticos)
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
)

# Contadores
TOTAL_USUARIOS=${#USUARIOS[@]}
PROCESADOS=0
EXITOSOS=0
FALLIDOS=0

echo -e "${BLUE}📊 PROCESANDO $TOTAL_USUARIOS USUARIOS:${NC}" | tee -a "$LOG_FILE"
echo "===========================================" | tee -a "$LOG_FILE"

for dni in "${USUARIOS[@]}"; do
    ((PROCESADOS++))
    
    echo -e "${YELLOW}🔄 [$PROCESADOS/$TOTAL_USUARIOS] Procesando usuario: $dni${NC}"
    echo "[$PROCESADOS/$TOTAL_USUARIOS] Procesando usuario: $dni" | tee -a "$LOG_FILE"
    
    # Crear directorio de destino
    USER_TARGET_DIR="$DOCKER_STORAGE/documents/$dni"
    mkdir -p "$USER_TARGET_DIR"
    
    archivos_copiados=0
    
    # Buscar archivos en respaldos
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        SOURCE_DIR="$BACKUPS_DIR/$fecha/documents/$dni"
        
        if [ -d "$SOURCE_DIR" ]; then
            echo "   📅 Procesando respaldo: $fecha" | tee -a "$LOG_FILE"
            
            # Copiar archivos
            for archivo in "$SOURCE_DIR"/*; do
                if [ -f "$archivo" ]; then
                    nombre_archivo=$(basename "$archivo")
                    destino="$USER_TARGET_DIR/$nombre_archivo"
                    
                    # Solo copiar si no existe o es más reciente
                    if [ ! -f "$destino" ] || [ "$archivo" -nt "$destino" ]; then
                        if cp "$archivo" "$destino" 2>/dev/null; then
                            ((archivos_copiados++))
                            echo "      ✅ Copiado: $nombre_archivo" | tee -a "$LOG_FILE"
                        else
                            echo "      ❌ Error copiando: $nombre_archivo" | tee -a "$LOG_FILE"
                        fi
                    else
                        echo "      ⏭️  Ya existe: $nombre_archivo" | tee -a "$LOG_FILE"
                    fi
                fi
            done
        fi
    done
    
    # Ajustar permisos
    chown -R root:root "$USER_TARGET_DIR" 2>/dev/null || true
    chmod -R 755 "$USER_TARGET_DIR" 2>/dev/null || true
    
    # Verificar resultado
    archivos_finales=$(find "$USER_TARGET_DIR" -type f 2>/dev/null | wc -l)
    
    if [ $archivos_copiados -gt 0 ] || [ $archivos_finales -gt 0 ]; then
        echo "   ✅ EXITOSO: $dni ($archivos_finales archivos totales, $archivos_copiados nuevos)" | tee -a "$LOG_FILE"
        ((EXITOSOS++))
    else
        echo "   ❌ FALLIDO: $dni (sin archivos recuperados)" | tee -a "$LOG_FILE"
        ((FALLIDOS++))
    fi
    
    echo | tee -a "$LOG_FILE"
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
echo -e "${GREEN}✅ RECUPERACIÓN DIRECTA COMPLETADA${NC}"
echo -e "${CYAN}📄 Log detallado: $LOG_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo "• Procesados: $PROCESADOS/$TOTAL_USUARIOS"
echo "• Exitosos: $EXITOSOS"
echo "• Fallidos: $FALLIDOS"
echo "• Éxito: $porcentaje_exito%"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡RECUPERACIÓN DIRECTA COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"