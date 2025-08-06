#!/bin/bash
# Script 1: Preparación (ejecutar en servidor actual - 5/8)

set -e

echo "🔄 [$(date)] PREPARANDO RECUPERACIÓN HÍBRIDA"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECOVERY_DIR="/root/recovery_temp_$TIMESTAMP"
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

# Crear directorio de trabajo
mkdir -p "$RECOVERY_DIR"
cd "$RECOVERY_DIR"

echo "📋 Generando lista de documentos a recuperar..."

# Generar lista desde BD actual
docker exec mpd-concursos-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT DISTINCT file_path 
FROM documents 
WHERE upload_date >= '2025-08-01' 
  AND upload_date <= '2025-08-03 08:00:00' 
  AND file_path IS NOT NULL
ORDER BY file_path;
" > documentos_a_recuperar.txt

# Limpiar header
tail -n +2 documentos_a_recuperar.txt > documentos_limpios.txt

echo "📊 Total de archivos a recuperar: $(wc -l < documentos_limpios.txt)"

# Crear info del proceso
cat > info_recuperacion.txt << INNER_EOF
PROCESO DE RECUPERACIÓN HÍBRIDA
================================
Fecha de preparación: $(date)
Directorio de trabajo: $RECOVERY_DIR
Archivos a recuperar: $(wc -l < documentos_limpios.txt)
Storage path: $STORAGE_PATH

SIGUIENTE PASO:
1. Descargar este directorio completo a tu máquina local
2. Restaurar backup del 3/8
3. Subir toolkit y ejecutar script 02
INNER_EOF

echo "✅ Preparación completada en: $RECOVERY_DIR"
echo "⬇️  DESCARGAR ESTE DIRECTORIO A TU MÁQUINA LOCAL ANTES DE LA RESTAURACIÓN"

