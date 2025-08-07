#!/bin/bash

# ============================================================================
# SCRIPT: Análisis Detallado de Respaldos Locales Extraídos
# PROPÓSITO: Evaluar completitud y calidad de documentos recuperados
# FECHA: 2025-08-07
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
BACKUP_DIR="BACKUPS_LOCALES_EXTRAIDOS"
ANALYSIS_DIR="ANALISIS_RESPALDOS_LOCALES"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${ANALYSIS_DIR}/REPORTE_COMPLETITUD_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔍 ANÁLISIS DETALLADO DE RESPALDOS LOCALES EXTRAÍDOS${NC}"
echo -e "${CYAN}============================================================================${NC}"

# Verificar que existe el directorio de respaldos
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ ERROR: Directorio $BACKUP_DIR no encontrado${NC}"
    echo -e "${YELLOW}💡 Primero extrae el archivo: tar -xzf BACKUPS_LOCALES_EXTRAIDOS_*.tar.gz${NC}"
    exit 1
fi

# Crear directorio de análisis
mkdir -p "$ANALYSIS_DIR"

echo -e "${BLUE}📊 Iniciando análisis detallado...${NC}"
echo

# ============================================================================
# FUNCIÓN: Analizar estructura general
# ============================================================================
analyze_structure() {
    echo -e "${PURPLE}📁 ESTRUCTURA GENERAL:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Contar directorios por fecha
    for date_dir in $(ls -d $BACKUP_DIR/backup_* 2>/dev/null | sort); do
        date_name=$(basename "$date_dir")
        user_count=$(ls -d "$date_dir"/*/ 2>/dev/null | wc -l)
        echo "📅 $date_name: $user_count usuarios" | tee -a "$REPORT_FILE"
    done
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# FUNCIÓN: Analizar usuarios críticos
# ============================================================================
analyze_critical_users() {
    echo -e "${PURPLE}👥 ANÁLISIS DE USUARIOS CRÍTICOS:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Lista de usuarios críticos (de nuestro análisis previo)
    CRITICAL_USERS=(
        "AGUSTIN_ALEJANDRO_ACOSTA_LOPEZ"
        "ALEJANDRA_BEATRIZ_BENITEZ_GONZALEZ"
        "ALEJANDRO_DAVID_BENITEZ_GONZALEZ"
        "ALEJANDRO_JAVIER_GONZALEZ_BENITEZ"
        "ALEXIS_DAVID_GONZALEZ_BENITEZ"
        "ANDREA_ELIZABETH_GONZALEZ_BENITEZ"
        "ANGEL_DAVID_GONZALEZ_BENITEZ"
        "CARLOS_ALBERTO_GONZALEZ_BENITEZ"
        "CESAR_AUGUSTO_GONZALEZ_BENITEZ"
        "CRISTIAN_DAVID_GONZALEZ_BENITEZ"
        "DIEGO_ALEJANDRO_GONZALEZ_BENITEZ"
        "EDUARDO_JOSE_GONZALEZ_BENITEZ"
        "FERNANDO_JOSE_GONZALEZ_BENITEZ"
        "GUSTAVO_ADOLFO_GONZALEZ_BENITEZ"
        "HECTOR_MANUEL_GONZALEZ_BENITEZ"
        "IGNACIO_JOSE_GONZALEZ_BENITEZ"
        "JAVIER_ANTONIO_GONZALEZ_BENITEZ"
        "JORGE_LUIS_GONZALEZ_BENITEZ"
        "JOSE_ANTONIO_GONZALEZ_BENITEZ"
        "JUAN_CARLOS_GONZALEZ_BENITEZ"
        "LUIS_FERNANDO_GONZALEZ_BENITEZ"
        "MANUEL_ALEJANDRO_GONZALEZ_BENITEZ"
        "MARIO_ALBERTO_GONZALEZ_BENITEZ"
        "MIGUEL_ANGEL_GONZALEZ_BENITEZ"
        "OSCAR_DAVID_GONZALEZ_BENITEZ"
        "PEDRO_JOSE_GONZALEZ_BENITEZ"
        "RICARDO_MANUEL_GONZALEZ_BENITEZ"
        "ROBERTO_CARLOS_GONZALEZ_BENITEZ"
    )
    
    echo "🎯 Verificando presencia de ${#CRITICAL_USERS[@]} usuarios críticos..." | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Crear matriz de presencia
    printf "%-40s %-12s %-12s %-12s %-8s\n" "USUARIO" "04_AGOSTO" "05_AGOSTO" "06_AGOSTO" "TOTAL" | tee -a "$REPORT_FILE"
    echo "$(printf '=%.0s' {1..80})" | tee -a "$REPORT_FILE"
    
    total_found=0
    for user in "${CRITICAL_USERS[@]}"; do
        found_04=""
        found_05=""
        found_06=""
        total_dates=0
        
        # Verificar en cada fecha
        if [ -d "$BACKUP_DIR/backup_04_agosto/$user" ]; then
            found_04="✅"
            ((total_dates++))
        else
            found_04="❌"
        fi
        
        if [ -d "$BACKUP_DIR/backup_05_agosto/$user" ]; then
            found_05="✅"
            ((total_dates++))
        else
            found_05="❌"
        fi
        
        if [ -d "$BACKUP_DIR/backup_06_agosto/$user" ]; then
            found_06="✅"
            ((total_dates++))
        else
            found_06="❌"
        fi
        
        if [ $total_dates -gt 0 ]; then
            ((total_found++))
        fi
        
        printf "%-40s %-12s %-12s %-12s %-8s\n" "$user" "$found_04" "$found_05" "$found_06" "$total_dates/3" | tee -a "$REPORT_FILE"
    done
    
    echo | tee -a "$REPORT_FILE"
    echo "📊 RESUMEN: $total_found/${#CRITICAL_USERS[@]} usuarios críticos encontrados" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# FUNCIÓN: Analizar tipos de documentos
# ============================================================================
analyze_document_types() {
    echo -e "${PURPLE}📄 ANÁLISIS DE TIPOS DE DOCUMENTOS:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    for date_dir in $(ls -d $BACKUP_DIR/backup_* 2>/dev/null | sort); do
        date_name=$(basename "$date_dir")
        echo "📅 $date_name:" | tee -a "$REPORT_FILE"
        
        # Contar por tipo de archivo
        pdf_count=$(find "$date_dir" -name "*.pdf" 2>/dev/null | wc -l)
        doc_count=$(find "$date_dir" -name "*.doc*" 2>/dev/null | wc -l)
        jpg_count=$(find "$date_dir" -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)
        png_count=$(find "$date_dir" -name "*.png" 2>/dev/null | wc -l)
        other_count=$(find "$date_dir" -type f ! -name "*.pdf" ! -name "*.doc*" ! -name "*.jpg" ! -name "*.jpeg" ! -name "*.png" 2>/dev/null | wc -l)
        
        echo "   📋 PDFs: $pdf_count" | tee -a "$REPORT_FILE"
        echo "   📝 DOCs: $doc_count" | tee -a "$REPORT_FILE"
        echo "   🖼️  JPGs: $jpg_count" | tee -a "$REPORT_FILE"
        echo "   🖼️  PNGs: $png_count" | tee -a "$REPORT_FILE"
        echo "   📎 Otros: $other_count" | tee -a "$REPORT_FILE"
        
        total_files=$((pdf_count + doc_count + jpg_count + png_count + other_count))
        echo "   📊 Total: $total_files archivos" | tee -a "$REPORT_FILE"
        echo | tee -a "$REPORT_FILE"
    done
}

# ============================================================================
# FUNCIÓN: Analizar completitud por usuario crítico
# ============================================================================
analyze_user_completeness() {
    echo -e "${PURPLE}🎯 COMPLETITUD POR USUARIO CRÍTICO:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Crear archivo CSV para análisis detallado
    CSV_FILE="${ANALYSIS_DIR}/completitud_usuarios_${TIMESTAMP}.csv"
    echo "Usuario,Fecha,PDFs,DOCs,Imagenes,Total_Archivos,Tamaño_MB" > "$CSV_FILE"
    
    CRITICAL_USERS=(
        "AGUSTIN_ALEJANDRO_ACOSTA_LOPEZ"
        "ALEJANDRA_BEATRIZ_BENITEZ_GONZALEZ"
        "ALEJANDRO_DAVID_BENITEZ_GONZALEZ"
        "ALEJANDRO_JAVIER_GONZALEZ_BENITEZ"
        "ALEXIS_DAVID_GONZALEZ_BENITEZ"
        "ANDREA_ELIZABETH_GONZALEZ_BENITEZ"
        "ANGEL_DAVID_GONZALEZ_BENITEZ"
        "CARLOS_ALBERTO_GONZALEZ_BENITEZ"
        "CESAR_AUGUSTO_GONZALEZ_BENITEZ"
        "CRISTIAN_DAVID_GONZALEZ_BENITEZ"
        "DIEGO_ALEJANDRO_GONZALEZ_BENITEZ"
        "EDUARDO_JOSE_GONZALEZ_BENITEZ"
        "FERNANDO_JOSE_GONZALEZ_BENITEZ"
        "GUSTAVO_ADOLFO_GONZALEZ_BENITEZ"
        "HECTOR_MANUEL_GONZALEZ_BENITEZ"
        "IGNACIO_JOSE_GONZALEZ_BENITEZ"
        "JAVIER_ANTONIO_GONZALEZ_BENITEZ"
        "JORGE_LUIS_GONZALEZ_BENITEZ"
        "JOSE_ANTONIO_GONZALEZ_BENITEZ"
        "JUAN_CARLOS_GONZALEZ_BENITEZ"
        "LUIS_FERNANDO_GONZALEZ_BENITEZ"
        "MANUEL_ALEJANDRO_GONZALEZ_BENITEZ"
        "MARIO_ALBERTO_GONZALEZ_BENITEZ"
        "MIGUEL_ANGEL_GONZALEZ_BENITEZ"
        "OSCAR_DAVID_GONZALEZ_BENITEZ"
        "PEDRO_JOSE_GONZALEZ_BENITEZ"
        "RICARDO_MANUEL_GONZALEZ_BENITEZ"
        "ROBERTO_CARLOS_GONZALEZ_BENITEZ"
    )
    
    for user in "${CRITICAL_USERS[@]}"; do
        user_found=false
        echo "👤 $user:" | tee -a "$REPORT_FILE"
        
        for date_dir in $(ls -d $BACKUP_DIR/backup_* 2>/dev/null | sort); do
            date_name=$(basename "$date_dir")
            user_dir="$date_dir/$user"
            
            if [ -d "$user_dir" ]; then
                user_found=true
                
                # Contar archivos por tipo
                pdf_count=$(find "$user_dir" -name "*.pdf" 2>/dev/null | wc -l)
                doc_count=$(find "$user_dir" -name "*.doc*" 2>/dev/null | wc -l)
                img_count=$(find "$user_dir" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
                total_files=$((pdf_count + doc_count + img_count))
                
                # Calcular tamaño
                size_bytes=$(du -sb "$user_dir" 2>/dev/null | cut -f1)
                size_mb=$((size_bytes / 1024 / 1024))
                
                echo "   📅 $date_name: $pdf_count PDFs, $doc_count DOCs, $img_count imgs = $total_files archivos (${size_mb}MB)" | tee -a "$REPORT_FILE"
                
                # Agregar al CSV
                echo "$user,$date_name,$pdf_count,$doc_count,$img_count,$total_files,$size_mb" >> "$CSV_FILE"
            fi
        done
        
        if [ "$user_found" = false ]; then
            echo "   ❌ No encontrado en ninguna fecha" | tee -a "$REPORT_FILE"
        fi
        echo | tee -a "$REPORT_FILE"
    done
    
    echo "📊 Datos detallados guardados en: $CSV_FILE" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# FUNCIÓN: Generar recomendaciones
# ============================================================================
generate_recommendations() {
    echo -e "${PURPLE}💡 RECOMENDACIONES:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Contar usuarios críticos encontrados
    critical_found=0
    for user in "${CRITICAL_USERS[@]}"; do
        if find "$BACKUP_DIR" -type d -name "$user" 2>/dev/null | grep -q .; then
            ((critical_found++))
        fi
    done
    
    # Contar archivos totales
    total_files=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l)
    total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    
    echo "📊 ESTADÍSTICAS GENERALES:" | tee -a "$REPORT_FILE"
    echo "   • Usuarios críticos encontrados: $critical_found/28" | tee -a "$REPORT_FILE"
    echo "   • Total de archivos: $total_files" | tee -a "$REPORT_FILE"
    echo "   • Tamaño total: $total_size" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Generar recomendaciones basadas en completitud
    if [ $critical_found -eq 28 ]; then
        echo "✅ RECOMENDACIÓN: RESPALDOS LOCALES SUFICIENTES" | tee -a "$REPORT_FILE"
        echo "   • Todos los usuarios críticos están presentes" | tee -a "$REPORT_FILE"
        echo "   • Puedes proceder solo con respaldos locales" | tee -a "$REPORT_FILE"
        echo "   • No es necesario restaurar desde el proveedor" | tee -a "$REPORT_FILE"
    elif [ $critical_found -gt 20 ]; then
        echo "⚠️  RECOMENDACIÓN: RESPALDOS LOCALES CASI COMPLETOS" | tee -a "$REPORT_FILE"
        echo "   • $critical_found/28 usuarios críticos presentes" | tee -a "$REPORT_FILE"
        echo "   • Considera usar respaldos locales + restauración selectiva" | tee -a "$REPORT_FILE"
        echo "   • Restaurar solo fechas específicas del proveedor" | tee -a "$REPORT_FILE"
    else
        echo "❌ RECOMENDACIÓN: NECESITAS RESPALDOS DEL PROVEEDOR" | tee -a "$REPORT_FILE"
        echo "   • Solo $critical_found/28 usuarios críticos presentes" | tee -a "$REPORT_FILE"
        echo "   • Procede con plan original de restauración completa" | tee -a "$REPORT_FILE"
        echo "   • Usa respaldos locales como complemento" | tee -a "$REPORT_FILE"
    fi
    
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

# Ejecutar análisis
analyze_structure
analyze_critical_users
analyze_document_types
analyze_user_completeness
generate_recommendations

echo -e "${GREEN}✅ ANÁLISIS COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"
echo -e "${CYAN}📊 Datos CSV en: ${ANALYSIS_DIR}/completitud_usuarios_${TIMESTAMP}.csv${NC}"
echo

# Mostrar resumen final
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo -e "${YELLOW}===================${NC}"
tail -15 "$REPORT_FILE"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡ANÁLISIS DE RESPALDOS LOCALES COMPLETADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"