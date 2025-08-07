#!/bin/bash
# SCRIPT 5: CONSOLIDADOR DE ARCHIVOS (MÁQUINA EXTERNA)
# ====================================================

set -e

echo "🔄 [$(date)] CONSOLIDACIÓN DE ARCHIVOS PARA RECUPERACIÓN"
echo "======================================================="

CONSOLIDATION_DIR="$(pwd)/CONSOLIDACION_FINAL_$(date +%Y%m%d_%H%M%S)"
ANALYSIS_DIR=$(find . -name "ANALISIS_HALLAZGOS_*" -type d | head -1)

if [ -z "$ANALYSIS_DIR" ] || [ ! -d "$ANALYSIS_DIR" ]; then
    echo "❌ Error: No se encontró directorio de análisis"
    echo "Debe ejecutar primero: ./04_analizar_hallazgos.sh"
    exit 1
fi

echo "📁 Directorio de consolidación: $CONSOLIDATION_DIR"
echo "📂 Usando análisis de: $ANALYSIS_DIR"

# Crear estructura de consolidación
mkdir -p "$CONSOLIDATION_DIR"/{documents,cv-documents,profile-images,metadata,logs}

echo "📋 1. Organizando archivos por tipo y estructura esperada..."

# Función para organizar archivos según nombres y patrones
organize_files() {
    local source_dir="$1"
    local fecha="$2"
    
    echo "  📅 Organizando archivos de: $fecha"
    
    if [ ! -d "$source_dir" ]; then
        echo "    ⚠️ Directorio no encontrado: $source_dir"
        return
    fi
    
    local files_organized=0
    
    # Recorrer todos los archivos encontrados
    for file in "$source_dir"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            extension="${filename##*.}"
            extension_lower=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
            
            # Determinar tipo de archivo y destino
            case "$extension_lower" in
                pdf)
                    # Intentar determinar si es CV o documento de inscripción
                    if [[ "$filename" =~ (cv|curriculum|experience|education) ]]; then
                        # Es un CV o documento de experiencia/educación
                        target_dir="$CONSOLIDATION_DIR/cv-documents"
                        echo "    📋 CV: $filename"
                    else
                        # Es documento de inscripción
                        target_dir="$CONSOLIDATION_DIR/documents"
                        echo "    📄 DOC: $filename"
                    fi
                    ;;
                jpg|jpeg|png)
                    # Es imagen de perfil
                    target_dir="$CONSOLIDATION_DIR/profile-images"
                    echo "    🖼️ IMG: $filename"
                    ;;
                *)
                    # Archivo de tipo desconocido
                    target_dir="$CONSOLIDATION_DIR/metadata"
                    echo "    ❓ OTHER: $filename"
                    ;;
            esac
            
            # Crear subdirectorio por fecha para evitar sobrescritura
            mkdir -p "$target_dir/$fecha"
            
            # Copiar archivo con información de origen
            target_file="$target_dir/$fecha/${fecha}_${filename}"
            cp "$file" "$target_file"
            files_organized=$((files_organized + 1))
            
            # Registrar en log
            echo "$fecha,$filename,$target_file,$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")" >> "$CONSOLIDATION_DIR/logs/archivos_organizados.csv"
        fi
    done
    
    echo "    ✅ $files_organized archivos organizados de $fecha"
}

# Organizar archivos de cada fecha
for unique_dir in "$ANALYSIS_DIR/archivos_unicos"/*; do
    if [ -d "$unique_dir" ]; then
        fecha=$(basename "$unique_dir")
        organize_files "$unique_dir" "$fecha"
    fi
done

echo "📊 2. Generando estadísticas de consolidación..."
{
    echo "=== ESTADÍSTICAS DE CONSOLIDACIÓN ==="
    echo "Fecha: $(date)"
    echo "Directorio: $CONSOLIDATION_DIR"
    echo ""
    
    echo "ARCHIVOS CONSOLIDADOS POR TIPO:"
    docs_count=$(find "$CONSOLIDATION_DIR/documents" -type f 2>/dev/null | wc -l)
    cv_count=$(find "$CONSOLIDATION_DIR/cv-documents" -type f 2>/dev/null | wc -l)
    images_count=$(find "$CONSOLIDATION_DIR/profile-images" -type f 2>/dev/null | wc -l)
    other_count=$(find "$CONSOLIDATION_DIR/metadata" -type f 2>/dev/null | wc -l)
    total_count=$((docs_count + cv_count + images_count + other_count))
    
    echo "📄 Documentos de inscripción: $docs_count"
    echo "📋 Documentos CV: $cv_count"
    echo "🖼️ Imágenes de perfil: $images_count"
    echo "❓ Otros archivos: $other_count"
    echo "📊 TOTAL CONSOLIDADO: $total_count"
    
    echo ""
    echo "ARCHIVOS POR FECHA DE ORIGEN:"
    for fecha_dir in "$CONSOLIDATION_DIR"/*/*/*; do
        if [ -d "$fecha_dir" ]; then
            fecha_name=$(basename "$fecha_dir")
            fecha_count=$(find "$fecha_dir" -type f 2>/dev/null | wc -l)
            if [ "$fecha_count" -gt 0 ]; then
                echo "📅 $fecha_name: $fecha_count archivos"
            fi
        fi
    done
    
    echo ""
    echo "TAMAÑO TOTAL:"
    du -sh "$CONSOLIDATION_DIR"
    
} > "$CONSOLIDATION_DIR/logs/estadisticas_consolidacion.txt"

echo "🔍 3. Detectando posibles duplicados en consolidación..."
{
    echo "=== DETECCIÓN DE DUPLICADOS EN CONSOLIDACIÓN ==="
    echo "Fecha: $(date)"
    echo ""
    
    # Generar checksums de archivos consolidados
    find "$CONSOLIDATION_DIR" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec md5sum {} \; > "$CONSOLIDATION_DIR/logs/checksums_consolidados.txt" 2>/dev/null
    
    # Encontrar duplicados
    awk '{print $1}' "$CONSOLIDATION_DIR/logs/checksums_consolidados.txt" | sort | uniq -c | sort -rn > "$CONSOLIDATION_DIR/logs/frecuencia_checksums_consolidados.txt"
    
    # Archivos duplicados
    duplicates_count=$(awk '$1 > 1 {duplicates += ($1 - 1)} END {print duplicates+0}' "$CONSOLIDATION_DIR/logs/frecuencia_checksums_consolidados.txt")
    unique_count=$(awk '$1 == 1' "$CONSOLIDATION_DIR/logs/frecuencia_checksums_consolidados.txt" | wc -l)
    
    echo "ANÁLISIS DE DUPLICADOS:"
    echo "- Archivos únicos: $unique_count"
    echo "- Duplicados encontrados: $duplicates_count"
    
    if [ "$duplicates_count" -gt 0 ]; then
        echo ""
        echo "DUPLICADOS DETECTADOS:"
        awk '$1 > 1 {print $2}' "$CONSOLIDATION_DIR/logs/frecuencia_checksums_consolidados.txt" | while read checksum; do
            echo "Checksum $checksum aparece en:"
            grep "^$checksum " "$CONSOLIDATION_DIR/logs/checksums_consolidados.txt" | awk '{print "  - " $2}'
        done | head -20
    fi
    
} > "$CONSOLIDATION_DIR/logs/analisis_duplicados.txt"

echo "📦 4. Creando estructura estándar para integración..."
# Crear estructura estándar esperada por el sistema
mkdir -p "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR"/{documents,cv-documents,profile-images}

# Reorganizar archivos eliminando prefijos de fecha para integración
echo "  🔄 Reorganizando para estructura estándar..."
reorganized_count=0

# Función para limpiar nombres de archivos
clean_filename() {
    local filename="$1"
    # Remover prefijos de fecha (03_AGOSTO_, 04_AGOSTO_, etc.)
    echo "$filename" | sed 's/^[0-9][0-9]_[A-Z]*_//'
}

# Reorganizar documentos
for file in "$CONSOLIDATION_DIR/documents"/*/* 2>/dev/null; do
    if [ -f "$file" ]; then
        cleaned_name=$(clean_filename "$(basename "$file")")
        target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/documents/$cleaned_name"
        
        # Evitar sobrescritura de archivos con mismo nombre
        if [ -f "$target_path" ]; then
            # Si ya existe, agregar sufijo único
            base_name="${cleaned_name%.*}"
            extension="${cleaned_name##*.}"
            counter=1
            while [ -f "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/documents/${base_name}_${counter}.${extension}" ]; do
                counter=$((counter + 1))
            done
            target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/documents/${base_name}_${counter}.${extension}"
        fi
        
        cp "$file" "$target_path"
        reorganized_count=$((reorganized_count + 1))
    fi
done

# Reorganizar CVs
for file in "$CONSOLIDATION_DIR/cv-documents"/*/* 2>/dev/null; do
    if [ -f "$file" ]; then
        cleaned_name=$(clean_filename "$(basename "$file")")
        target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/cv-documents/$cleaned_name"
        
        if [ -f "$target_path" ]; then
            base_name="${cleaned_name%.*}"
            extension="${cleaned_name##*.}"
            counter=1
            while [ -f "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/cv-documents/${base_name}_${counter}.${extension}" ]; do
                counter=$((counter + 1))
            done
            target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/cv-documents/${base_name}_${counter}.${extension}"
        fi
        
        cp "$file" "$target_path"
        reorganized_count=$((reorganized_count + 1))
    fi
done

# Reorganizar imágenes
for file in "$CONSOLIDATION_DIR/profile-images"/*/* 2>/dev/null; do
    if [ -f "$file" ]; then
        cleaned_name=$(clean_filename "$(basename "$file")")
        target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/profile-images/$cleaned_name"
        
        if [ -f "$target_path" ]; then
            base_name="${cleaned_name%.*}"
            extension="${cleaned_name##*.}"
            counter=1
            while [ -f "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/profile-images/${base_name}_${counter}.${extension}" ]; do
                counter=$((counter + 1))
            done
            target_path="$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/profile-images/${base_name}_${counter}.${extension}"
        fi
        
        cp "$file" "$target_path"
        reorganized_count=$((reorganized_count + 1))
    fi
done

echo "  ✅ $reorganized_count archivos reorganizados en estructura estándar"

echo "📦 5. Creando paquete final para subir al servidor..."
PACKAGE_NAME="RECOVERY_PACKAGE_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$PACKAGE_NAME" -C "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR" . 2>/dev/null

echo "📋 6. Generando manifiesto final..."
{
    echo "=== MANIFIESTO FINAL DE RECUPERACIÓN ==="
    echo "Fecha: $(date)"
    echo "Paquete: $PACKAGE_NAME"
    echo "Directorio: $CONSOLIDATION_DIR"
    echo ""
    
    echo "CONTENIDO DEL PAQUETE:"
    tar -tzf "$PACKAGE_NAME" | head -50
    echo ""
    
    echo "ESTADÍSTICAS FINALES:"
    docs_final=$(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/documents" -type f 2>/dev/null | wc -l)
    cv_final=$(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/cv-documents" -type f 2>/dev/null | wc -l)
    images_final=$(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/profile-images" -type f 2>/dev/null | wc -l)
    total_final=$((docs_final + cv_final + images_final))
    
    echo "📄 Documentos finales: $docs_final"
    echo "📋 CVs finales: $cv_final"
    echo "🖼️ Imágenes finales: $images_final"
    echo "📊 TOTAL EN PAQUETE: $total_final"
    
    echo ""
    echo "TAMAÑO DEL PAQUETE:"
    ls -lh "$PACKAGE_NAME" | awk '{print $5}'
    
    echo ""
    echo "PRÓXIMOS PASOS:"
    echo "1. Subir paquete al servidor:"
    echo "   scp $PACKAGE_NAME root@SERVER_IP:/root/"
    echo ""
    echo "2. En el servidor, ejecutar:"
    echo "   ./06_integrar_recuperacion.sh /root/$PACKAGE_NAME"
    
} > "$CONSOLIDATION_DIR/MANIFIESTO_FINAL.txt"

# Crear script de subida
cat > "SUBIR_PAQUETE.sh" << UPLOAD_SCRIPT
#!/bin/bash
echo "📤 SUBIENDO PAQUETE DE RECUPERACIÓN AL SERVIDOR"
echo "=============================================="
echo ""
echo "📦 Paquete: $PACKAGE_NAME"
echo "📊 Tamaño: \$(ls -lh $PACKAGE_NAME | awk '{print \$5}')"
echo ""
echo "🚀 Ejecutar:"
echo "scp $PACKAGE_NAME root@SERVER_IP:/root/"
echo ""
echo "⚠️ Reemplazar SERVER_IP con la IP real del servidor"
echo "⏱️ Tiempo estimado de subida: 5-30 minutos (según conexión)"
UPLOAD_SCRIPT

chmod +x "SUBIR_PAQUETE.sh"

echo ""
echo "✅ ¡CONSOLIDACIÓN COMPLETADA!"
echo "============================="
echo "📦 Paquete creado: $PACKAGE_NAME"
echo "📊 Tamaño: $(ls -lh "$PACKAGE_NAME" | awk '{print $5}')"
echo "📄 Documentos: $(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/documents" -type f 2>/dev/null | wc -l)"
echo "📋 CVs: $(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/cv-documents" -type f 2>/dev/null | wc -l)"
echo "🖼️ Imágenes: $(find "$CONSOLIDATION_DIR/ESTRUCTURA_ESTANDAR/profile-images" -type f 2>/dev/null | wc -l)"
echo ""
echo "📋 INFORMES GENERADOS:"
echo "  - $CONSOLIDATION_DIR/MANIFIESTO_FINAL.txt"
echo "  - $CONSOLIDATION_DIR/logs/estadisticas_consolidacion.txt"
echo "  - $CONSOLIDATION_DIR/logs/analisis_duplicados.txt"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   ./SUBIR_PAQUETE.sh"
