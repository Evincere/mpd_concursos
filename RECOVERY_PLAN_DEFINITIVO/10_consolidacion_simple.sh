#!/bin/bash

# ============================================================================
# SCRIPT: Consolidación Simple de Todas las Fuentes
# PROPÓSITO: Evaluar rápidamente qué usuarios críticos podemos recuperar
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
REPORT_FILE="CONSOLIDACION_SIMPLE_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎯 CONSOLIDACIÓN SIMPLE - EVALUACIÓN RÁPIDA${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Evaluando fuentes disponibles..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. VERIFICAR RESPALDOS LOCALES
# ============================================================================
echo -e "${BLUE}📊 1. RESPALDOS LOCALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

if [ -d "$BACKUPS_DIR" ]; then
    echo "✅ Directorio de respaldos encontrado" | tee -a "$REPORT_FILE"
    
    # Verificar cada fecha
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        if [ -d "$BACKUPS_DIR/$fecha" ]; then
            echo "📅 $fecha:" | tee -a "$REPORT_FILE"
            
            # Contar usuarios en documents (por DNI)
            if [ -d "$BACKUPS_DIR/$fecha/documents" ]; then
                usuarios_docs=$(ls "$BACKUPS_DIR/$fecha/documents" 2>/dev/null | wc -l)
                echo "   📄 Documents: $usuarios_docs usuarios" | tee -a "$REPORT_FILE"
            fi
            
            # Contar usuarios en cv-documents
            if [ -d "$BACKUPS_DIR/$fecha/cv-documents" ]; then
                usuarios_cv=$(ls "$BACKUPS_DIR/$fecha/cv-documents" 2>/dev/null | wc -l)
                echo "   📝 CV Documents: $usuarios_cv usuarios" | tee -a "$REPORT_FILE"
            fi
            
            # Contar usuarios en profile-images
            if [ -d "$BACKUPS_DIR/$fecha/profile-images" ]; then
                usuarios_img=$(ls "$BACKUPS_DIR/$fecha/profile-images" 2>/dev/null | wc -l)
                echo "   🖼️  Profile Images: $usuarios_img usuarios" | tee -a "$REPORT_FILE"
            fi
        else
            echo "❌ $fecha: No encontrado" | tee -a "$REPORT_FILE"
        fi
    done
else
    echo "❌ Directorio de respaldos no encontrado" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. VERIFICAR UPLOADS ACTUALES
# ============================================================================
echo -e "${BLUE}📊 2. UPLOADS ACTUALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

UPLOADS_DIR="/var/www/html/uploads"

if [ -d "$UPLOADS_DIR" ]; then
    uploads_count=$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    uploads_size=$(du -sh "$UPLOADS_DIR" 2>/dev/null | cut -f1)
    echo "✅ Uploads: $uploads_count archivos ($uploads_size)" | tee -a "$REPORT_FILE"
else
    echo "❌ Directorio uploads no encontrado" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. ANÁLISIS DE USUARIOS ÚNICOS
# ============================================================================
echo -e "${BLUE}📊 3. ANÁLISIS DE USUARIOS ÚNICOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Crear lista de todos los DNIs únicos encontrados
TEMP_USERS="/tmp/usuarios_unicos_${TIMESTAMP}.txt"
> "$TEMP_USERS"

if [ -d "$BACKUPS_DIR" ]; then
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        if [ -d "$BACKUPS_DIR/$fecha/documents" ]; then
            ls "$BACKUPS_DIR/$fecha/documents" 2>/dev/null >> "$TEMP_USERS"
        fi
    done
fi

# Obtener usuarios únicos
if [ -f "$TEMP_USERS" ]; then
    usuarios_unicos=$(sort "$TEMP_USERS" | uniq | wc -l)
    echo "👥 Total usuarios únicos encontrados: $usuarios_unicos" | tee -a "$REPORT_FILE"
    
    # Mostrar algunos ejemplos
    echo "📋 Ejemplos de DNIs encontrados:" | tee -a "$REPORT_FILE"
    sort "$TEMP_USERS" | uniq | head -10 | while read dni; do
        echo "   • $dni" | tee -a "$REPORT_FILE"
    done
    
    rm -f "$TEMP_USERS"
else
    echo "❌ No se pudieron analizar usuarios únicos" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. ANÁLISIS POR USUARIO ESPECÍFICO
# ============================================================================
echo -e "${BLUE}📊 4. ANÁLISIS DETALLADO POR USUARIO:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Tomar los primeros 5 usuarios como muestra
if [ -d "$BACKUPS_DIR/05_agosto/documents" ]; then
    echo "🔍 Analizando muestra de usuarios del 05_agosto:" | tee -a "$REPORT_FILE"
    
    ls "$BACKUPS_DIR/05_agosto/documents" | head -5 | while read dni; do
        echo "👤 DNI: $dni" | tee -a "$REPORT_FILE"
        
        # Contar archivos por fecha
        total_archivos=0
        for fecha in "04_agosto" "05_agosto" "06_agosto"; do
            if [ -d "$BACKUPS_DIR/$fecha/documents/$dni" ]; then
                archivos=$(find "$BACKUPS_DIR/$fecha/documents/$dni" -type f 2>/dev/null | wc -l)
                if [ $archivos -gt 0 ]; then
                    echo "   📅 $fecha: $archivos archivos" | tee -a "$REPORT_FILE"
                    total_archivos=$((total_archivos + archivos))
                fi
            fi
        done
        
        # Verificar CV
        cv_count=0
        for fecha in "04_agosto" "05_agosto" "06_agosto"; do
            if [ -d "$BACKUPS_DIR/$fecha/cv-documents/$dni" ]; then
                cv_archivos=$(find "$BACKUPS_DIR/$fecha/cv-documents/$dni" -type f 2>/dev/null | wc -l)
                cv_count=$((cv_count + cv_archivos))
            fi
        done
        
        if [ $cv_count -gt 0 ]; then
            echo "   📝 CVs: $cv_count archivos" | tee -a "$REPORT_FILE"
            total_archivos=$((total_archivos + cv_count))
        fi
        
        # Verificar imágenes
        img_count=0
        for fecha in "04_agosto" "05_agosto" "06_agosto"; do
            if [ -d "$BACKUPS_DIR/$fecha/profile-images/$dni" ]; then
                img_archivos=$(find "$BACKUPS_DIR/$fecha/profile-images/$dni" -type f 2>/dev/null | wc -l)
                img_count=$((img_count + img_archivos))
            fi
        done
        
        if [ $img_count -gt 0 ]; then
            echo "   🖼️  Imágenes: $img_count archivos" | tee -a "$REPORT_FILE"
            total_archivos=$((total_archivos + img_count))
        fi
        
        echo "   📊 Total: $total_archivos archivos" | tee -a "$REPORT_FILE"
        echo | tee -a "$REPORT_FILE"
    done
fi

# ============================================================================
# 5. RECOMENDACIÓN FINAL
# ============================================================================
echo -e "${BLUE}💡 5. RECOMENDACIÓN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ -d "$BACKUPS_DIR" ]; then
    # Contar usuarios totales
    total_05=$(ls "$BACKUPS_DIR/05_agosto/documents" 2>/dev/null | wc -l)
    total_06=$(ls "$BACKUPS_DIR/06_agosto/documents" 2>/dev/null | wc -l)
    
    echo "📊 ESTADÍSTICAS:" | tee -a "$REPORT_FILE"
    echo "   • 05 agosto: $total_05 usuarios" | tee -a "$REPORT_FILE"
    echo "   • 06 agosto: $total_06 usuarios" | tee -a "$REPORT_FILE"
    
    if [ $total_06 -ge 25 ]; then
        echo | tee -a "$REPORT_FILE"
        echo "🎉 RECOMENDACIÓN: RESPALDOS LOCALES SUFICIENTES" | tee -a "$REPORT_FILE"
        echo "   ✅ Más de 25 usuarios encontrados" | tee -a "$REPORT_FILE"
        echo "   ✅ Documentación completa disponible" | tee -a "$REPORT_FILE"
        echo "   ✅ NO necesitas respaldos del proveedor" | tee -a "$REPORT_FILE"
        echo "   🚀 Proceder con organización final" | tee -a "$REPORT_FILE"
    else
        echo | tee -a "$REPORT_FILE"
        echo "⚠️  RECOMENDACIÓN: EVALUAR RESPALDOS DEL PROVEEDOR" | tee -a "$REPORT_FILE"
        echo "   📊 Solo $total_06 usuarios encontrados" | tee -a "$REPORT_FILE"
        echo "   🤔 Considerar restauración adicional" | tee -a "$REPORT_FILE"
    fi
else
    echo "❌ RECOMENDACIÓN: RESTAURAR RESPALDOS LOCALES PRIMERO" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"
echo -e "${GREEN}✅ EVALUACIÓN COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN:${NC}"
tail -10 "$REPORT_FILE"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡EVALUACIÓN SIMPLE COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"