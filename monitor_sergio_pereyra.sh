#!/bin/bash

DNI="26598410"
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
USER_DIR="$DOCKER_STORAGE/documents/$DNI"

echo "🔍 Monitoreando usuario Sergio Pereyra (DNI: $DNI)"
echo "📂 Directorio: $USER_DIR"
echo "⏰ Presiona Ctrl+C para salir"
echo

while true; do
    clear
    echo "=== MONITOREO SERGIO PEREYRA - $(date) ==="
    echo
    
    if [ -d "$USER_DIR" ]; then
        echo "✅ Directorio existe"
        echo "📄 Archivos actuales:"
        ls -la "$USER_DIR" 2>/dev/null || echo "   (vacío)"
        echo
        echo "📊 Estadísticas:"
        file_count=$(find "$USER_DIR" -type f 2>/dev/null | wc -l)
        total_size=$(du -sh "$USER_DIR" 2>/dev/null | cut -f1)
        echo "   • Archivos: $file_count"
        echo "   • Tamaño: $total_size"
    else
        echo "❌ Directorio no existe: $USER_DIR"
    fi
    
    echo
    echo "🔄 Actualizando en 3 segundos..."
    sleep 3
done
