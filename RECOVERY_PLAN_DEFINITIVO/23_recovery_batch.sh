#!/bin/bash

# ============================================================================
# SCRIPT: Recuperación en Lotes
# PROPÓSITO: Procesar usuarios de forma controlada en lotes pequeños
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
LOG_FILE="RECOVERY_BATCH_${TIMESTAMP}.log"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔄 RECUPERACIÓN EN LOTES CONTROLADOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔄 Iniciando recuperación en lotes..." | tee "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
echo | tee -a "$LOG_FILE"

# Verificar que el script de recuperación existe
RECOVERY_SCRIPT="RECOVERY_COMMANDS_20250807_051617.sh"
if [ ! -f "$RECOVERY_SCRIPT" ]; then
    echo "❌ ERROR: Script de recuperación no encontrado: $RECOVERY_SCRIPT" | tee -a "$LOG_FILE"
    exit 1
fi

# Extraer comandos de recuperación (solo las líneas con ./17_recuperar_usuario_especifico.sh)
grep "^./17_recuperar_usuario_especifico.sh" "$RECOVERY_SCRIPT" > temp_recovery_commands.txt

TOTAL_USUARIOS=$(wc -l < temp_recovery_commands.txt)
echo "✅ Encontrados $TOTAL_USUARIOS usuarios para recuperar" | tee -a "$LOG_FILE"

# Contadores
PROCESADOS=0
EXITOSOS=0
FALLIDOS=0
LOTE_SIZE=5

echo | tee -a "$LOG_FILE"
echo -e "${BLUE}📊 PROCESANDO EN LOTES DE $LOTE_SIZE USUARIOS:${NC}" | tee -a "$LOG_FILE"
echo "===========================================" | tee -a "$LOG_FILE"

# Procesar en lotes
lote_actual=1
while IFS= read -r comando; do
    ((PROCESADOS++))
    
    # Extraer DNI y nombre del comando
    DNI=$(echo "$comando" | sed 's/.*"\([0-9]*\)".*/\1/')
    NOMBRE=$(echo "$comando" | sed 's/.*"[0-9]*" "\([^"]*\)".*/\1/')
    
    echo -e "${YELLOW}🔄 [$PROCESADOS/$TOTAL_USUARIOS] Procesando: $DNI ($NOMBRE)${NC}"
    echo "[$PROCESADOS/$TOTAL_USUARIOS] Procesando: $DNI ($NOMBRE)" | tee -a "$LOG_FILE"
    
    # Ejecutar comando de recuperación
    if eval "$comando" >> "$LOG_FILE" 2>&1; then
        echo "   ✅ EXITOSO: $DNI" | tee -a "$LOG_FILE"
        ((EXITOSOS++))
    else
        echo "   ❌ FALLIDO: $DNI" | tee -a "$LOG_FILE"
        ((FALLIDOS++))
    fi
    
    # Pausa entre lotes
    if [ $((PROCESADOS % LOTE_SIZE)) -eq 0 ]; then
        echo "   📊 Lote $lote_actual completado. Pausa de 2 segundos..." | tee -a "$LOG_FILE"
        sleep 2
        ((lote_actual++))
    fi
    
done < temp_recovery_commands.txt

# Limpiar archivo temporal
rm -f temp_recovery_commands.txt

echo | tee -a "$LOG_FILE"
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
    echo -e "${YELLOW}   $FALLIDOS usuarios requieren atención manual${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}⚠️  RECUPERACIÓN CON PROBLEMAS SIGNIFICATIVOS${NC}" | tee -a "$LOG_FILE"
    echo -e "${RED}   Revisar log para detalles: $LOG_FILE${NC}" | tee -a "$LOG_FILE"
fi

echo | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ RECUPERACIÓN EN LOTES COMPLETADA${NC}"
echo -e "${CYAN}📄 Log detallado: $LOG_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo "• Procesados: $PROCESADOS/$TOTAL_USUARIOS"
echo "• Exitosos: $EXITOSOS"
echo "• Fallidos: $FALLIDOS"
echo "• Éxito: $porcentaje_exito%"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡RECUPERACIÓN EN LOTES COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"