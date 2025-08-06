#!/bin/bash

# =======================================================
# SCRIPT DE RECUPERACIÓN - PROCESO HÍBRIDO
# Fecha: 2025-08-05
# Objetivo: Extraer documentos perdidos del backup del 3/8
# =======================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECOVERY_DIR="/root/concursos/mpd_concursos/recovery_temp_$TIMESTAMP"
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

echo "🔄 [$(date)] INICIANDO PROCESO DE RECUPERACIÓN HÍBRIDA"
echo "📁 Directorio de recuperación: $RECOVERY_DIR"

# 1. Crear directorio de trabajo temporal
mkdir -p "$RECOVERY_DIR"
cd "$RECOVERY_DIR"

# 2. Generar lista de archivos a recuperar desde la BD
echo "📋 Generando lista de documentos a recuperar..."
docker exec mpd-concursos-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT DISTINCT file_path 
FROM documents 
WHERE upload_date >= '2025-08-01' 
  AND upload_date <= '2025-08-03 08:00:00' 
  AND file_path IS NOT NULL
ORDER BY file_path;
" > documentos_a_recuperar.txt

# 3. Limpiar header de MySQL
tail -n +2 documentos_a_recuperar.txt > documentos_limpios.txt

echo "📊 Total de archivos a recuperar: $(wc -l < documentos_limpios.txt)"

# 4. Crear script de copia masiva
echo "📝 Generando script de copia..."
cat > copy_files.sh << 'INNER_EOF'
#!/bin/bash
while IFS= read -r file_path; do
    if [ -f "$STORAGE_PATH/$file_path" ]; then
        # Crear directorio si no existe
        mkdir -p "$(dirname "recovered_files/$file_path")"
        # Copiar archivo
        cp "$STORAGE_PATH/$file_path" "recovered_files/$file_path"
        echo "✅ Copiado: $file_path"
    else
        echo "❌ No encontrado: $file_path"
    fi
done < documentos_limpios.txt
INNER_EOF

chmod +x copy_files.sh

echo "🎯 Script de recuperación preparado en: $RECOVERY_DIR"
echo "📋 Para ejecutar manualmente después de la restauración del 3/8:"
echo "   cd $RECOVERY_DIR"
echo "   ./copy_files.sh"
echo ""
echo "📦 Los archivos se guardarán en: $RECOVERY_DIR/recovered_files/"

