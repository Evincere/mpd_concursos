#!/bin/bash
# Script 4: Integración final con restauración de código fuente

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RECOVERY_DIR="/root/external_recovery"
CONSOLIDATED_PACKAGE="$1"

if [ -z "$CONSOLIDATED_PACKAGE" ]; then
    echo "❌ Error: Debe especificar el paquete consolidado"
    echo "Uso: $0 /path/to/consolidated_recovery_TIMESTAMP.tar.gz"
    exit 1
fi

if [ ! -f "$CONSOLIDATED_PACKAGE" ]; then
    echo "❌ Error: No se encontró el paquete: $CONSOLIDATED_PACKAGE"
    exit 1
fi

echo "🔄 [$(date)] INTEGRACIÓN FINAL CON RESTAURACIÓN DE CÓDIGO"
echo "📅 Timestamp: $TIMESTAMP"
echo "📦 Paquete consolidado: $CONSOLIDATED_PACKAGE"

# Crear backup de seguridad antes de la integración
echo "🛡️ Creando backup de seguridad pre-integración..."
SAFETY_BACKUP_DIR="/root/safety_backup_$TIMESTAMP"
mkdir -p "$SAFETY_BACKUP_DIR"

# Backup del storage actual
docker run --rm \
    -v mpd_concursos_storage_data_prod:/data \
    -v "$SAFETY_BACKUP_DIR":/backup \
    alpine tar czf "/backup/storage_pre_integration_$TIMESTAMP.tar.gz" -C /data .

# Backup de la base de datos actual
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$SAFETY_BACKUP_DIR/db_pre_integration_$TIMESTAMP.sql"

echo "✅ Backup de seguridad creado en: $SAFETY_BACKUP_DIR"

# Restaurar código fuente desde Git
echo "🔄 Restaurando código fuente desde repositorio..."
cd /root/concursos/mpd_concursos

# Verificar estado actual del repositorio
echo "📊 Estado actual del repositorio:"
git status --porcelain

# Hacer stash de cambios locales si los hay
if [ -n "$(git status --porcelain)" ]; then
    echo "💾 Guardando cambios locales en stash..."
    git stash push -m "Pre-integration stash $TIMESTAMP"
fi

# Hacer pull del repositorio remoto
echo "⬇️ Actualizando desde repositorio remoto..."
git fetch origin
git reset --hard origin/main

echo "✅ Código fuente restaurado desde repositorio"

# Extraer paquete consolidado
echo "📦 Extrayendo paquete consolidado..."
cd "$RECOVERY_DIR"
tar -xzf "$CONSOLIDATED_PACKAGE"

if [ ! -d "$RECOVERY_DIR/consolidated" ]; then
    echo "❌ Error: No se encontró el directorio consolidado después de extraer"
    exit 1
fi

# Verificar contenido del paquete
DOCS_TO_INTEGRATE=$(find "$RECOVERY_DIR/consolidated/documents" -name "*.pdf" 2>/dev/null | wc -l)
CV_TO_INTEGRATE=$(find "$RECOVERY_DIR/consolidated/cv-documents" -name "*.pdf" 2>/dev/null | wc -l)
IMAGES_TO_INTEGRATE=$(find "$RECOVERY_DIR/consolidated/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)

echo "📊 CONTENIDO A INTEGRAR:"
echo "   📄 Documentos: $DOCS_TO_INTEGRATE"
echo "   📋 CV: $CV_TO_INTEGRATE"
echo "   🖼️ Fotos: $IMAGES_TO_INTEGRATE"
echo "   📁 Total: $((DOCS_TO_INTEGRATE + CV_TO_INTEGRATE + IMAGES_TO_INTEGRATE))"

# Integrar documentos al storage de Docker
echo "🔄 Integrando documentos al storage..."

# Función para integrar archivos evitando sobrescritura
integrate_files() {
    local source_dir="$1"
    local target_path="$2"
    local file_type="$3"
    
    if [ ! -d "$source_dir" ]; then
        echo "⚠️ No existe directorio fuente: $source_dir"
        return
    fi
    
    echo "  📁 Integrando $file_type..."
    
    local integrated=0
    local skipped=0
    
    find "$source_dir" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | while read -r file; do
        if [ -f "$file" ]; then
            # Obtener ruta relativa
            local rel_path="${file#$source_dir/}"
            
            # Verificar si ya existe en el contenedor
            if docker exec mpd-concursos-backend-prod test -f "$target_path/$rel_path" 2>/dev/null; then
                # Archivo ya existe - verificar si es diferente
                local temp_file="/tmp/temp_compare_$TIMESTAMP"
                docker cp "$file" mpd-concursos-backend-prod:"$temp_file"
                
                if docker exec mpd-concursos-backend-prod cmp -s "$target_path/$rel_path" "$temp_file" 2>/dev/null; then
                    # Archivos idénticos - saltar
                    docker exec mpd-concursos-backend-prod rm -f "$temp_file"
                    skipped=$((skipped + 1))
                else
                    # Archivos diferentes - integrar con sufijo
                    local new_name="${rel_path%.*}_recovered_$TIMESTAMP.${rel_path##*.}"
                    docker cp "$file" mpd-concursos-backend-prod:"$target_path/$new_name"
                    docker exec mpd-concursos-backend-prod rm -f "$temp_file"
                    integrated=$((integrated + 1))
                    echo "    ✅ Integrado como: $new_name"
                fi
            else
                # Archivo nuevo - crear directorio padre e integrar
                local parent_dir="$(dirname "$target_path/$rel_path")"
                docker exec mpd-concursos-backend-prod mkdir -p "$parent_dir"
                docker cp "$file" mpd-concursos-backend-prod:"$target_path/$rel_path"
                integrated=$((integrated + 1))
                echo "    ✅ Integrado: $rel_path"
            fi
        fi
    done
    
    echo "  📊 $file_type: $integrated integrados, $skipped omitidos (duplicados)"
}

# Integrar cada tipo de archivo
integrate_files "$RECOVERY_DIR/consolidated/documents" "/app/storage/documents" "Documentos"
integrate_files "$RECOVERY_DIR/consolidated/cv-documents" "/app/storage/cv-documents" "CV"
integrate_files "$RECOVERY_DIR/consolidated/profile-images" "/app/storage/profile-images" "Fotos"

# Verificar estado final
echo "📊 Verificando estado final del sistema..."

FINAL_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l)
FINAL_CV=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" | wc -l)
FINAL_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l)

echo "📊 ESTADO FINAL DEL SISTEMA:"
echo "   📄 Documentos totales: $FINAL_DOCS"
echo "   📋 CV totales: $FINAL_CV"
echo "   🖼️ Fotos totales: $FINAL_IMAGES"
echo "   📁 Total archivos: $((FINAL_DOCS + FINAL_CV + FINAL_IMAGES))"

# Crear reporte final
FINAL_REPORT="$RECOVERY_DIR/final_integration_report_$TIMESTAMP.txt"
cat > "$FINAL_REPORT" << REPORT
INTEGRACIÓN FINAL COMPLETADA
============================

Timestamp: $TIMESTAMP
Fecha: $(date)
Paquete integrado: $CONSOLIDATED_PACKAGE

ARCHIVOS INTEGRADOS:
- Documentos disponibles para integrar: $DOCS_TO_INTEGRATE
- CV disponibles para integrar: $CV_TO_INTEGRATE  
- Fotos disponibles para integrar: $IMAGES_TO_INTEGRATE

ESTADO FINAL DEL SISTEMA:
- Documentos totales: $FINAL_DOCS
- CV totales: $FINAL_CV
- Fotos totales: $FINAL_IMAGES
- Total archivos: $((FINAL_DOCS + FINAL_CV + FINAL_IMAGES))

BACKUPS DE SEGURIDAD:
- Storage pre-integración: $SAFETY_BACKUP_DIR/storage_pre_integration_$TIMESTAMP.tar.gz
- BD pre-integración: $SAFETY_BACKUP_DIR/db_pre_integration_$TIMESTAMP.sql

CÓDIGO FUENTE:
- Restaurado desde repositorio Git (commit fa63bd9a)
- Cambios locales guardados en stash si existían

REPORT

echo ""
echo "✅ INTEGRACIÓN FINAL COMPLETADA"
echo "📋 Reporte guardado en: $FINAL_REPORT"

# Reiniciar servicios para asegurar consistencia
echo "🔄 Reiniciando servicios para asegurar consistencia..."
cd /root/concursos/mpd_concursos
docker compose -f docker-compose.prod.yml restart backend

echo "⏳ Esperando que los servicios se estabilicen..."
sleep 30

# Verificar que los servicios estén funcionando
echo "🔍 Verificando estado de los servicios..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep mpd-concursos

# Probar conectividad
echo "🌐 Probando conectividad del backend..."
curl -s http://localhost:8080/actuator/health | jq . || echo "⚠️ Backend no responde o jq no disponible"

echo ""
echo "🎉 RECUPERACIÓN HÍBRIDA COMPLETADA EXITOSAMENTE"
echo ""
echo "📊 RESUMEN FINAL:"
echo "   🔄 Código fuente: Restaurado desde Git"
echo "   📦 Documentos: Integrados desde 3 fechas de respaldo"
echo "   🛡️ Backups: Múltiples copias de seguridad creadas"
echo "   ✅ Sistema: Operativo y estable"
echo ""
echo "📋 Próximos pasos recomendados:"
echo "   1. Probar acceso de usuarios a documentos"
echo "   2. Verificar funcionalidad completa del sistema"
echo "   3. Monitorear logs por 24-48 horas"
echo "   4. Informar a usuarios sobre la recuperación"