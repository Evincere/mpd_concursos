#!/bin/bash
# Script 2: Extracción mejorada para 3 fechas de respaldo

set -e

# Parámetros
FECHA_RESPALDO="$1"  # 03_agosto, 04_agosto, 05_agosto
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXTRACTION_DIR="/root/external_recovery/extractions"
TARGET_DIR="$EXTRACTION_DIR/$FECHA_RESPALDO"

if [ -z "$FECHA_RESPALDO" ]; then
    echo "❌ Error: Debe especificar la fecha de respaldo"
    echo "Uso: $0 [03_agosto|04_agosto|05_agosto]"
    exit 1
fi

echo "🔄 [$(date)] EXTRAYENDO DOCUMENTOS DEL RESPALDO: $FECHA_RESPALDO"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio destino: $TARGET_DIR"

# Verificar que estamos en el respaldo correcto
echo "🔍 Verificando estado del sistema..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep mpd-concursos

# Crear subdirectorios para esta fecha
mkdir -p "$TARGET_DIR/documents"
mkdir -p "$TARGET_DIR/cv-documents" 
mkdir -p "$TARGET_DIR/profile-images"
mkdir -p "$TARGET_DIR/metadata"

echo "📊 Creando inventario del respaldo $FECHA_RESPALDO..."

# Inventario de documentos principales
echo "📄 Documentos de inscripción..."
docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" -type f > "$TARGET_DIR/metadata/documents_inventory_$TIMESTAMP.txt" 2>/dev/null || echo "No se encontraron documentos de inscripción"

# Inventario de CV
echo "📋 Documentos CV..."
docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" -type f > "$TARGET_DIR/metadata/cv_inventory_$TIMESTAMP.txt" 2>/dev/null || echo "No se encontraron documentos CV"

# Inventario de fotos
echo "🖼️ Fotos de perfil..."
docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -type f > "$TARGET_DIR/metadata/images_inventory_$TIMESTAMP.txt" 2>/dev/null || echo "No se encontraron fotos"

# Contar archivos
DOCS_COUNT=$(cat "$TARGET_DIR/metadata/documents_inventory_$TIMESTAMP.txt" 2>/dev/null | wc -l)
CV_COUNT=$(cat "$TARGET_DIR/metadata/cv_inventory_$TIMESTAMP.txt" 2>/dev/null | wc -l)
IMAGES_COUNT=$(cat "$TARGET_DIR/metadata/images_inventory_$TIMESTAMP.txt" 2>/dev/null | wc -l)

echo "📊 INVENTARIO DEL RESPALDO $FECHA_RESPALDO:"
echo "   📄 Documentos de inscripción: $DOCS_COUNT"
echo "   📋 Documentos CV: $CV_COUNT"
echo "   🖼️ Fotos de perfil: $IMAGES_COUNT"
echo "   📁 Total archivos: $((DOCS_COUNT + CV_COUNT + IMAGES_COUNT))"

# Extraer archivos si existen
if [ "$DOCS_COUNT" -gt 0 ]; then
    echo "📦 Extrayendo documentos de inscripción..."
    docker cp mpd-concursos-backend-prod:/app/storage/documents/. "$TARGET_DIR/documents/" 2>/dev/null || echo "⚠️ Error copiando documentos"
fi

if [ "$CV_COUNT" -gt 0 ]; then
    echo "📦 Extrayendo documentos CV..."
    docker cp mpd-concursos-backend-prod:/app/storage/cv-documents/. "$TARGET_DIR/cv-documents/" 2>/dev/null || echo "⚠️ Error copiando CV"
fi

if [ "$IMAGES_COUNT" -gt 0 ]; then
    echo "📦 Extrayendo fotos de perfil..."
    docker cp mpd-concursos-backend-prod:/app/storage/profile-images/. "$TARGET_DIR/profile-images/" 2>/dev/null || echo "⚠️ Error copiando fotos"
fi

# Extraer información de la base de datos
echo "🗄️ Extrayendo información de la base de datos..."
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$TARGET_DIR/metadata/database_$FECHA_RESPALDO_$TIMESTAMP.sql"

# Crear reporte de usuarios con documentos
echo "👥 Generando reporte de usuarios..."
docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos -e "
SELECT 
    u.dni,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(d.id) as total_documentos,
    GROUP_CONCAT(d.document_type) as tipos_documentos
FROM user_entity u 
LEFT JOIN documents d ON u.id = d.user_id 
WHERE d.id IS NOT NULL
GROUP BY u.id
ORDER BY u.dni;
" > "$TARGET_DIR/metadata/usuarios_con_documentos_$FECHA_RESPALDO_$TIMESTAMP.csv"

# Crear archivo de metadatos
cat > "$TARGET_DIR/metadata/extraction_metadata_$TIMESTAMP.txt" << METADATA
FECHA_RESPALDO=$FECHA_RESPALDO
EXTRACTION_TIMESTAMP=$TIMESTAMP
EXTRACTION_DATE=$(date)
DOCS_EXTRACTED=$DOCS_COUNT
CV_EXTRACTED=$CV_COUNT
IMAGES_EXTRACTED=$IMAGES_COUNT
TOTAL_FILES=$((DOCS_COUNT + CV_COUNT + IMAGES_COUNT))
EXTRACTION_PATH=$TARGET_DIR
METADATA

# Verificar extracción
echo "✅ Verificando archivos extraídos..."
EXTRACTED_DOCS=$(find "$TARGET_DIR/documents" -name "*.pdf" 2>/dev/null | wc -l)
EXTRACTED_CV=$(find "$TARGET_DIR/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)
EXTRACTED_IMAGES=$(find "$TARGET_DIR/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)

echo "📊 VERIFICACIÓN DE EXTRACCIÓN:"
echo "   📄 Documentos extraídos: $EXTRACTED_DOCS/$DOCS_COUNT"
echo "   📋 CV extraídos: $EXTRACTED_CV/$CV_COUNT"
echo "   🖼️ Fotos extraídas: $EXTRACTED_IMAGES/$IMAGES_COUNT"

# Crear checksum para integridad
echo "🔐 Creando checksums para verificación de integridad..."
find "$TARGET_DIR" -type f -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | xargs md5sum > "$TARGET_DIR/metadata/checksums_$TIMESTAMP.md5" 2>/dev/null || echo "⚠️ Error creando checksums"

echo ""
echo "✅ EXTRACCIÓN COMPLETADA PARA: $FECHA_RESPALDO"
echo "📁 Archivos guardados en: $TARGET_DIR"
echo "📊 Total archivos extraídos: $((EXTRACTED_DOCS + EXTRACTED_CV + EXTRACTED_IMAGES))"

echo ""
echo "🎯 PRÓXIMO PASO:"
if [ "$FECHA_RESPALDO" = "03_agosto" ]; then
    echo "Restaurar al respaldo del 4 de agosto y ejecutar:"
    echo "./recovery_scripts_external/02_extract_from_backup_enhanced.sh 04_agosto"
elif [ "$FECHA_RESPALDO" = "04_agosto" ]; then
    echo "Restaurar al respaldo del 5 de agosto y ejecutar:"
    echo "./recovery_scripts_external/02_extract_from_backup_enhanced.sh 05_agosto"
elif [ "$FECHA_RESPALDO" = "05_agosto" ]; then
    echo "Todas las extracciones completadas. Proceder con consolidación:"
    echo "./recovery_scripts_external/03_consolidate_external.sh"
fi

echo ""
echo "💾 Para descargar esta extracción a máquina externa:"
echo "scp -r root@$(hostname -I | awk '{print $1}'):$TARGET_DIR ~/mpd_recovery_backup/extractions/"