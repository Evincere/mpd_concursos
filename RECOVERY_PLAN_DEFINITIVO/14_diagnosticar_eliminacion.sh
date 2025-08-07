#!/bin/bash

# ============================================================================
# SCRIPT: Diagnosticar Problema de Eliminación de Documentos
# PROPÓSITO: Investigar por qué el archivo no se renombra físicamente
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
REPORT_FILE="DIAGNOSTICO_ELIMINACION_${TIMESTAMP}.txt"
DNI="26598410"
ARCHIVO_ID="4344ee82-5065-41f7-a554-fb7cd04cae5b"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 DIAGNÓSTICO DEL PROBLEMA DE ELIMINACIÓN${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Diagnosticando problema de eliminación..." | tee "$REPORT_FILE"
echo "Archivo ID: $ARCHIVO_ID" | tee -a "$REPORT_FILE"
echo "DNI Usuario: $DNI" | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. VERIFICAR ESTADO ACTUAL DEL ARCHIVO
# ============================================================================
echo -e "${BLUE}📊 1. ESTADO ACTUAL DEL ARCHIVO:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
USER_DIR="$DOCKER_STORAGE/documents/$DNI"

echo "📂 Directorio del usuario: $USER_DIR" | tee -a "$REPORT_FILE"

if [ -d "$USER_DIR" ]; then
    echo "✅ Directorio existe" | tee -a "$REPORT_FILE"
    echo "📄 Archivos actuales:" | tee -a "$REPORT_FILE"
    ls -la "$USER_DIR" | while read line; do
        echo "   $line" | tee -a "$REPORT_FILE"
    done
    
    # Buscar el archivo específico
    if [ -f "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" ]; then
        echo "✅ Archivo original encontrado" | tee -a "$REPORT_FILE"
        ARCHIVO_ORIGINAL="$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf"
        echo "📍 Ruta completa: $ARCHIVO_ORIGINAL" | tee -a "$REPORT_FILE"
    else
        echo "❌ Archivo original NO encontrado" | tee -a "$REPORT_FILE"
    fi
else
    echo "❌ Directorio no existe" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. BUSCAR ARCHIVOS ARCHIVADOS
# ============================================================================
echo -e "${BLUE}📊 2. BÚSQUEDA DE ARCHIVOS ARCHIVADOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Buscando archivos con prefijo ARCHIVED_..." | tee -a "$REPORT_FILE"

# Buscar en todo el volumen Docker
ARCHIVED_FILES=$(find "$DOCKER_STORAGE" -name "ARCHIVED_${ARCHIVO_ID}*" -type f 2>/dev/null)

if [ -n "$ARCHIVED_FILES" ]; then
    echo "✅ Archivos archivados encontrados:" | tee -a "$REPORT_FILE"
    echo "$ARCHIVED_FILES" | while read file; do
        echo "   📁 $file" | tee -a "$REPORT_FILE"
        ls -la "$file" | tee -a "$REPORT_FILE"
    done
else
    echo "❌ No se encontraron archivos archivados con ID $ARCHIVO_ID" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. VERIFICAR LOGS DE ELIMINACIÓN
# ============================================================================
echo -e "${BLUE}📊 3. LOGS DE ELIMINACIÓN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Extrayendo logs relevantes de eliminación..." | tee -a "$REPORT_FILE"

# Extraer logs específicos del proceso de eliminación
docker logs mpd-concursos-backend-prod 2>&1 | grep -A10 -B5 "$ARCHIVO_ID" | grep -E "(eliminación|archivado|renombrado|Error|WARN)" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. VERIFICAR CONFIGURACIÓN DE STORAGE
# ============================================================================
echo -e "${BLUE}📊 4. CONFIGURACIÓN DE STORAGE:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📂 Configuración esperada:" | tee -a "$REPORT_FILE"
echo "   • Volumen Docker: mpd_concursos_storage_data_prod" | tee -a "$REPORT_FILE"
echo "   • Ruta física: $DOCKER_STORAGE" | tee -a "$REPORT_FILE"
echo "   • Ruta en contenedor: /app/storage" | tee -a "$REPORT_FILE"
echo "   • Subdirectorio documents: /app/storage/documents" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. ANÁLISIS DEL PROBLEMA
# ============================================================================
echo -e "${BLUE}📊 5. ANÁLISIS DEL PROBLEMA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Posibles causas del problema:" | tee -a "$REPORT_FILE"

# Verificar permisos
echo "📋 PERMISOS:" | tee -a "$REPORT_FILE"
if [ -f "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" ]; then
    ls -la "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" | tee -a "$REPORT_FILE"
    
    # Verificar si el archivo está siendo usado
    echo "🔒 PROCESOS USANDO EL ARCHIVO:" | tee -a "$REPORT_FILE"
    lsof "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" 2>/dev/null | tee -a "$REPORT_FILE" || echo "   No hay procesos usando el archivo" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. VERIFICAR RUTA DE STORAGE EN CONTENEDOR
# ============================================================================
echo -e "${BLUE}📊 6. VERIFICACIÓN EN CONTENEDOR:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🐳 Verificando configuración dentro del contenedor..." | tee -a "$REPORT_FILE"

# Verificar que el contenedor esté corriendo
if docker ps | grep -q "mpd-concursos-backend-prod"; then
    echo "✅ Contenedor backend está corriendo" | tee -a "$REPORT_FILE"
    
    # Verificar la ruta dentro del contenedor
    echo "📂 Contenido de /app/storage/documents/$DNI dentro del contenedor:" | tee -a "$REPORT_FILE"
    docker exec mpd-concursos-backend-prod ls -la "/app/storage/documents/$DNI" 2>/dev/null | tee -a "$REPORT_FILE" || echo "❌ Error accediendo al directorio en contenedor" | tee -a "$REPORT_FILE"
    
else
    echo "❌ Contenedor backend no está corriendo" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 7. RECOMENDACIONES
# ============================================================================
echo -e "${BLUE}📊 7. RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "💡 POSIBLES SOLUCIONES:" | tee -a "$REPORT_FILE"

if [ -f "$USER_DIR/${ARCHIVO_ID}_Certificado_de_Antecedentes_Penales_1754542808283.pdf" ]; then
    echo "1️⃣  PROBLEMA DE RUTA:" | tee -a "$REPORT_FILE"
    echo "   • El código puede estar usando rutas incorrectas" | tee -a "$REPORT_FILE"
    echo "   • Verificar que getStorageLocation() retorne la ruta correcta" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "2️⃣  PROBLEMA DE PERMISOS:" | tee -a "$REPORT_FILE"
    echo "   • El contenedor puede no tener permisos para renombrar" | tee -a "$REPORT_FILE"
    echo "   • Verificar permisos del volumen Docker" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "3️⃣  PROBLEMA DE CONFIGURACIÓN:" | tee -a "$REPORT_FILE"
    echo "   • StorageConfig puede estar mal configurado" | tee -a "$REPORT_FILE"
    echo "   • Verificar application.properties" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "4️⃣  EXCEPCIÓN SILENCIOSA:" | tee -a "$REPORT_FILE"
    echo "   • El error puede estar siendo capturado pero no loggeado" | tee -a "$REPORT_FILE"
    echo "   • Revisar nivel de logging" | tee -a "$REPORT_FILE"
else
    echo "✅ El archivo fue renombrado correctamente" | tee -a "$REPORT_FILE"
    echo "   • Buscar el archivo archivado en el sistema" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ DIAGNÓSTICO COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 PRÓXIMOS PASOS:${NC}"
echo -e "${YELLOW}=================${NC}"
echo "1. Revisar el reporte generado"
echo "2. Verificar configuración de StorageConfig"
echo "3. Revisar logs de errores en el backend"
echo "4. Probar eliminación con logging DEBUG"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡DIAGNÓSTICO COMPLETADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"