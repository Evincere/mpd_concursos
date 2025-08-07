#!/bin/bash
# Script 7: Procesar respaldos locales como fuente adicional de recuperación

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUPS_DIR="/opt/mpd-monitor/backups"
EXTRACTION_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

echo "🔄 [$(date)] PROCESANDO RESPALDOS LOCALES COMO FUENTE ADICIONAL"
echo "=============================================================="
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio de extracción: $EXTRACTION_DIR"

# Crear directorio de extracción
mkdir -p "$EXTRACTION_DIR"/{04_agosto,05_agosto,06_agosto,metadata}

echo ""
echo "📋 1. Identificando respaldos locales disponibles..."

# Listar respaldos disponibles
echo "✅ Respaldos locales encontrados:"
ls -la "$LOCAL_BACKUPS_DIR"/files_backup_*.tar.gz | grep -E "20250804|20250805|20250806"

echo ""
echo "🔍 2. Procesando respaldos por fecha..."

# Función para procesar un backup local
process_local_backup() {
    local backup_file="$1"
    local fecha_label="$2"
    local target_dir="$EXTRACTION_DIR/$fecha_label"
    
    echo "  📦 Procesando: $(basename "$backup_file")"
    
    # Crear directorio temporal para extracción
    local temp_dir="/tmp/local_backup_$fecha_label"
    mkdir -p "$temp_dir"
    
    # Extraer backup
    tar -xzf "$backup_file" -C "$temp_dir" 2>/dev/null || {
        echo "    ❌ Error extrayendo $backup_file"
        return 1
    }
    
    # Verificar estructura extraída
    if [ -d "$temp_dir/_data" ]; then
        echo "    ✅ Estructura _data encontrada"
        
        # Copiar archivos organizados
        if [ -d "$temp_dir/_data/documents" ]; then
            cp -r "$temp_dir/_data/documents" "$target_dir/" 2>/dev/null || true
            local docs_count=$(find "$target_dir/documents" -name "*.pdf" 2>/dev/null | wc -l)
            echo "    📄 Documentos extraídos: $docs_count"
        fi
        
        if [ -d "$temp_dir/_data/cv-documents" ]; then
            cp -r "$temp_dir/_data/cv-documents" "$target_dir/" 2>/dev/null || true
            local cv_count=$(find "$target_dir/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)
            echo "    📋 CV extraídos: $cv_count"
        fi
        
        if [ -d "$temp_dir/_data/profile-images" ]; then
            cp -r "$temp_dir/_data/profile-images" "$target_dir/" 2>/dev/null || true
            local img_count=$(find "$target_dir/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
            echo "    🖼️ Imágenes extraídas: $img_count"
        fi
        
        # Crear inventario
        {
            echo "=== INVENTARIO BACKUP LOCAL $fecha_label ==="
            echo "Archivo origen: $backup_file"
            echo "Fecha de procesamiento: $(date)"
            echo ""
            echo "ARCHIVOS EXTRAÍDOS:"
            echo "- Documentos PDF: $(find "$target_dir/documents" -name "*.pdf" 2>/dev/null | wc -l)"
            echo "- CV PDF: $(find "$target_dir/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)"
            echo "- Imágenes: $(find "$target_dir/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)"
            echo ""
            echo "USUARIOS CON DOCUMENTOS:"
            ls "$target_dir/documents/" 2>/dev/null | head -20 || echo "No hay documentos"
        } > "$EXTRACTION_DIR/metadata/inventario_$fecha_label.txt"
        
    else
        echo "    ⚠️ Estructura no reconocida en $backup_file"
    fi
    
    # Limpiar directorio temporal
    rm -rf "$temp_dir"
}

# Procesar respaldos específicos del período crítico
echo ""
echo "📦 Procesando backup del 4 de agosto..."
if [ -f "$LOCAL_BACKUPS_DIR/files_backup_20250804_120001.tar.gz" ]; then
    process_local_backup "$LOCAL_BACKUPS_DIR/files_backup_20250804_120001.tar.gz" "04_agosto"
else
    echo "  ⚠️ Backup del 4 de agosto no encontrado"
fi

echo ""
echo "📦 Procesando backup del 5 de agosto..."
if [ -f "$LOCAL_BACKUPS_DIR/files_backup_20250805_060001.tar.gz" ]; then
    process_local_backup "$LOCAL_BACKUPS_DIR/files_backup_20250805_060001.tar.gz" "05_agosto"
else
    echo "  ⚠️ Backup del 5 de agosto no encontrado"
fi

echo ""
echo "📦 Procesando backup del 6 de agosto..."
if [ -f "$LOCAL_BACKUPS_DIR/files_backup_20250806_000001.tar.gz" ]; then
    process_local_backup "$LOCAL_BACKUPS_DIR/files_backup_20250806_000001.tar.gz" "06_agosto"
else
    echo "  ⚠️ Backup del 6 de agosto no encontrado"
fi

echo ""
echo "🔍 3. Identificando usuarios críticos en respaldos locales..."

# Lista de usuarios críticos
USUARIOS_CRITICOS="23520516 24467884 26569905 27544194 27651864 27931606 28226117 28511308 29267571 29277615 30108615 30724462 30984162 31432016 31737951 31821855 31854739 32161223 33579011 33583216 36746208 36859594 37002217 37513884 38207799 39238641 40787955 41991997"

{
    echo "=== USUARIOS CRÍTICOS EN RESPALDOS LOCALES ==="
    echo "Fecha de análisis: $(date)"
    echo ""
    
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        echo "📅 BACKUP $fecha:"
        if [ -d "$EXTRACTION_DIR/$fecha/documents" ]; then
            for dni in $USUARIOS_CRITICOS; do
                if [ -d "$EXTRACTION_DIR/$fecha/documents/$dni" ]; then
                    doc_count=$(find "$EXTRACTION_DIR/$fecha/documents/$dni" -name "*.pdf" | wc -l)
                    echo "  ✅ $dni: $doc_count documentos"
                fi
            done
        else
            echo "  ⚠️ No hay documentos en este backup"
        fi
        echo ""
    done
} > "$EXTRACTION_DIR/metadata/usuarios_criticos_encontrados.txt"

echo ""
echo "📊 4. Generando estadísticas comparativas..."

{
    echo "=== ESTADÍSTICAS COMPARATIVAS - RESPALDOS LOCALES ==="
    echo "Generado: $(date)"
    echo ""
    
    echo "SISTEMA ACTUAL:"
    echo "- Documentos PDF: $(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l)"
    echo "- CV PDF: $(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" | wc -l)"
    echo "- Imágenes: $(docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l)"
    echo ""
    
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        if [ -d "$EXTRACTION_DIR/$fecha" ]; then
            echo "BACKUP LOCAL $fecha:"
            echo "- Documentos PDF: $(find "$EXTRACTION_DIR/$fecha/documents" -name "*.pdf" 2>/dev/null | wc -l)"
            echo "- CV PDF: $(find "$EXTRACTION_DIR/$fecha/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)"
            echo "- Imágenes: $(find "$EXTRACTION_DIR/$fecha/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)"
            echo ""
        fi
    done
} > "$EXTRACTION_DIR/metadata/estadisticas_comparativas.txt"

echo ""
echo "📦 5. Creando paquete para descarga..."

# Crear paquete comprimido
cd /root
tar -czf "BACKUPS_LOCALES_EXTRAIDOS_$TIMESTAMP.tar.gz" BACKUPS_LOCALES_EXTRAIDOS/

echo ""
echo "✅ PROCESAMIENTO DE RESPALDOS LOCALES COMPLETADO"
echo "================================================"
echo "📁 Archivos extraídos en: $EXTRACTION_DIR"
echo "📦 Paquete creado: /root/BACKUPS_LOCALES_EXTRAIDOS_$TIMESTAMP.tar.gz"
echo "📊 Tamaño del paquete: $(du -sh /root/BACKUPS_LOCALES_EXTRAIDOS_$TIMESTAMP.tar.gz | cut -f1)"

echo ""
echo "📋 ARCHIVOS GENERADOS:"
echo "  - $EXTRACTION_DIR/metadata/inventario_04_agosto.txt"
echo "  - $EXTRACTION_DIR/metadata/inventario_05_agosto.txt"
echo "  - $EXTRACTION_DIR/metadata/inventario_06_agosto.txt"
echo "  - $EXTRACTION_DIR/metadata/usuarios_criticos_encontrados.txt"
echo "  - $EXTRACTION_DIR/metadata/estadisticas_comparativas.txt"

echo ""
echo "🎯 PRÓXIMO PASO:"
echo "   1. Descargar paquete a máquina externa"
echo "   2. Analizar contenido detalladamente"
echo "   3. Integrar con plan de recuperación principal"

echo ""
echo "💾 COMANDO PARA DESCARGA:"
echo "scp root@$(hostname -I | awk '{print $1}'):/root/BACKUPS_LOCALES_EXTRAIDOS_$TIMESTAMP.tar.gz ."