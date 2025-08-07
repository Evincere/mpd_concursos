#!/bin/bash
# SCRIPT 3: DESCARGADOR EXHAUSTIVO DE HALLAZGOS
# =============================================

set -e

FECHA_BACKUP="$1"
if [ -z "$FECHA_BACKUP" ]; then
    echo "❌ Error: Debe especificar la fecha del backup"
    echo "Uso: $0 [03_agosto|04_agosto|05_agosto]"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DOWNLOAD_BASE="/root/DESCARGA_$FECHA_BACKUP"
DOWNLOAD_DIR="$DOWNLOAD_BASE/descarga_$TIMESTAMP"

echo "📥 [$(date)] DESCARGANDO HALLAZGOS DEL BACKUP: $FECHA_BACKUP"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio: $DOWNLOAD_DIR"
echo "=================================================="

# Crear directorios de descarga
mkdir -p "$DOWNLOAD_DIR"/{volumes,filesystem,config,metadata}

echo "🔍 1. Identificando ubicaciones valiosas..."
UBICACIONES_VALIOSAS="/root/EXPLORACION_$FECHA_BACKUP/exploracion_*/logs/ubicaciones_valiosas_$FECHA_BACKUP.txt"
if [ -f $UBICACIONES_VALIOSAS ]; then
    echo "✅ Encontrado archivo de ubicaciones valiosas"
    cp $UBICACIONES_VALIOSAS "$DOWNLOAD_DIR/metadata/"
else
    echo "⚠️ No se encontró archivo de ubicaciones valiosas - procediendo con exploración básica"
fi

echo "📦 2. Descargando TODOS los volúmenes Docker..."
for vol in $(docker volume ls --format "{{.Name}}" 2>/dev/null || true); do
    FILE_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -type f 2>/dev/null | wc -l || echo "0")
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo "  📥 Descargando volumen: $vol ($FILE_COUNT archivos)"
        docker run --rm \
            -v "$vol":/data \
            -v "$DOWNLOAD_DIR/volumes":/backup \
            alpine tar czf "/backup/vol_${vol}_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" -C /data . 2>/dev/null || echo "    ⚠️ Error descargando $vol"
    else
        echo "  ⏭️ Omitiendo volumen vacío: $vol"
    fi
done

echo "🗂️ 3. Descargando archivos del filesystem host..."
echo "  📄 Archivos PDF en volumes..."
if [ "$(find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null | wc -l)" -gt 0 ]; then
    tar czf "$DOWNLOAD_DIR/filesystem/pdfs_host_volumes_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" \
        $(find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null) 2>/dev/null || echo "    ⚠️ Error comprimiendo PDFs"
    echo "    ✅ PDFs del host descargados"
else
    echo "    ⏭️ No se encontraron PDFs en volumes del host"
fi

echo "  🖼️ Archivos de imagen en volumes..."
if [ "$(find /var/lib/docker/volumes/ \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)" -gt 0 ]; then
    tar czf "$DOWNLOAD_DIR/filesystem/imagenes_host_volumes_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" \
        $(find /var/lib/docker/volumes/ \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null) 2>/dev/null || echo "    ⚠️ Error comprimiendo imágenes"
    echo "    ✅ Imágenes del host descargadas"
else
    echo "    ⏭️ No se encontraron imágenes en volumes del host"
fi

echo "  📁 Directorios sospechosos en /root..."
for dir in $(find /root -maxdepth 2 -type d -name "*storage*" -o -name "*backup*" -o -name "*documents*" 2>/dev/null || true); do
    if [ -d "$dir" ] && [ "$(find "$dir" -type f | wc -l)" -gt 0 ]; then
        echo "    📥 Descargando: $dir"
        tar czf "$DOWNLOAD_DIR/filesystem/root_$(basename "$dir")_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" -C "$(dirname "$dir")" "$(basename "$dir")" 2>/dev/null || echo "      ⚠️ Error con $dir"
    fi
done

echo "  📂 Directorios en /tmp..."
for dir in $(find /tmp -maxdepth 2 -type d -name "*mpd*" -o -name "*concursos*" 2>/dev/null || true); do
    if [ -d "$dir" ] && [ "$(find "$dir" -type f | wc -l)" -gt 0 ]; then
        echo "    📥 Descargando desde /tmp: $dir"
        tar czf "$DOWNLOAD_DIR/filesystem/tmp_$(basename "$dir")_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" -C "$(dirname "$dir")" "$(basename "$dir")" 2>/dev/null || echo "      ⚠️ Error con $dir"
    fi
done

echo "⚙️ 4. Descargando configuraciones actuales..."
cp docker-compose*.yml "$DOWNLOAD_DIR/config/" 2>/dev/null || echo "  ⚠️ No se encontraron docker-compose files"
cp .env* "$DOWNLOAD_DIR/config/" 2>/dev/null || echo "  ⚠️ No se encontraron archivos .env"

# Configuraciones de nginx si existen
if [ -f "/etc/nginx/nginx.conf" ]; then
    cp /etc/nginx/nginx.conf "$DOWNLOAD_DIR/config/nginx.conf" 2>/dev/null
fi

if [ -d "/etc/nginx/sites-enabled" ]; then
    tar czf "$DOWNLOAD_DIR/config/nginx_sites_${FECHA_BACKUP}_${TIMESTAMP}.tar.gz" -C /etc/nginx sites-enabled 2>/dev/null || echo "  ⚠️ Error con configuración nginx"
fi

echo "🗄️ 5. Backup de base de datos..."
if docker exec $(docker ps --format "{{.Names}}" | grep -E "(mysql|mariadb)" | head -1) mysqldump -u root -proot1234 --all-databases > "$DOWNLOAD_DIR/metadata/db_complete_${FECHA_BACKUP}_${TIMESTAMP}.sql" 2>/dev/null; then
    echo "  ✅ Base de datos completa respaldada"
else
    echo "  ⚠️ Intentando backup con credenciales alternativas..."
    docker exec $(docker ps --format "{{.Names}}" | grep -E "(mysql|mariadb)" | head -1) mysqldump -u concursos -pconcursos123 mpd_concursos > "$DOWNLOAD_DIR/metadata/db_mpd_${FECHA_BACKUP}_${TIMESTAMP}.sql" 2>/dev/null || echo "  ❌ No se pudo respaldar BD"
fi

echo "📊 6. Copiando análisis de exploración..."
EXPLORATION_DIR=$(find /root/EXPLORACION_$FECHA_BACKUP -name "exploracion_*" -type d | head -1)
if [ -d "$EXPLORATION_DIR" ]; then
    cp -r "$EXPLORATION_DIR" "$DOWNLOAD_DIR/metadata/analisis_exploracion/"
    echo "  ✅ Análisis de exploración copiado"
else
    echo "  ⚠️ No se encontró directorio de exploración"
fi

echo "🔢 7. Generando inventario final de descarga..."
{
    echo "=== INVENTARIO FINAL DE DESCARGA - $FECHA_BACKUP ==="
    echo "Timestamp: $TIMESTAMP"
    echo "Fecha: $(date)"
    echo "Directorio: $DOWNLOAD_DIR"
    echo ""
    echo "=== ARCHIVOS DESCARGADOS ==="
    find "$DOWNLOAD_DIR" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr
    echo ""
    echo "=== RESUMEN POR CATEGORÍA ==="
    echo "Volúmenes Docker:"
    find "$DOWNLOAD_DIR/volumes" -name "*.tar.gz" | wc -l
    echo "Archivos del filesystem:"
    find "$DOWNLOAD_DIR/filesystem" -name "*.tar.gz" | wc -l
    echo "Archivos de configuración:"
    find "$DOWNLOAD_DIR/config" -type f | wc -l
    echo "Archivos de metadata:"
    find "$DOWNLOAD_DIR/metadata" -type f | wc -l
    echo ""
    echo "=== TAMAÑO TOTAL ==="
    du -sh "$DOWNLOAD_DIR"
    echo ""
    echo "=== ESTIMACIÓN DE ARCHIVOS ÚNICOS ==="
    
    # Intentar estimar archivos únicos
    ESTIMATED_PDFS=0
    ESTIMATED_IMAGES=0
    for vol_file in "$DOWNLOAD_DIR/volumes"/*.tar.gz; do
        if [ -f "$vol_file" ]; then
            PDF_IN_TAR=$(tar -tzf "$vol_file" | grep "\.pdf$" | wc -l 2>/dev/null || echo "0")
            IMG_IN_TAR=$(tar -tzf "$vol_file" | grep -E "\.(jpg|jpeg|png)$" | wc -l 2>/dev/null || echo "0")
            ESTIMATED_PDFS=$((ESTIMATED_PDFS + PDF_IN_TAR))
            ESTIMATED_IMAGES=$((ESTIMATED_IMAGES + IMG_IN_TAR))
        fi
    done
    
    echo "PDFs estimados en volúmenes: $ESTIMATED_PDFS"
    echo "Imágenes estimadas en volúmenes: $ESTIMATED_IMAGES"
    echo ""
    echo "=== PRÓXIMO PASO ==="
    echo "Descargar a máquina externa:"
    echo "scp -r $DOWNLOAD_BASE user@external_machine:~/mpd_recovery_backups/"
} > "$DOWNLOAD_DIR/INVENTARIO_DESCARGA_$FECHA_BACKUP.txt"

# Crear script de descarga externa
cat > "$DOWNLOAD_BASE/DESCARGAR_A_EXTERNA.sh" << EXTERNAL_SCRIPT
#!/bin/bash
echo "📥 DESCARGANDO HALLAZGOS DE $FECHA_BACKUP A MÁQUINA EXTERNA"
echo "=========================================================="
echo ""
echo "🔧 EJECUTAR EN MÁQUINA EXTERNA:"
echo "mkdir -p ~/mpd_recovery_backups/$FECHA_BACKUP"
echo "scp -r root@$(hostname -I | awk '{print $1}'):$DOWNLOAD_BASE ~/mpd_recovery_backups/"
echo ""
echo "📊 TAMAÑO TOTAL DE DESCARGA:"
du -sh $DOWNLOAD_BASE
echo ""
echo "📁 ARCHIVOS A DESCARGAR:"
find $DOWNLOAD_BASE -name "*.tar.gz" | wc -l | awk '{print $1 " archivos comprimidos"}'
echo ""
echo "⏱️ TIEMPO ESTIMADO DE DESCARGA:"
echo "Conexión rápida (100Mbps): 5-15 minutos"
echo "Conexión media (10Mbps): 30-60 minutos"
echo "Conexión lenta (1Mbps): 2-5 horas"
EXTERNAL_SCRIPT

chmod +x "$DOWNLOAD_BASE/DESCARGAR_A_EXTERNA.sh"

echo ""
echo "✅ ¡DESCARGA DE HALLAZGOS COMPLETADA!"
echo "=================================================="
echo "📁 Ubicación: $DOWNLOAD_DIR"
echo "📊 Tamaño total: $(du -sh "$DOWNLOAD_DIR" | awk '{print $1}')"
echo "📦 Archivos comprimidos: $(find "$DOWNLOAD_DIR" -name "*.tar.gz" | wc -l)"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   1. Ejecutar: $DOWNLOAD_BASE/DESCARGAR_A_EXTERNA.sh"
echo "   2. Descargar a máquina externa"
echo "   3. Si es el último backup, proceder con análisis en máquina externa"
echo ""
echo "📋 INVENTARIO COMPLETO EN:"
echo "   $DOWNLOAD_DIR/INVENTARIO_DESCARGA_$FECHA_BACKUP.txt"
