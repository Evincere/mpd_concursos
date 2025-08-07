#!/bin/bash
# SCRIPT 2: EXPLORADOR EXHAUSTIVO DE BACKUPS
# ==========================================

set -e

FECHA_BACKUP="$1"  # 03_agosto, 04_agosto, 05_agosto
if [ -z "$FECHA_BACKUP" ]; then
    echo "❌ Error: Debe especificar la fecha del backup"
    echo "Uso: $0 [03_agosto|04_agosto|05_agosto]"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPLORATION_BASE="/root/EXPLORACION_$FECHA_BACKUP"
EXPLORATION_DIR="$EXPLORATION_BASE/exploracion_$TIMESTAMP"

echo "🔍 [$(date)] EXPLORANDO BACKUP: $FECHA_BACKUP"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio: $EXPLORATION_DIR"
echo "=================================================="

# Crear directorios de exploración
mkdir -p "$EXPLORATION_DIR"/{docker_info,volume_analysis,file_locations,downloads,logs}

echo "⏳ 1. Esperando estabilización del sistema después de restauración..."
sleep 30

echo "🐳 2. Analizando estado de Docker..."
{
    echo "=== CONTENEDORES DISPONIBLES ==="
    docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.CreatedAt}}"
    echo ""
    echo "=== VOLÚMENES DISPONIBLES ==="
    docker volume ls
    echo ""
    echo "=== REDES DISPONIBLES ==="
    docker network ls
    echo ""
    echo "=== IMÁGENES DISPONIBLES ==="
    docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.CreatedAt}}"
} > "$EXPLORATION_DIR/docker_info/estado_docker_$FECHA_BACKUP.txt"

echo "🔍 3. EXPLORACIÓN EXHAUSTIVA DE UBICACIONES POSIBLES..."

# Ubicación 1: Volúmenes con prefijo mpd_concursos_
echo "  📍 Explorando volúmenes con prefijo mpd_concursos_..."
for vol in $(docker volume ls --format "{{.Name}}" | grep "mpd_concursos" 2>/dev/null || true); do
    echo "    🔎 Analizando volumen: $vol"
    {
        echo "=== VOLUMEN: $vol ==="
        echo "Estructura de directorios:"
        docker run --rm -v "$vol":/data alpine find /data -type d | head -20
        echo ""
        echo "Archivos PDF:"
        docker run --rm -v "$vol":/data alpine find /data -name "*.pdf" | head -10
        echo "Total PDFs: $(docker run --rm -v "$vol":/data alpine find /data -name "*.pdf" | wc -l)"
        echo ""
        echo "Archivos de imagen:"
        docker run --rm -v "$vol":/data alpine find /data \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | head -10
        echo "Total imágenes: $(docker run --rm -v "$vol":/data alpine find /data \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l)"
        echo ""
        echo "Total archivos: $(docker run --rm -v "$vol":/data alpine find /data -type f | wc -l)"
        echo "================================"
    } >> "$EXPLORATION_DIR/volume_analysis/analisis_volumenes_$FECHA_BACKUP.txt"
done

# Ubicación 2: Volúmenes sin prefijo
echo "  📍 Explorando volúmenes sin prefijo mpd_concursos_..."
for vol in $(docker volume ls --format "{{.Name}}" | grep -E "(storage|mysql|backup)" | grep -v "mpd_concursos" 2>/dev/null || true); do
    echo "    🔎 Analizando volumen: $vol"
    {
        echo "=== VOLUMEN SIN PREFIJO: $vol ==="
        docker run --rm -v "$vol":/data alpine find /data -type f | head -10 2>/dev/null || echo "Volumen inaccesible"
        echo "Total archivos: $(docker run --rm -v "$vol":/data alpine find /data -type f | wc -l 2>/dev/null || echo "0")"
        echo "================================"
    } >> "$EXPLORATION_DIR/volume_analysis/analisis_volumenes_$FECHA_BACKUP.txt" 2>/dev/null || true
done

# Ubicación 3: Dentro de contenedores funcionando
echo "  📍 Explorando dentro de contenedores..."
for container in $(docker ps --format "{{.Names}}" | grep -E "(mpd|concursos|backend|frontend)" 2>/dev/null || true); do
    echo "    🔎 Explorando contenedor: $container"
    {
        echo "=== CONTENEDOR: $container ==="
        echo "Estructura en /app:"
        docker exec "$container" find /app -type d 2>/dev/null | head -20 || echo "Directorio /app no existe"
        echo ""
        echo "Archivos en /app/storage:"
        docker exec "$container" find /app/storage -type f 2>/dev/null | head -10 || echo "Directorio /app/storage no existe"
        echo "Total archivos en /app/storage: $(docker exec "$container" find /app/storage -type f 2>/dev/null | wc -l || echo "0")"
        echo ""
        echo "Estructura en /var:"
        docker exec "$container" find /var -name "*storage*" -type d 2>/dev/null || echo "No hay directorios storage en /var"
        echo ""
        echo "Estructura en /opt:"
        docker exec "$container" find /opt -type d 2>/dev/null | head -10 || echo "No hay directorios en /opt"
        echo "================================"
    } >> "$EXPLORATION_DIR/volume_analysis/analisis_contenedores_$FECHA_BACKUP.txt"
done

# Ubicación 4: Filesystem del host
echo "  📍 Explorando filesystem del host..."
{
    echo "=== FILESYSTEM DEL HOST ==="
    echo "Volúmenes en /var/lib/docker/volumes/:"
    find /var/lib/docker/volumes/ -maxdepth 1 -type d | sort
    echo ""
    echo "Archivos PDF en volumes:"
    find /var/lib/docker/volumes/ -name "*.pdf" | head -20
    echo "Total PDFs en host: $(find /var/lib/docker/volumes/ -name "*.pdf" | wc -l)"
    echo ""
    echo "Archivos de imagen en volumes:"
    find /var/lib/docker/volumes/ \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | head -10
    echo "Total imágenes en host: $(find /var/lib/docker/volumes/ \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l)"
    echo ""
    echo "Directorios sospechosos en /root:"
    find /root -maxdepth 2 -type d -name "*storage*" -o -name "*documents*" -o -name "*backup*" 2>/dev/null || echo "No hay directorios sospechosos"
    echo ""
    echo "Directorios sospechosos en /tmp:"
    find /tmp -maxdepth 2 -type d -name "*mpd*" -o -name "*concursos*" -o -name "*storage*" 2>/dev/null || echo "No hay directorios sospechosos en /tmp"
    echo "================================"
} > "$EXPLORATION_DIR/file_locations/analisis_filesystem_$FECHA_BACKUP.txt"

echo "🔢 4. Generando resúmenes cuantitativos..."
{
    echo "=== RESUMEN CUANTITATIVO - $FECHA_BACKUP ==="
    echo "Fecha de exploración: $(date)"
    echo ""
    echo "CONTENEDORES:"
    echo "- Total contenedores: $(docker ps -a | wc -l)"
    echo "- Contenedores activos: $(docker ps | wc -l)"
    echo ""
    echo "VOLÚMENES:"
    echo "- Total volúmenes: $(docker volume ls | wc -l)"
    echo "- Volúmenes con mpd_concursos: $(docker volume ls | grep mpd_concursos | wc -l)"
    echo ""
    echo "ARCHIVOS ENCONTRADOS:"
    TOTAL_PDFS=0
    TOTAL_IMAGES=0
    TOTAL_FILES=0
    
    # Sumar desde volúmenes
    for vol in $(docker volume ls --format "{{.Name}}" | grep -E "(storage|mpd)" 2>/dev/null || true); do
        PDF_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -name "*.pdf" 2>/dev/null | wc -l || echo "0")
        IMG_COUNT=$(docker run --rm -v "$vol":/data alpine find /data \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l || echo "0")
        FILE_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -type f 2>/dev/null | wc -l || echo "0")
        TOTAL_PDFS=$((TOTAL_PDFS + PDF_COUNT))
        TOTAL_IMAGES=$((TOTAL_IMAGES + IMG_COUNT))
        TOTAL_FILES=$((TOTAL_FILES + FILE_COUNT))
        echo "- Volumen $vol: $PDF_COUNT PDFs, $IMG_COUNT imágenes, $FILE_COUNT archivos total"
    done
    
    echo ""
    echo "TOTALES ENCONTRADOS:"
    echo "- PDFs totales: $TOTAL_PDFS"
    echo "- Imágenes totales: $TOTAL_IMAGES"
    echo "- Archivos totales: $TOTAL_FILES"
    echo ""
    echo "ARCHIVOS EN FILESYSTEM HOST:"
    echo "- PDFs en host: $(find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null | wc -l)"
    echo "- Imágenes en host: $(find /var/lib/docker/volumes/ \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)"
} > "$EXPLORATION_DIR/logs/resumen_cuantitativo_$FECHA_BACKUP.txt"

echo "📋 5. Identificando ubicaciones con contenido valioso..."
{
    echo "=== UBICACIONES VALIOSAS IDENTIFICADAS ==="
    echo "Fecha: $(date)"
    echo "Backup: $FECHA_BACKUP"
    echo ""
    
    # Evaluar cada ubicación
    echo "EVALUACIÓN POR UBICACIÓN:"
    
    for vol in $(docker volume ls --format "{{.Name}}" 2>/dev/null || true); do
        FILE_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -type f 2>/dev/null | wc -l || echo "0")
        if [ "$FILE_COUNT" -gt 10 ]; then
            PDF_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -name "*.pdf" 2>/dev/null | wc -l || echo "0")
            IMG_COUNT=$(docker run --rm -v "$vol":/data alpine find /data \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l || echo "0")
            echo "✅ VALIOSO - Volumen: $vol ($FILE_COUNT archivos, $PDF_COUNT PDFs, $IMG_COUNT imágenes)"
        fi
    done
    
    HOST_PDF_COUNT=$(find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null | wc -l)
    if [ "$HOST_PDF_COUNT" -gt 0 ]; then
        echo "✅ VALIOSO - Filesystem host: $HOST_PDF_COUNT PDFs encontrados"
    fi
    
} > "$EXPLORATION_DIR/logs/ubicaciones_valiosas_$FECHA_BACKUP.txt"

echo "📋 6. Creando inventario completo para descarga..."
{
    echo "=== INVENTARIO COMPLETO PARA DESCARGA - $FECHA_BACKUP ==="
    echo "Generado: $(date)"
    echo ""
    
    echo "VOLÚMENES A DESCARGAR:"
    for vol in $(docker volume ls --format "{{.Name}}" 2>/dev/null || true); do
        FILE_COUNT=$(docker run --rm -v "$vol":/data alpine find /data -type f 2>/dev/null | wc -l || echo "0")
        if [ "$FILE_COUNT" -gt 0 ]; then
            echo "- $vol (archivos: $FILE_COUNT)"
        fi
    done
    
    echo ""
    echo "RUTAS EN HOST A INCLUIR:"
    echo "- /var/lib/docker/volumes/ (completo)"
    echo "- /root/*storage* (si existe)"
    echo "- /root/*backup* (si existe)"
    echo "- /tmp/*concursos* (si existe)"
    
    echo ""
    echo "ARCHIVOS DE CONFIGURACIÓN:"
    echo "- docker-compose*.yml"
    echo "- .env*"
    echo "- Configuraciones de nginx si existen"
    
} > "$EXPLORATION_DIR/logs/inventario_descarga_$FECHA_BACKUP.txt"

echo "✅ ¡EXPLORACIÓN COMPLETADA!"
echo "=================================================="
echo "📁 Resultados en: $EXPLORATION_DIR"
echo "📊 Archivos de análisis creados: $(find "$EXPLORATION_DIR" -type f | wc -l)"
echo ""
echo "📋 RESUMEN RÁPIDO:"
cat "$EXPLORATION_DIR/logs/resumen_cuantitativo_$FECHA_BACKUP.txt" | grep "TOTALES ENCONTRADOS:" -A 10
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   Ejecutar: ./03_descargar_hallazgos.sh $FECHA_BACKUP"
echo ""
echo "⚠️ IMPORTANTE: Revisar manualmente los archivos de análisis antes de proceder"
