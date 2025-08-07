#!/bin/bash
# SCRIPT 4: ANALIZADOR DE HALLAZGOS (MÁQUINA EXTERNA)
# ===================================================

set -e

echo "🔍 [$(date)] ANÁLISIS DE HALLAZGOS EN MÁQUINA EXTERNA"
echo "===================================================="

ANALYSIS_DIR="$(pwd)/ANALISIS_HALLAZGOS_$(date +%Y%m%d_%H%M%S)"
RECOVERY_BASE="$(pwd)"

echo "📁 Directorio de análisis: $ANALYSIS_DIR"
echo "📂 Directorio base: $RECOVERY_BASE"

# Crear directorios de análisis
mkdir -p "$ANALYSIS_DIR"/{inventarios,comparaciones,archivos_unicos,estadisticas,logs}

echo "📋 1. Verificando estructura descargada..."
{
    echo "=== ESTRUCTURA DE ARCHIVOS DESCARGADOS ==="
    echo "Fecha: $(date)"
    echo ""
    for backup_dir in mpd_recovery_master mpd_recovery_backups/*/; do
        if [ -d "$backup_dir" ]; then
            echo "📁 $backup_dir"
            find "$backup_dir" -name "*.tar.gz" | head -20
            echo "Total archivos .tar.gz: $(find "$backup_dir" -name "*.tar.gz" | wc -l)"
            echo "Tamaño: $(du -sh "$backup_dir" | awk '{print $1}')"
            echo ""
        fi
    done
} > "$ANALYSIS_DIR/logs/estructura_descargada.txt"

echo "📊 2. Extrayendo y catalogando archivos por fecha..."

# Función para extraer y analizar archivos
analyze_backup_files() {
    local fecha="$1"
    local backup_path="$2"
    local output_dir="$ANALYSIS_DIR/inventarios/$fecha"
    
    mkdir -p "$output_dir"
    
    echo "  🔍 Analizando backup: $fecha"
    
    # Extraer todos los tar.gz y catalogar contenido
    for tarfile in "$backup_path"/*.tar.gz; do
        if [ -f "$tarfile" ]; then
            basename_tar=$(basename "$tarfile" .tar.gz)
            echo "    📦 Procesando: $basename_tar"
            
            # Crear directorio temporal para extracción
            temp_extract="/tmp/extract_$fecha_$basename_tar"
            mkdir -p "$temp_extract"
            
            # Extraer archivo
            tar -xzf "$tarfile" -C "$temp_extract" 2>/dev/null || echo "      ⚠️ Error extrayendo $tarfile"
            
            # Catalogar contenido
            if [ -d "$temp_extract" ]; then
                {
                    echo "=== ARCHIVO: $basename_tar ==="
                    echo "Origen: $tarfile"
                    echo "Fecha de backup: $fecha"
                    echo ""
                    echo "PDFs encontrados:"
                    find "$temp_extract" -name "*.pdf" -type f
                    echo ""
                    echo "Imágenes encontradas:"
                    find "$temp_extract" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -type f
                    echo ""
                    echo "Total PDFs: $(find "$temp_extract" -name "*.pdf" -type f | wc -l)"
                    echo "Total imágenes: $(find "$temp_extract" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -type f | wc -l)"
                    echo "Total archivos: $(find "$temp_extract" -type f | wc -l)"
                    echo "================================"
                } >> "$output_dir/inventario_$basename_tar.txt"
                
                # Copiar archivos valiosos a directorio organizado
                mkdir -p "$output_dir/archivos_encontrados/$basename_tar"
                find "$temp_extract" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) \
                    -exec cp {} "$output_dir/archivos_encontrados/$basename_tar/" \; 2>/dev/null || true
            fi
            
            # Limpiar directorio temporal
            rm -rf "$temp_extract"
        fi
    done
    
    # Crear resumen de la fecha
    {
        echo "=== RESUMEN BACKUP $fecha ==="
        echo "Fecha de análisis: $(date)"
        echo ""
        total_pdfs=$(find "$output_dir/archivos_encontrados" -name "*.pdf" | wc -l)
        total_images=$(find "$output_dir/archivos_encontrados" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l)
        total_files=$(find "$output_dir/archivos_encontrados" -type f | wc -l)
        
        echo "ARCHIVOS RECUPERADOS:"
        echo "- PDFs: $total_pdfs"
        echo "- Imágenes: $total_images"
        echo "- Total: $total_files"
        echo ""
        echo "ARCHIVOS POR FUENTE:"
        for source_dir in "$output_dir/archivos_encontrados"/*; do
            if [ -d "$source_dir" ]; then
                source_name=$(basename "$source_dir")
                source_count=$(find "$source_dir" -type f | wc -l)
                echo "- $source_name: $source_count archivos"
            fi
        done
    } > "$output_dir/RESUMEN_$fecha.txt"
}

# Analizar cada backup
echo "🔍 Analizando backup del estado actual..."
if [ -d "mpd_recovery_master" ]; then
    analyze_backup_files "ACTUAL" "mpd_recovery_master"
fi

echo "🔍 Analizando backup del 3 de agosto..."
if [ -d "mpd_recovery_backups/03_agosto" ]; then
    analyze_backup_files "03_AGOSTO" "mpd_recovery_backups/03_agosto"
fi

echo "🔍 Analizando backup del 4 de agosto..."
if [ -d "mpd_recovery_backups/04_agosto" ]; then
    analyze_backup_files "04_AGOSTO" "mpd_recovery_backups/04_agosto"
fi

echo "🔍 Analizando backup del 5 de agosto..."
if [ -d "mpd_recovery_backups/05_agosto" ]; then
    analyze_backup_files "05_AGOSTO" "mpd_recovery_backups/05_agosto"
fi

echo "📊 3. Identificando archivos únicos por fecha..."
{
    echo "=== ANÁLISIS DE ARCHIVOS ÚNICOS ==="
    echo "Fecha: $(date)"
    echo ""
    
    # Crear listas de archivos por fecha
    for fecha_dir in "$ANALYSIS_DIR/inventarios"/*; do
        if [ -d "$fecha_dir" ]; then
            fecha=$(basename "$fecha_dir")
            echo "📅 Procesando fecha: $fecha"
            
            # Crear lista de checksums para esta fecha
            if [ -d "$fecha_dir/archivos_encontrados" ]; then
                find "$fecha_dir/archivos_encontrados" -type f -exec md5sum {} \; > "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" 2>/dev/null
                
                # Contar archivos únicos de esta fecha
                unique_count=$(cat "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" | awk '{print $1}' | sort | uniq | wc -l)
                total_count=$(cat "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" | wc -l)
                
                echo "- Archivos totales: $total_count"
                echo "- Archivos únicos: $unique_count"
                echo "- Duplicados internos: $((total_count - unique_count))"
            fi
            echo ""
        fi
    done
} > "$ANALYSIS_DIR/estadisticas/analisis_unicidad.txt"

echo "🔍 4. Comparación entre fechas para encontrar archivos nuevos..."
{
    echo "=== COMPARACIÓN ENTRE FECHAS ==="
    echo "Fecha: $(date)"
    echo ""
    
    # Crear lista maestra de checksums
    cat "$ANALYSIS_DIR/comparaciones"/checksums_*.txt > "$ANALYSIS_DIR/comparaciones/checksums_todos.txt" 2>/dev/null || touch "$ANALYSIS_DIR/comparaciones/checksums_todos.txt"
    
    # Identificar archivos completamente únicos
    awk '{print $1}' "$ANALYSIS_DIR/comparaciones/checksums_todos.txt" | sort | uniq -c | sort -n > "$ANALYSIS_DIR/comparaciones/frecuencia_checksums.txt"
    
    # Archivos que aparecen solo una vez (únicos)
    awk '$1 == 1 {print $2}' "$ANALYSIS_DIR/comparaciones/frecuencia_checksums.txt" > "$ANALYSIS_DIR/comparaciones/archivos_completamente_unicos.txt"
    
    echo "ESTADÍSTICAS GLOBALES:"
    total_archivos=$(cat "$ANALYSIS_DIR/comparaciones/checksums_todos.txt" | wc -l)
    archivos_unicos_globales=$(cat "$ANALYSIS_DIR/comparaciones/archivos_completamente_unicos.txt" | wc -l)
    
    echo "- Total archivos analizados: $total_archivos"
    echo "- Archivos completamente únicos: $archivos_unicos_globales"
    echo "- Archivos duplicados entre fechas: $((total_archivos - archivos_unicos_globales))"
    
    echo ""
    echo "ARCHIVOS ÚNICOS POR FECHA:"
    for fecha_dir in "$ANALYSIS_DIR/inventarios"/*; do
        if [ -d "$fecha_dir" ]; then
            fecha=$(basename "$fecha_dir")
            if [ -f "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" ]; then
                # Contar archivos de esta fecha que son únicos globalmente
                unicos_esta_fecha=0
                while read -r checksum; do
                    if grep -q "^$checksum " "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt"; then
                        unicos_esta_fecha=$((unicos_esta_fecha + 1))
                    fi
                done < "$ANALYSIS_DIR/comparaciones/archivos_completamente_unicos.txt"
                
                echo "- $fecha: $unicos_esta_fecha archivos únicos"
            fi
        fi
    done
} > "$ANALYSIS_DIR/estadisticas/comparacion_fechas.txt"

echo "📋 5. Creando inventario de archivos valiosos para recuperación..."
{
    echo "=== ARCHIVOS VALIOSOS PARA RECUPERACIÓN ==="
    echo "Fecha: $(date)"
    echo ""
    echo "CRITERIOS DE SELECCIÓN:"
    echo "1. Archivos únicos que no están en estado actual"
    echo "2. Archivos con nombres que sugieren usuarios específicos"
    echo "3. Archivos de fechas del período crítico (4-6 agosto)"
    echo ""
    
    # Identificar archivos que no están en estado actual
    if [ -f "$ANALYSIS_DIR/comparaciones/checksums_ACTUAL.txt" ]; then
        echo "ARCHIVOS NO PRESENTES EN ESTADO ACTUAL:"
        
        for fecha in "03_AGOSTO" "04_AGOSTO" "05_AGOSTO"; do
            if [ -f "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" ]; then
                echo ""
                echo "📅 DESDE $fecha:"
                
                # Encontrar archivos de esta fecha que NO están en actual
                while read -r checksum filepath; do
                    if ! grep -q "^$checksum " "$ANALYSIS_DIR/comparaciones/checksums_ACTUAL.txt" 2>/dev/null; then
                        echo "✅ NUEVO: $(basename "$filepath")"
                        # Copiar archivo valioso a directorio de recuperación
                        mkdir -p "$ANALYSIS_DIR/archivos_unicos/$fecha"
                        cp "$filepath" "$ANALYSIS_DIR/archivos_unicos/$fecha/" 2>/dev/null || true
                    fi
                done < "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt"
            fi
        done
    else
        echo "⚠️ No se encontró inventario del estado actual"
        echo "Se incluirán TODOS los archivos encontrados en backups históricos"
        
        for fecha in "03_AGOSTO" "04_AGOSTO" "05_AGOSTO"; do
            if [ -f "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt" ]; then
                echo ""
                echo "📅 TODOS LOS ARCHIVOS DE $fecha:"
                mkdir -p "$ANALYSIS_DIR/archivos_unicos/$fecha"
                
                while read -r checksum filepath; do
                    echo "✅ $(basename "$filepath")"
                    cp "$filepath" "$ANALYSIS_DIR/archivos_unicos/$fecha/" 2>/dev/null || true
                done < "$ANALYSIS_DIR/comparaciones/checksums_$fecha.txt"
            fi
        done
    fi
    
} > "$ANALYSIS_DIR/estadisticas/archivos_valiosos.txt"

echo "📈 6. Generando estadísticas finales..."
{
    echo "=== ESTADÍSTICAS FINALES DEL ANÁLISIS ==="
    echo "Fecha: $(date)"
    echo "Directorio: $ANALYSIS_DIR"
    echo ""
    
    echo "ARCHIVOS ANALIZADOS POR FECHA:"
    for fecha_dir in "$ANALYSIS_DIR/inventarios"/*; do
        if [ -d "$fecha_dir" ]; then
            fecha=$(basename "$fecha_dir")
            total_files=$(find "$fecha_dir/archivos_encontrados" -type f 2>/dev/null | wc -l)
            total_pdfs=$(find "$fecha_dir/archivos_encontrados" -name "*.pdf" 2>/dev/null | wc -l)
            total_images=$(find "$fecha_dir/archivos_encontrados" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
            
            echo "📅 $fecha:"
            echo "  - Total archivos: $total_files"
            echo "  - PDFs: $total_pdfs"
            echo "  - Imágenes: $total_images"
        fi
    done
    
    echo ""
    echo "ARCHIVOS ÚNICOS RECUPERABLES:"
    for fecha_dir in "$ANALYSIS_DIR/archivos_unicos"/*; do
        if [ -d "$fecha_dir" ]; then
            fecha=$(basename "$fecha_dir")
            unique_files=$(find "$fecha_dir" -type f 2>/dev/null | wc -l)
            unique_pdfs=$(find "$fecha_dir" -name "*.pdf" 2>/dev/null | wc -l)
            unique_images=$(find "$fecha_dir" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
            
            echo "📅 $fecha (únicos):"
            echo "  - Total únicos: $unique_files"
            echo "  - PDFs únicos: $unique_pdfs"
            echo "  - Imágenes únicas: $unique_images"
        fi
    done
    
    echo ""
    echo "RESUMEN GLOBAL:"
    total_recuperables=$(find "$ANALYSIS_DIR/archivos_unicos" -type f 2>/dev/null | wc -l)
    pdfs_recuperables=$(find "$ANALYSIS_DIR/archivos_unicos" -name "*.pdf" 2>/dev/null | wc -l)
    images_recuperables=$(find "$ANALYSIS_DIR/archivos_unicos" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
    
    echo "🎯 TOTAL ARCHIVOS RECUPERABLES: $total_recuperables"
    echo "📄 PDFs recuperables: $pdfs_recuperables"
    echo "🖼️ Imágenes recuperables: $images_recuperables"
    
    echo ""
    echo "TAMAÑO DE RECUPERACIÓN:"
    du -sh "$ANALYSIS_DIR/archivos_unicos" 2>/dev/null || echo "N/A"
    
} > "$ANALYSIS_DIR/ESTADISTICAS_FINALES.txt"

echo ""
echo "✅ ¡ANÁLISIS DE HALLAZGOS COMPLETADO!"
echo "===================================="
echo "📁 Resultados en: $ANALYSIS_DIR"
echo "📊 Archivos únicos encontrados: $(find "$ANALYSIS_DIR/archivos_unicos" -type f 2>/dev/null | wc -l)"
echo "📄 PDFs recuperables: $(find "$ANALYSIS_DIR/archivos_unicos" -name "*.pdf" 2>/dev/null | wc -l)"
echo "🖼️ Imágenes recuperables: $(find "$ANALYSIS_DIR/archivos_unicos" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)"
echo ""
echo "📋 INFORMES GENERADOS:"
echo "  - $ANALYSIS_DIR/ESTADISTICAS_FINALES.txt"
echo "  - $ANALYSIS_DIR/estadisticas/archivos_valiosos.txt"
echo "  - $ANALYSIS_DIR/estadisticas/comparacion_fechas.txt"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   ./05_consolidar_archivos.sh"
