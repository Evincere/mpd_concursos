#!/bin/bash
# Script 3: Consolidación inteligente de 3 fechas de respaldo

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RECOVERY_DIR="$HOME/mpd_recovery_backup"
CONSOLIDATED_DIR="$RECOVERY_DIR/consolidated"

echo "🔄 [$(date)] CONSOLIDANDO DOCUMENTOS DE 3 FECHAS DE RESPALDO"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio de trabajo: $RECOVERY_DIR"

# Verificar que tenemos las extracciones
if [ ! -d "$RECOVERY_DIR/extractions" ]; then
    echo "❌ Error: No se encontró el directorio de extracciones"
    echo "Asegúrate de haber descargado las extracciones del servidor"
    exit 1
fi

# Crear directorio consolidado
mkdir -p "$CONSOLIDATED_DIR/documents"
mkdir -p "$CONSOLIDATED_DIR/cv-documents"
mkdir -p "$CONSOLIDATED_DIR/profile-images"
mkdir -p "$CONSOLIDATED_DIR/metadata"

echo "📊 Analizando extracciones disponibles..."

# Verificar qué fechas tenemos
FECHAS_DISPONIBLES=()
for fecha in "03_agosto" "04_agosto" "05_agosto"; do
    if [ -d "$RECOVERY_DIR/extractions/$fecha" ]; then
        FECHAS_DISPONIBLES+=("$fecha")
        echo "✅ Encontrada extracción: $fecha"
    else
        echo "⚠️ No encontrada extracción: $fecha"
    fi
done

if [ ${#FECHAS_DISPONIBLES[@]} -eq 0 ]; then
    echo "❌ Error: No se encontraron extracciones válidas"
    exit 1
fi

echo "🎯 Procesando ${#FECHAS_DISPONIBLES[@]} extracciones: ${FECHAS_DISPONIBLES[*]}"

# Función para consolidar archivos evitando duplicados
consolidate_files() {
    local source_type="$1"  # documents, cv-documents, profile-images
    local target_dir="$CONSOLIDATED_DIR/$source_type"
    
    echo "📦 Consolidando: $source_type"
    
    # Crear archivo de tracking de duplicados
    local duplicates_log="$CONSOLIDATED_DIR/metadata/duplicates_${source_type}_$TIMESTAMP.log"
    local consolidated_log="$CONSOLIDATED_DIR/metadata/consolidated_${source_type}_$TIMESTAMP.log"
    
    echo "# Log de consolidación para $source_type - $(date)" > "$consolidated_log"
    echo "# Log de duplicados para $source_type - $(date)" > "$duplicates_log"
    
    local total_processed=0
    local total_consolidated=0
    local total_duplicates=0
    
    # Procesar cada fecha en orden cronológico inverso (más reciente primero)
    for fecha in "${FECHAS_DISPONIBLES[@]}"; do
        local source_dir="$RECOVERY_DIR/extractions/$fecha/$source_type"
        
        if [ ! -d "$source_dir" ]; then
            echo "⚠️ No existe directorio: $source_dir"
            continue
        fi
        
        echo "  📅 Procesando $fecha..."
        
        # Encontrar todos los archivos de esta fecha
        find "$source_dir" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | while read -r file; do
            if [ -f "$file" ]; then
                # Obtener ruta relativa desde el directorio source
                local rel_path="${file#$source_dir/}"
                local target_file="$target_dir/$rel_path"
                
                total_processed=$((total_processed + 1))
                
                # Crear directorio padre si no existe
                mkdir -p "$(dirname "$target_file")"
                
                # Verificar si ya existe
                if [ -f "$target_file" ]; then
                    # Comparar archivos
                    if cmp -s "$file" "$target_file"; then
                        echo "DUPLICATE_IDENTICAL: $rel_path (from $fecha)" >> "$duplicates_log"
                        total_duplicates=$((total_duplicates + 1))
                    else
                        # Archivo diferente con mismo nombre - renombrar
                        local new_name="${rel_path%.*}_${fecha}.${rel_path##*.}"
                        local new_target="$target_dir/$new_name"
                        cp "$file" "$new_target"
                        echo "DUPLICATE_RENAMED: $rel_path -> $new_name (from $fecha)" >> "$duplicates_log"
                        echo "CONSOLIDATED: $new_name (from $fecha)" >> "$consolidated_log"
                        total_consolidated=$((total_consolidated + 1))
                    fi
                else
                    # Archivo nuevo - copiar directamente
                    cp "$file" "$target_file"
                    echo "CONSOLIDATED: $rel_path (from $fecha)" >> "$consolidated_log"
                    total_consolidated=$((total_consolidated + 1))
                fi
            fi
        done
    done
    
    echo "  ✅ $source_type: $total_consolidated consolidados, $total_duplicates duplicados de $total_processed procesados"
}

# Consolidar cada tipo de archivo
consolidate_files "documents"
consolidate_files "cv-documents"
consolidate_files "profile-images"

# Consolidar metadatos
echo "📊 Consolidando metadatos..."
cat > "$CONSOLIDATED_DIR/metadata/consolidation_summary_$TIMESTAMP.txt" << SUMMARY
CONSOLIDATION_TIMESTAMP=$TIMESTAMP
CONSOLIDATION_DATE=$(date)
FECHAS_PROCESADAS=${FECHAS_DISPONIBLES[*]}
TOTAL_FECHAS=${#FECHAS_DISPONIBLES[@]}

ARCHIVOS_CONSOLIDADOS:
SUMMARY

# Contar archivos consolidados
DOCS_CONSOLIDATED=$(find "$CONSOLIDATED_DIR/documents" -name "*.pdf" 2>/dev/null | wc -l)
CV_CONSOLIDATED=$(find "$CONSOLIDATED_DIR/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)
IMAGES_CONSOLIDATED=$(find "$CONSOLIDATED_DIR/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)

cat >> "$CONSOLIDATED_DIR/metadata/consolidation_summary_$TIMESTAMP.txt" << SUMMARY
DOCUMENTS_CONSOLIDATED=$DOCS_CONSOLIDATED
CV_CONSOLIDATED=$CV_CONSOLIDATED
IMAGES_CONSOLIDATED=$IMAGES_CONSOLIDATED
TOTAL_FILES_CONSOLIDATED=$((DOCS_CONSOLIDATED + CV_CONSOLIDATED + IMAGES_CONSOLIDATED))
SUMMARY

# Crear inventario completo
echo "📋 Creando inventario completo..."
find "$CONSOLIDATED_DIR/documents" -name "*.pdf" > "$CONSOLIDATED_DIR/metadata/final_documents_inventory_$TIMESTAMP.txt" 2>/dev/null || touch "$CONSOLIDATED_DIR/metadata/final_documents_inventory_$TIMESTAMP.txt"
find "$CONSOLIDATED_DIR/cv-documents" -name "*.pdf" > "$CONSOLIDATED_DIR/metadata/final_cv_inventory_$TIMESTAMP.txt" 2>/dev/null || touch "$CONSOLIDATED_DIR/metadata/final_cv_inventory_$TIMESTAMP.txt"
find "$CONSOLIDATED_DIR/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) > "$CONSOLIDATED_DIR/metadata/final_images_inventory_$TIMESTAMP.txt" 2>/dev/null || touch "$CONSOLIDATED_DIR/metadata/final_images_inventory_$TIMESTAMP.txt"

# Crear checksums finales
echo "🔐 Creando checksums finales..."
find "$CONSOLIDATED_DIR" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | xargs md5sum > "$CONSOLIDATED_DIR/metadata/final_checksums_$TIMESTAMP.md5" 2>/dev/null || echo "⚠️ Error creando checksums"

# Crear paquete final
echo "📦 Creando paquete final para transferencia..."
cd "$RECOVERY_DIR"
tar -czf "consolidated_recovery_$TIMESTAMP.tar.gz" consolidated/

echo ""
echo "✅ CONSOLIDACIÓN COMPLETADA"
echo "📊 RESUMEN FINAL:"
echo "   📄 Documentos consolidados: $DOCS_CONSOLIDATED"
echo "   📋 CV consolidados: $CV_CONSOLIDATED"
echo "   🖼️ Fotos consolidadas: $IMAGES_CONSOLIDATED"
echo "   📁 Total archivos: $((DOCS_CONSOLIDATED + CV_CONSOLIDATED + IMAGES_CONSOLIDATED))"

echo ""
echo "📦 Archivos generados:"
echo "   📁 Consolidado: $CONSOLIDATED_DIR"
echo "   📦 Paquete: $RECOVERY_DIR/consolidated_recovery_$TIMESTAMP.tar.gz"

echo ""
echo "🎯 PRÓXIMO PASO:"
echo "Subir el paquete consolidado al servidor:"
echo "scp $RECOVERY_DIR/consolidated_recovery_$TIMESTAMP.tar.gz root@SERVER:/root/external_recovery/"

echo ""
echo "⚠️ IMPORTANTE: Guarda este timestamp: $TIMESTAMP"