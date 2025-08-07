#!/bin/bash

# ============================================================================
# SCRIPT: Consolidación Integral de Todas las Fuentes de Recuperación v2
# PROPÓSITO: Combinar respaldos locales + BD + uploads usando DNIs correctos
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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONSOLIDATION_DIR="RECUPERACION_INTEGRAL_${TIMESTAMP}"
REPORT_FILE="${CONSOLIDATION_DIR}/REPORTE_CONSOLIDACION_${TIMESTAMP}.txt"

# Directorios de fuentes
BACKUPS_LOCALES="/root/BACKUPS_LOCALES_EXTRAIDOS"
UPLOADS_DIR="/var/www/html/uploads"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎯 CONSOLIDACIÓN INTEGRAL v2 - TODAS LAS FUENTES (POR DNI)${NC}"
echo -e "${CYAN}============================================================================${NC}"

# Crear estructura de trabajo
mkdir -p "$CONSOLIDATION_DIR"/{usuarios_por_dni,documentos_consolidados,metadatos,reportes}

echo -e "${BLUE}📊 Iniciando consolidación integral por DNI...${NC}"
echo

# ============================================================================
# FUNCIÓN: Obtener todos los DNIs de respaldos locales
# ============================================================================
get_all_dnis_from_backups() {
    echo -e "${PURPLE}🔍 OBTENIENDO TODOS LOS DNIs DE RESPALDOS LOCALES:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    ALL_DNIS=()
    
    # Buscar en cada fecha de respaldo
    for date_dir in "$BACKUPS_LOCALES"/*_agosto; do
        if [ -d "$date_dir" ]; then
            date_name=$(basename "$date_dir")
            echo "📅 Procesando $date_name..." | tee -a "$REPORT_FILE"
            
            # Obtener DNIs de documents
            if [ -d "$date_dir/documents" ]; then
                for dni_dir in "$date_dir/documents"/*; do
                    if [ -d "$dni_dir" ]; then
                        dni=$(basename "$dni_dir")
                        if [[ "$dni" =~ ^[0-9]+$ ]]; then  # Solo números
                            ALL_DNIS+=("$dni")
                        fi
                    fi
                done
            fi
            
            # Obtener DNIs de cv-documents
            if [ -d "$date_dir/cv-documents" ]; then
                for dni_dir in "$date_dir/cv-documents"/*; do
                    if [ -d "$dni_dir" ]; then
                        dni=$(basename "$dni_dir")
                        if [[ "$dni" =~ ^[0-9]+$ ]]; then  # Solo números
                            ALL_DNIS+=("$dni")
                        fi
                    fi
                done
            fi
            
            # Obtener DNIs de profile-images
            if [ -d "$date_dir/profile-images" ]; then
                for dni_dir in "$date_dir/profile-images"/*; do
                    if [ -d "$dni_dir" ]; then
                        dni=$(basename "$dni_dir")
                        if [[ "$dni" =~ ^[0-9]+$ ]]; then  # Solo números
                            ALL_DNIS+=("$dni")
                        fi
                    fi
                done
            fi
        fi
    done
    
    # Eliminar duplicados y ordenar
    UNIQUE_DNIS=($(printf '%s\n' "${ALL_DNIS[@]}" | sort -u))
    
    echo "📊 Total DNIs únicos encontrados: ${#UNIQUE_DNIS[@]}" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Guardar lista de DNIs
    printf '%s\n' "${UNIQUE_DNIS[@]}" > "$CONSOLIDATION_DIR/metadatos/todos_los_dnis.txt"
}

# ============================================================================
# FUNCIÓN: Consolidar documentos por DNI
# ============================================================================
consolidate_by_dni() {
    echo -e "${PURPLE}📄 CONSOLIDANDO DOCUMENTOS POR DNI:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    total_dnis_processed=0
    total_files_consolidated=0
    
    for dni in "${UNIQUE_DNIS[@]}"; do
        echo "👤 Procesando DNI: $dni" | tee -a "$REPORT_FILE"
        
        # Crear directorio para el DNI
        dni_dir="$CONSOLIDATION_DIR/usuarios_por_dni/$dni"
        mkdir -p "$dni_dir"/{documents,cv_documents,profile_images,metadatos}
        
        dni_files=0
        
        # Consolidar desde cada fecha de respaldo
        for date_dir in "$BACKUPS_LOCALES"/*_agosto; do
            if [ -d "$date_dir" ]; then
                date_name=$(basename "$date_dir")
                
                # Copiar documents
                if [ -d "$date_dir/documents/$dni" ]; then
                    mkdir -p "$dni_dir/documents/$date_name"
                    if find "$date_dir/documents/$dni" -type f 2>/dev/null | head -1 >/dev/null; then
                        cp -r "$date_dir/documents/$dni"/* "$dni_dir/documents/$date_name/" 2>/dev/null || true
                        doc_files=$(find "$dni_dir/documents/$date_name" -type f 2>/dev/null | wc -l)
                        dni_files=$((dni_files + doc_files))
                        if [ $doc_files -gt 0 ]; then
                            echo "   📄 $date_name documents: $doc_files archivos" | tee -a "$REPORT_FILE"
                        fi
                    fi
                fi
                
                # Copiar cv-documents
                if [ -d "$date_dir/cv-documents/$dni" ]; then
                    mkdir -p "$dni_dir/cv_documents/$date_name"
                    if find "$date_dir/cv-documents/$dni" -type f 2>/dev/null | head -1 >/dev/null; then
                        cp -r "$date_dir/cv-documents/$dni"/* "$dni_dir/cv_documents/$date_name/" 2>/dev/null || true
                        cv_files=$(find "$dni_dir/cv_documents/$date_name" -type f 2>/dev/null | wc -l)
                        dni_files=$((dni_files + cv_files))
                        if [ $cv_files -gt 0 ]; then
                            echo "   📝 $date_name CV: $cv_files archivos" | tee -a "$REPORT_FILE"
                        fi
                    fi
                fi
                
                # Copiar profile-images
                if [ -d "$date_dir/profile-images/$dni" ]; then
                    mkdir -p "$dni_dir/profile_images/$date_name"
                    if find "$date_dir/profile-images/$dni" -type f 2>/dev/null | head -1 >/dev/null; then
                        cp -r "$date_dir/profile-images/$dni"/* "$dni_dir/profile_images/$date_name/" 2>/dev/null || true
                        img_files=$(find "$dni_dir/profile_images/$date_name" -type f 2>/dev/null | wc -l)
                        dni_files=$((dni_files + img_files))
                        if [ $img_files -gt 0 ]; then
                            echo "   🖼️  $date_name imágenes: $img_files archivos" | tee -a "$REPORT_FILE"
                        fi
                    fi
                fi
            fi
        done
        
        # Buscar en uploads por DNI
        if [ -d "$UPLOADS_DIR" ]; then
            found_uploads=$(find "$UPLOADS_DIR" -type f -name "*${dni}*" 2>/dev/null)
            if [ -n "$found_uploads" ]; then
                mkdir -p "$dni_dir/uploads_encontrados"
                echo "$found_uploads" | while read -r file; do
                    if [ -f "$file" ]; then
                        cp "$file" "$dni_dir/uploads_encontrados/" 2>/dev/null || true
                    fi
                done
                
                uploads_files=$(find "$dni_dir/uploads_encontrados" -type f 2>/dev/null | wc -l)
                if [ $uploads_files -gt 0 ]; then
                    dni_files=$((dni_files + uploads_files))
                    echo "   📁 Uploads: $uploads_files archivos" | tee -a "$REPORT_FILE"
                fi
            fi
        fi
        
        # Crear resumen del DNI
        echo "DNI: $dni" > "$dni_dir/metadatos/resumen.txt"
        echo "Archivos totales: $dni_files" >> "$dni_dir/metadatos/resumen.txt"
        echo "Fecha consolidación: $(date)" >> "$dni_dir/metadatos/resumen.txt"
        echo "Fuentes:" >> "$dni_dir/metadatos/resumen.txt"
        
        # Contar archivos por tipo
        doc_total=$(find "$dni_dir/documents" -type f 2>/dev/null | wc -l)
        cv_total=$(find "$dni_dir/cv_documents" -type f 2>/dev/null | wc -l)
        img_total=$(find "$dni_dir/profile_images" -type f 2>/dev/null | wc -l)
        uploads_total=$(find "$dni_dir/uploads_encontrados" -type f 2>/dev/null | wc -l)
        
        if [ $doc_total -gt 0 ]; then
            echo "  - Documentos: $doc_total archivos" >> "$dni_dir/metadatos/resumen.txt"
        fi
        if [ $cv_total -gt 0 ]; then
            echo "  - CVs: $cv_total archivos" >> "$dni_dir/metadatos/resumen.txt"
        fi
        if [ $img_total -gt 0 ]; then
            echo "  - Imágenes: $img_total archivos" >> "$dni_dir/metadatos/resumen.txt"
        fi
        if [ $uploads_total -gt 0 ]; then
            echo "  - Uploads: $uploads_total archivos" >> "$dni_dir/metadatos/resumen.txt"
        fi
        
        if [ $dni_files -gt 0 ]; then
            ((total_dnis_processed++))
            total_files_consolidated=$((total_files_consolidated + dni_files))
            echo "   ✅ Total: $dni_files archivos consolidados" | tee -a "$REPORT_FILE"
        else
            echo "   ❌ Sin archivos encontrados" | tee -a "$REPORT_FILE"
            # Eliminar directorio vacío
            rm -rf "$dni_dir"
        fi
        
        echo | tee -a "$REPORT_FILE"
    done
    
    echo "📊 RESUMEN CONSOLIDACIÓN:" | tee -a "$REPORT_FILE"
    echo "   • DNIs procesados: $total_dnis_processed/${#UNIQUE_DNIS[@]}" | tee -a "$REPORT_FILE"
    echo "   • Archivos consolidados: $total_files_consolidated" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# FUNCIÓN: Generar reporte de completitud
# ============================================================================
generate_completeness_report() {
    echo -e "${PURPLE}📊 GENERANDO REPORTE DE COMPLETITUD:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Crear CSV detallado
    CSV_FILE="$CONSOLIDATION_DIR/reportes/completitud_por_dni_${TIMESTAMP}.csv"
    echo "DNI,Documentos,CVs,Imagenes,Uploads,Total_Archivos,Completitud,Estado" > "$CSV_FILE"
    
    dnis_completos=0
    dnis_parciales=0
    dnis_minimos=0
    
    for dni_dir in "$CONSOLIDATION_DIR/usuarios_por_dni"/*; do
        if [ -d "$dni_dir" ]; then
            dni=$(basename "$dni_dir")
            
            doc_count=$(find "$dni_dir/documents" -type f 2>/dev/null | wc -l)
            cv_count=$(find "$dni_dir/cv_documents" -type f 2>/dev/null | wc -l)
            img_count=$(find "$dni_dir/profile_images" -type f 2>/dev/null | wc -l)
            uploads_count=$(find "$dni_dir/uploads_encontrados" -type f 2>/dev/null | wc -l)
            
            total_files=$((doc_count + cv_count + img_count + uploads_count))
            
            # Determinar completitud
            if [ $total_files -ge 8 ] && [ $doc_count -ge 5 ]; then
                completitud="COMPLETO"
                estado="✅"
                ((dnis_completos++))
            elif [ $total_files -ge 3 ] && [ $doc_count -ge 1 ]; then
                completitud="PARCIAL"
                estado="⚠️"
                ((dnis_parciales++))
            else
                completitud="MINIMO"
                estado="🔸"
                ((dnis_minimos++))
            fi
            
            echo "$dni,$doc_count,$cv_count,$img_count,$uploads_count,$total_files,$completitud,$estado" >> "$CSV_FILE"
            echo "👤 DNI $dni: $total_files archivos ($completitud)" | tee -a "$REPORT_FILE"
        fi
    done
    
    echo | tee -a "$REPORT_FILE"
    echo "📊 ESTADÍSTICAS FINALES:" | tee -a "$REPORT_FILE"
    echo "   ✅ DNIs completos: $dnis_completos" | tee -a "$REPORT_FILE"
    echo "   ⚠️  DNIs parciales: $dnis_parciales" | tee -a "$REPORT_FILE"
    echo "   🔸 DNIs mínimos: $dnis_minimos" | tee -a "$REPORT_FILE"
    
    total_dnis=$((dnis_completos + dnis_parciales + dnis_minimos))
    if [ $total_dnis -gt 0 ]; then
        completeness_percentage=$(( ((dnis_completos + dnis_parciales) * 100) / total_dnis ))
        echo "   📊 Completitud general: ${completeness_percentage}%" | tee -a "$REPORT_FILE"
    fi
    
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# FUNCIÓN: Generar recomendación final
# ============================================================================
generate_final_recommendation() {
    echo -e "${PURPLE}💡 RECOMENDACIÓN FINAL:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    # Contar DNIs por estado
    completos=$(grep -c "COMPLETO" "$CONSOLIDATION_DIR/reportes/completitud_por_dni_${TIMESTAMP}.csv" 2>/dev/null || echo 0)
    parciales=$(grep -c "PARCIAL" "$CONSOLIDATION_DIR/reportes/completitud_por_dni_${TIMESTAMP}.csv" 2>/dev/null || echo 0)
    minimos=$(grep -c "MINIMO" "$CONSOLIDATION_DIR/reportes/completitud_por_dni_${TIMESTAMP}.csv" 2>/dev/null || echo 0)
    
    total_recuperados=$((completos + parciales))
    total_usuarios=$((completos + parciales + minimos))
    
    echo "📊 ANÁLISIS DE RECUPERACIÓN:" | tee -a "$REPORT_FILE"
    echo "   • Total usuarios encontrados: $total_usuarios" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentación completa: $completos" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentación parcial: $parciales" | tee -a "$REPORT_FILE"
    echo "   • Usuarios con documentación mínima: $minimos" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    if [ $completos -ge 25 ] || [ $total_recuperados -ge 50 ]; then
        echo "🎉 RECOMENDACIÓN: RECUPERACIÓN INTEGRAL EXITOSA" | tee -a "$REPORT_FILE"
        echo "   • Documentación suficiente para la mayoría de usuarios" | tee -a "$REPORT_FILE"
        echo "   • NO es necesario usar respaldos del proveedor" | tee -a "$REPORT_FILE"
        echo "   • Proceder con organización final de archivos" | tee -a "$REPORT_FILE"
    elif [ $total_recuperados -ge 30 ]; then
        echo "⚠️  RECOMENDACIÓN: RECUPERACIÓN CASI COMPLETA" | tee -a "$REPORT_FILE"
        echo "   • $total_recuperados usuarios con documentación útil" | tee -a "$REPORT_FILE"
        echo "   • Evaluar si es suficiente para las necesidades" | tee -a "$REPORT_FILE"
        echo "   • Considerar recuperación selectiva adicional" | tee -a "$REPORT_FILE"
    else
        echo "❌ RECOMENDACIÓN: NECESARIA RECUPERACIÓN ADICIONAL" | tee -a "$REPORT_FILE"
        echo "   • Solo $total_recuperados usuarios con documentación útil" | tee -a "$REPORT_FILE"
        echo "   • Proceder con respaldos del proveedor" | tee -a "$REPORT_FILE"
        echo "   • Usar consolidación actual como base" | tee -a "$REPORT_FILE"
    fi
    
    echo | tee -a "$REPORT_FILE"
}

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

echo "🎯 Iniciando consolidación integral por DNI..." | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Verificar que existen los respaldos locales
if [ ! -d "$BACKUPS_LOCALES" ]; then
    echo -e "${RED}❌ ERROR: No se encontraron respaldos locales en $BACKUPS_LOCALES${NC}"
    exit 1
fi

# Ejecutar funciones
get_all_dnis_from_backups
consolidate_by_dni
generate_completeness_report
generate_final_recommendation

# Crear paquete final
echo -e "${BLUE}📦 Creando paquete de recuperación integral...${NC}"
tar -czf "RECUPERACION_INTEGRAL_${TIMESTAMP}.tar.gz" "$CONSOLIDATION_DIR"

echo -e "${GREEN}✅ CONSOLIDACIÓN INTEGRAL COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte: $REPORT_FILE${NC}"
echo -e "${CYAN}📦 Paquete: RECUPERACION_INTEGRAL_${TIMESTAMP}.tar.gz${NC}"
echo -e "${CYAN}📊 Datos: $CONSOLIDATION_DIR${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo -e "${YELLOW}===================${NC}"
tail -20 "$REPORT_FILE"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡CONSOLIDACIÓN INTEGRAL POR DNI COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"