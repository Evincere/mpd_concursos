#!/bin/bash

# ============================================================================
# SCRIPT: Probar Fix de Eliminación de Documentos
# PROPÓSITO: Verificar que el fix funciona correctamente
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
REPORT_FILE="PRUEBA_FIX_ELIMINACION_${TIMESTAMP}.txt"
DNI="26598410"
ARCHIVO_ID_ANTERIOR="4344ee82-5065-41f7-a554-fb7cd04cae5b"
ARCHIVO_ID_NUEVO="e3b4667a-4bd4-4b2f-9969-4f2b3322eec9"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🧪 PRUEBA DEL FIX DE ELIMINACIÓN${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🧪 Probando fix de eliminación..." | tee "$REPORT_FILE"
echo "Archivo ID Anterior: $ARCHIVO_ID_ANTERIOR" | tee -a "$REPORT_FILE"
echo "Archivo ID Nuevo: $ARCHIVO_ID_NUEVO" | tee -a "$REPORT_FILE"
echo "DNI Usuario: $DNI" | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. ESTADO INICIAL
# ============================================================================
echo -e "${BLUE}📊 1. ESTADO INICIAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
USER_DIR="$DOCKER_STORAGE/documents/$DNI"

echo "📂 Directorio del usuario: $USER_DIR" | tee -a "$REPORT_FILE"

if [ -d "$USER_DIR" ]; then
    echo "✅ Directorio existe" | tee -a "$REPORT_FILE"
    echo "📄 Archivos antes de la eliminación:" | tee -a "$REPORT_FILE"
    ls -la "$USER_DIR" | while read line; do
        echo "   $line" | tee -a "$REPORT_FILE"
    done
    
    # Contar archivos iniciales
    ARCHIVOS_INICIALES=$(find "$USER_DIR" -type f | wc -l)
    echo "📊 Total archivos iniciales: $ARCHIVOS_INICIALES" | tee -a "$REPORT_FILE"
    
    # Verificar archivo específico
    if [ -f "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" ]; then
        echo "✅ Archivo objetivo encontrado" | tee -a "$REPORT_FILE"
        ARCHIVO_ORIGINAL="$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf"
        echo "📍 Ruta: $ARCHIVO_ORIGINAL" | tee -a "$REPORT_FILE"
    else
        echo "❌ Archivo objetivo NO encontrado" | tee -a "$REPORT_FILE"
        echo "🛑 No se puede continuar con la prueba" | tee -a "$REPORT_FILE"
        exit 1
    fi
else
    echo "❌ Directorio no existe" | tee -a "$REPORT_FILE"
    exit 1
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. INSTRUCCIONES PARA LA PRUEBA
# ============================================================================
echo -e "${BLUE}📊 2. INSTRUCCIONES PARA LA PRUEBA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🎯 PASOS A SEGUIR:" | tee -a "$REPORT_FILE"
echo "1. Hacer login como Sergio Pereyra (DNI: $DNI)" | tee -a "$REPORT_FILE"
echo "2. Ir a la sección de documentos" | tee -a "$REPORT_FILE"
echo "3. Eliminar el documento 'Certificado de Antecedentes Penales'" | tee -a "$REPORT_FILE"
echo "4. Ejecutar este script nuevamente para verificar el resultado" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📋 COMANDOS DE MONITOREO:" | tee -a "$REPORT_FILE"
echo "# Monitorear directorio en tiempo real:" | tee -a "$REPORT_FILE"
echo "watch -n 1 'ls -la $USER_DIR'" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"
echo "# Ver logs del backend:" | tee -a "$REPORT_FILE"
echo "docker logs -f mpd-concursos-backend-prod | grep -E '(eliminación|archivado|renombrado)'" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. VERIFICACIÓN POST-ELIMINACIÓN (si se ejecuta después)
# ============================================================================
echo -e "${BLUE}📊 3. VERIFICACIÓN POST-ELIMINACIÓN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Esperar un momento para que el usuario pueda eliminar el archivo
echo "⏳ Esperando 5 segundos para verificar cambios..." | tee -a "$REPORT_FILE"
sleep 5

echo "📄 Estado después de la eliminación:" | tee -a "$REPORT_FILE"
ls -la "$USER_DIR" | while read line; do
    echo "   $line" | tee -a "$REPORT_FILE"
done

# Contar archivos finales
ARCHIVOS_FINALES=$(find "$USER_DIR" -type f | wc -l)
echo "📊 Total archivos finales: $ARCHIVOS_FINALES" | tee -a "$REPORT_FILE"

# Verificar si el archivo original sigue ahí
if [ -f "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" ]; then
    echo "⚠️  Archivo original AÚN PRESENTE" | tee -a "$REPORT_FILE"
    echo "   Esto podría indicar que no se eliminó o que el fix no funcionó" | tee -a "$REPORT_FILE"
else
    echo "✅ Archivo original ELIMINADO" | tee -a "$REPORT_FILE"
fi

# Buscar archivo archivado
echo "🔍 Buscando archivo archivado..." | tee -a "$REPORT_FILE"
ARCHIVED_FILES=$(find "$USER_DIR" -name "ARCHIVED_${ARCHIVO_ID}*" -type f 2>/dev/null)

if [ -n "$ARCHIVED_FILES" ]; then
    echo "✅ Archivo archivado encontrado:" | tee -a "$REPORT_FILE"
    echo "$ARCHIVED_FILES" | while read file; do
        echo "   📁 $file" | tee -a "$REPORT_FILE"
        ls -la "$file" | tee -a "$REPORT_FILE"
    done
    echo "🎉 ¡FIX FUNCIONÓ CORRECTAMENTE!" | tee -a "$REPORT_FILE"
else
    echo "❌ No se encontró archivo archivado" | tee -a "$REPORT_FILE"
    
    # Buscar en todo el volumen Docker
    echo "🔍 Buscando en todo el volumen Docker..." | tee -a "$REPORT_FILE"
    ARCHIVED_GLOBAL=$(find "$DOCKER_STORAGE" -name "ARCHIVED_${ARCHIVO_ID}*" -type f 2>/dev/null)
    
    if [ -n "$ARCHIVED_GLOBAL" ]; then
        echo "✅ Archivo archivado encontrado en otra ubicación:" | tee -a "$REPORT_FILE"
        echo "$ARCHIVED_GLOBAL" | while read file; do
            echo "   📁 $file" | tee -a "$REPORT_FILE"
        done
    else
        echo "❌ Archivo archivado NO encontrado en ninguna parte" | tee -a "$REPORT_FILE"
    fi
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. ANÁLISIS DE LOGS
# ============================================================================
echo -e "${BLUE}📊 4. ANÁLISIS DE LOGS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Logs recientes de eliminación:" | tee -a "$REPORT_FILE"
docker logs --since="2m" mpd-concursos-backend-prod 2>&1 | grep -E "(eliminación|archivado|renombrado|$ARCHIVO_ID)" | tail -10 | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. RESULTADO FINAL
# ============================================================================
echo -e "${BLUE}📊 5. RESULTADO FINAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ $ARCHIVOS_FINALES -lt $ARCHIVOS_INICIALES ]; then
    echo "✅ CAMBIO DETECTADO: Archivos reducidos de $ARCHIVOS_INICIALES a $ARCHIVOS_FINALES" | tee -a "$REPORT_FILE"
    
    if [ -n "$ARCHIVED_FILES" ] || [ -n "$ARCHIVED_GLOBAL" ]; then
        echo "🎉 RESULTADO: FIX EXITOSO" | tee -a "$REPORT_FILE"
        echo "   • Archivo original eliminado" | tee -a "$REPORT_FILE"
        echo "   • Archivo archivado creado" | tee -a "$REPORT_FILE"
        echo "   • Mecanismo funcionando correctamente" | tee -a "$REPORT_FILE"
    else
        echo "⚠️  RESULTADO: ELIMINACIÓN PARCIAL" | tee -a "$REPORT_FILE"
        echo "   • Archivo eliminado pero no archivado" | tee -a "$REPORT_FILE"
        echo "   • Revisar logs para más detalles" | tee -a "$REPORT_FILE"
    fi
else
    echo "❌ RESULTADO: SIN CAMBIOS" | tee -a "$REPORT_FILE"
    echo "   • No se detectaron cambios en el número de archivos" | tee -a "$REPORT_FILE"
    echo "   • Verificar que se haya eliminado desde la plataforma" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ PRUEBA DEL FIX COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN:${NC}"
echo -e "${YELLOW}==========${NC}"
echo "• Archivos iniciales: $ARCHIVOS_INICIALES"
echo "• Archivos finales: $ARCHIVOS_FINALES"
echo "• Cambio: $((ARCHIVOS_FINALES - ARCHIVOS_INICIALES))"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡PRUEBA COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"