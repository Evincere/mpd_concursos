#!/bin/bash
# Script para explorar ubicación real de archivos en cada backup

echo "🔍 EXPLORANDO UBICACIÓN DE ARCHIVOS EN BACKUP"
echo "================================================"

echo "📊 1. Contenedores disponibles:"
docker ps -a --format "table {{.Names}}\\t{{.Status}}"

echo ""
echo "📁 2. Volúmenes Docker disponibles:"
docker volume ls | grep -E "(storage|mpd|backup)"

echo ""
echo "🗂️ 3. Explorando estructura de archivos por ubicación posible:"

# Ubicación 1: Volúmenes con prefijo mpd_concursos_
echo ""
echo "--- VOLUMEN: mpd_concursos_storage_data_prod ---"
docker run --rm -v mpd_concursos_storage_data_prod:/data alpine find /data -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.png" \) | head -5
docker run --rm -v mpd_concursos_storage_data_prod:/data alpine find /data -type f | wc -l

# Ubicación 2: Volúmenes sin prefijo  
echo ""
echo "--- VOLUMEN: storage_data_prod (sin prefijo) ---"
docker run --rm -v storage_data_prod:/data alpine find /data -type f 2>/dev/null | head -5 || echo "Volumen no existe"

# Ubicación 3: Directamente en contenedores si están funcionando
echo ""
echo "--- DENTRO DEL CONTENEDOR BACKEND (si existe) ---"
docker exec mpd-concursos-backend-prod find /app/storage -type f | head -5 2>/dev/null || echo "Contenedor no disponible"

# Ubicación 4: Rutas absolutas del host
echo ""
echo "--- BÚSQUEDA EN HOST /var/lib/docker/volumes/ ---"
find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null | head -5

echo ""
echo "🔢 RESUMEN DE CONTEOS:"
echo "Total archivos en mpd_concursos_storage_data_prod: $(docker run --rm -v mpd_concursos_storage_data_prod:/data alpine find /data -type f | wc -l)"
echo "Total PDFs en host volumes: $(find /var/lib/docker/volumes/ -name "*.pdf" 2>/dev/null | wc -l)"

