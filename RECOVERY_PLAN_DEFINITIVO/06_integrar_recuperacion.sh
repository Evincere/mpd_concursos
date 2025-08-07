#!/bin/bash
# SCRIPT 6: INTEGRADOR FINAL DE RECUPERACIÓN (SERVIDOR)
# =====================================================

set -e

PACKAGE_FILE="$1"
if [ -z "$PACKAGE_FILE" ] || [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ Error: Debe especificar archivo de paquete válido"
    echo "Uso: $0 /path/to/RECOVERY_PACKAGE_YYYYMMDD_HHMMSS.tar.gz"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
INTEGRATION_DIR="/root/INTEGRACION_RECUPERACION_$TIMESTAMP"
SAFETY_BACKUP_DIR="/root/SAFETY_BACKUP_PRE_INTEGRATION_$TIMESTAMP"

echo "🔄 [$(date)] INTEGRACIÓN FINAL DE RECUPERACIÓN"
echo "=============================================="
echo "📦 Paquete: $PACKAGE_FILE"
echo "📁 Directorio de integración: $INTEGRATION_DIR"
echo "🛡️ Backup de seguridad: $SAFETY_BACKUP_DIR"

# PASO 0: VERIFICACIONES CRÍTICAS PREVIAS
echo "🔍 0. VERIFICACIONES CRÍTICAS PREVIAS..."

echo "  🐳 Verificando estado de contenedores..."
if ! docker ps | grep -E "(mpd-concursos|backend|mysql)" > /dev/null; then
    echo "  ❌ ERROR: Contenedores Docker no están funcionando"
    echo "  🔧 Intentando iniciar servicios..."
    cd /root/concursos/mpd_concursos
    docker compose -f docker-compose.prod.yml up -d
    sleep 30
    
    if ! docker ps | grep -E "(mpd-concursos|backend|mysql)" > /dev/null; then
        echo "  ❌ ERROR CRÍTICO: No se pueden iniciar los contenedores"
        echo "  🚨 ABORTANDO INTEGRACIÓN"
        exit 1
    fi
fi

echo "  ✅ Contenedores funcionando correctamente"

echo "  🗄️ Verificando acceso a base de datos..."
if ! docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 -e "SELECT 1;" > /dev/null 2>&1; then
    echo "  ⚠️ Problemas con credenciales de MySQL - intentando alternativas..."
    if ! docker exec mpd-concursos-mysql-prod mysql -u concursos -pconcursos123 -e "SELECT 1;" > /dev/null 2>&1; then
        echo "  ❌ ERROR: No se puede acceder a la base de datos"
        echo "  🚨 ABORTANDO INTEGRACIÓN"
        exit 1
    fi
fi

echo "  ✅ Base de datos accesible"

echo "  📊 Contando archivos actuales..."
CURRENT_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" 2>/dev/null | wc -l || echo "0")
CURRENT_CVS=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" 2>/dev/null | wc -l || echo "0")
CURRENT_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l || echo "0")
CURRENT_TOTAL=$((CURRENT_DOCS + CURRENT_CVS + CURRENT_IMAGES))

echo "  📄 Documentos actuales: $CURRENT_DOCS"
echo "  📋 CVs actuales: $CURRENT_CVS"
echo "  🖼️ Imágenes actuales: $CURRENT_IMAGES"
echo "  📊 Total actual: $CURRENT_TOTAL"

if [ "$CURRENT_TOTAL" -eq 0 ]; then
    echo "  ⚠️ ADVERTENCIA: No se detectan archivos en el sistema actual"
    echo "  ❓ ¿Continuar? (y/N)"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo "  🚨 ABORTANDO por decisión del usuario"
        exit 1
    fi
fi

# PASO 1: BACKUP DE SEGURIDAD CRÍTICO
echo "🛡️ 1. CREANDO BACKUP DE SEGURIDAD CRÍTICO..."
mkdir -p "$SAFETY_BACKUP_DIR"/{volumes,database,config}

echo "  💾 Backup de volúmenes críticos..."
for vol in $(docker volume ls --format "{{.Name}}" | grep -E "(storage|mysql)" | head -5); do
    echo "    📦 Respaldando: $vol"
    docker run --rm \
        -v "$vol":/data \
        -v "$SAFETY_BACKUP_DIR/volumes":/backup \
        alpine tar czf "/backup/SAFETY_${vol}_${TIMESTAMP}.tar.gz" -C /data . 2>/dev/null || echo "      ⚠️ Error con $vol"
done

echo "  🗄️ Backup de base de datos..."
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 --all-databases > "$SAFETY_BACKUP_DIR/database/SAFETY_db_complete_$TIMESTAMP.sql" 2>/dev/null || \
docker exec mpd-concursos-mysql-prod mysqldump -u concursos -pconcursos123 mpd_concursos > "$SAFETY_BACKUP_DIR/database/SAFETY_db_mpd_$TIMESTAMP.sql" 2>/dev/null || \
echo "  ⚠️ No se pudo crear backup de BD"

echo "  ⚙️ Backup de configuración..."
cp docker-compose*.yml "$SAFETY_BACKUP_DIR/config/" 2>/dev/null || true
cp .env* "$SAFETY_BACKUP_DIR/config/" 2>/dev/null || true

echo "  ✅ Backup de seguridad completado: $SAFETY_BACKUP_DIR"

# PASO 2: EXTRAER Y VERIFICAR PAQUETE
echo "📦 2. EXTRAYENDO Y VERIFICANDO PAQUETE DE RECUPERACIÓN..."
mkdir -p "$INTEGRATION_DIR"/{extracted,reports,logs}

echo "  📥 Extrayendo paquete..."
tar -xzf "$PACKAGE_FILE" -C "$INTEGRATION_DIR/extracted" 2>/dev/null || {
    echo "  ❌ ERROR: No se pudo extraer el paquete"
    echo "  🚨 ABORTANDO INTEGRACIÓN"
    exit 1
}

echo "  🔍 Verificando contenido extraído..."
PACKAGE_DOCS=$(find "$INTEGRATION_DIR/extracted/documents" -name "*.pdf" 2>/dev/null | wc -l || echo "0")
PACKAGE_CVS=$(find "$INTEGRATION_DIR/extracted/cv-documents" -name "*.pdf" 2>/dev/null | wc -l || echo "0")
PACKAGE_IMAGES=$(find "$INTEGRATION_DIR/extracted/profile-images" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l || echo "0")
PACKAGE_TOTAL=$((PACKAGE_DOCS + PACKAGE_CVS + PACKAGE_IMAGES))

echo "  📄 Documentos en paquete: $PACKAGE_DOCS"
echo "  📋 CVs en paquete: $PACKAGE_CVS"
echo "  🖼️ Imágenes en paquete: $PACKAGE_IMAGES"
echo "  📊 Total en paquete: $PACKAGE_TOTAL"

if [ "$PACKAGE_TOTAL" -eq 0 ]; then
    echo "  ❌ ERROR: El paquete no contiene archivos válidos"
    echo "  🚨 ABORTANDO INTEGRACIÓN"
    exit 1
fi

# PASO 3: ANÁLISIS DE CONFLICTOS
echo "🔍 3. ANÁLISIS DE CONFLICTOS POTENCIALES..."
echo "  🔎 Identificando archivos que podrían sobrescribirse..."

CONFLICTS_FOUND=0
{
    echo "=== ANÁLISIS DE CONFLICTOS ==="
    echo "Fecha: $(date)"
    echo ""
    
    echo "ARCHIVOS EN PAQUETE QUE PODRÍAN EXISTIR EN SISTEMA:"
    
    # Verificar conflictos en documents
    if [ -d "$INTEGRATION_DIR/extracted/documents" ]; then
        for file in "$INTEGRATION_DIR/extracted/documents"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if docker exec mpd-concursos-backend-prod test -f "/app/storage/documents/$filename" 2>/dev/null; then
                    echo "⚠️ CONFLICTO documents: $filename"
                    CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
                fi
            fi
        done
    fi
    
    # Verificar conflictos en cv-documents
    if [ -d "$INTEGRATION_DIR/extracted/cv-documents" ]; then
        for file in "$INTEGRATION_DIR/extracted/cv-documents"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if docker exec mpd-concursos-backend-prod test -f "/app/storage/cv-documents/$filename" 2>/dev/null; then
                    echo "⚠️ CONFLICTO cv-documents: $filename"
                    CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
                fi
            fi
        done
    fi
    
    # Verificar conflictos en profile-images
    if [ -d "$INTEGRATION_DIR/extracted/profile-images" ]; then
        for file in "$INTEGRATION_DIR/extracted/profile-images"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if docker exec mpd-concursos-backend-prod test -f "/app/storage/profile-images/$filename" 2>/dev/null; then
                    echo "⚠️ CONFLICTO profile-images: $filename"
                    CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
                fi
            fi
        done
    fi
    
    echo ""
    echo "TOTAL CONFLICTOS DETECTADOS: $CONFLICTS_FOUND"
    
} > "$INTEGRATION_DIR/reports/analisis_conflictos_$TIMESTAMP.txt"

echo "  📊 Conflictos detectados: $CONFLICTS_FOUND"

# PASO 4: INTEGRACIÓN INTELIGENTE
echo "🔄 4. INTEGRACIÓN INTELIGENTE DE ARCHIVOS..."
INTEGRATED_COUNT=0
SKIPPED_COUNT=0
RENAMED_COUNT=0

integrate_files() {
    local source_dir="$1"
    local target_subdir="$2"
    local file_type="$3"
    
    if [ ! -d "$source_dir" ]; then
        echo "    ⏭️ No hay archivos $file_type para integrar"
        return
    fi
    
    echo "    🔄 Integrando $file_type..."
    
    for file in "$source_dir"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            target_path="/app/storage/$target_subdir/$filename"
            
            # Verificar si ya existe
            if docker exec mpd-concursos-backend-prod test -f "$target_path" 2>/dev/null; then
                # Archivo existe - generar nombre único
                base_name="${filename%.*}"
                extension="${filename##*.}"
                counter=1
                
                while docker exec mpd-concursos-backend-prod test -f "/app/storage/$target_subdir/${base_name}_recovered_${counter}.${extension}" 2>/dev/null; do
                    counter=$((counter + 1))
                done
                
                new_filename="${base_name}_recovered_${counter}.${extension}"
                target_path="/app/storage/$target_subdir/$new_filename"
                
                echo "      🔄 Renombrando: $filename → $new_filename"
                RENAMED_COUNT=$((RENAMED_COUNT + 1))
            else
                echo "      ✅ Nuevo: $filename"
            fi
            
            # Copiar archivo al contenedor
            if docker cp "$file" "mpd-concursos-backend-prod:$target_path" 2>/dev/null; then
                INTEGRATED_COUNT=$((INTEGRATED_COUNT + 1))
                echo "$file_type,$filename,$target_path,$(date),INTEGRATED" >> "$INTEGRATION_DIR/logs/integracion_$TIMESTAMP.csv"
            else
                echo "      ❌ Error copiando: $filename"
                SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
                echo "$file_type,$filename,ERROR,$(date),SKIPPED" >> "$INTEGRATION_DIR/logs/integracion_$TIMESTAMP.csv"
            fi
        fi
    done
}

# Integrar cada tipo de archivo
integrate_files "$INTEGRATION_DIR/extracted/documents" "documents" "DOCUMENT"
integrate_files "$INTEGRATION_DIR/extracted/cv-documents" "cv-documents" "CV"
integrate_files "$INTEGRATION_DIR/extracted/profile-images" "profile-images" "IMAGE"

echo "  ✅ Integración completada:"
echo "    📥 Archivos integrados: $INTEGRATED_COUNT"
echo "    🔄 Archivos renombrados: $RENAMED_COUNT"
echo "    ❌ Archivos omitidos: $SKIPPED_COUNT"

# PASO 5: VERIFICACIÓN POST-INTEGRACIÓN
echo "🔍 5. VERIFICACIÓN POST-INTEGRACIÓN..."
NEW_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" 2>/dev/null | wc -l || echo "0")
NEW_CVS=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" 2>/dev/null | wc -l || echo "0")
NEW_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l || echo "0")
NEW_TOTAL=$((NEW_DOCS + NEW_CVS + NEW_IMAGES))

DOCS_GAINED=$((NEW_DOCS - CURRENT_DOCS))
CVS_GAINED=$((NEW_CVS - CURRENT_CVS))
IMAGES_GAINED=$((NEW_IMAGES - CURRENT_IMAGES))
TOTAL_GAINED=$((NEW_TOTAL - CURRENT_TOTAL))

echo "  📊 RESULTADOS DE LA INTEGRACIÓN:"
echo "    📄 Documentos: $CURRENT_DOCS → $NEW_DOCS (+$DOCS_GAINED)"
echo "    📋 CVs: $CURRENT_CVS → $NEW_CVS (+$CVS_GAINED)"
echo "    🖼️ Imágenes: $CURRENT_IMAGES → $NEW_IMAGES (+$IMAGES_GAINED)"
echo "    📊 Total: $CURRENT_TOTAL → $NEW_TOTAL (+$TOTAL_GAINED)"

# PASO 6: REINICIO DE SERVICIOS PARA CONSISTENCIA
echo "🔄 6. REINICIANDO SERVICIOS PARA CONSISTENCIA..."
echo "  🐳 Reiniciando contenedores..."
cd /root/concursos/mpd_concursos
docker compose -f docker-compose.prod.yml restart backend 2>/dev/null || echo "  ⚠️ Error reiniciando backend"
sleep 10

echo "  🔍 Verificando servicios..."
if curl -s http://localhost:8080/actuator/health | grep '"status":"UP"' > /dev/null; then
    echo "  ✅ Backend funcionando correctamente"
else
    echo "  ⚠️ Backend podría tener problemas - verificar manualmente"
fi

# PASO 7: REPORTE FINAL
echo "📋 7. GENERANDO REPORTE FINAL..."
{
    echo "=== REPORTE FINAL DE INTEGRACIÓN ==="
    echo "Fecha: $(date)"
    echo "Paquete integrado: $PACKAGE_FILE"
    echo "Timestamp: $TIMESTAMP"
    echo ""
    
    echo "BACKUP DE SEGURIDAD CREADO:"
    echo "- Ubicación: $SAFETY_BACKUP_DIR"
    echo "- Tamaño: $(du -sh "$SAFETY_BACKUP_DIR" | awk '{print $1}')"
    echo ""
    
    echo "ARCHIVOS INTEGRADOS:"
    echo "- Total integrados: $INTEGRATED_COUNT"
    echo "- Renombrados por conflicto: $RENAMED_COUNT"
    echo "- Omitidos por error: $SKIPPED_COUNT"
    echo ""
    
    echo "ESTADO ANTES → DESPUÉS:"
    echo "- Documentos: $CURRENT_DOCS → $NEW_DOCS (+$DOCS_GAINED)"
    echo "- CVs: $CURRENT_CVS → $NEW_CVS (+$CVS_GAINED)"
    echo "- Imágenes: $CURRENT_IMAGES → $NEW_IMAGES (+$IMAGES_GAINED)"
    echo "- TOTAL: $CURRENT_TOTAL → $NEW_TOTAL (+$TOTAL_GAINED)"
    echo ""
    
    echo "GANANCIA NETA: +$TOTAL_GAINED archivos"
    
    if [ "$TOTAL_GAINED" -gt 0 ]; then
        echo "🎯 RESULTADO: ÉXITO - Se recuperaron archivos"
    elif [ "$TOTAL_GAINED" -eq 0 ]; then
        echo "⚠️ RESULTADO: NEUTRO - No se agregaron archivos nuevos"
    else
        echo "❌ RESULTADO: PROBLEMA - Se perdieron archivos"
    fi
    
    echo ""
    echo "ARCHIVOS DE LA INTEGRACIÓN:"
    echo "- Logs detallados: $INTEGRATION_DIR/logs/"
    echo "- Análisis de conflictos: $INTEGRATION_DIR/reports/"
    echo "- Backup de seguridad: $SAFETY_BACKUP_DIR/"
    
} > "$INTEGRATION_DIR/REPORTE_FINAL_$TIMESTAMP.txt"

echo ""
echo "✅ ¡INTEGRACIÓN DE RECUPERACIÓN COMPLETADA!"
echo "==========================================="
echo "🎯 RESULTADO FINAL: +$TOTAL_GAINED archivos recuperados"
echo "📄 Documentos ganados: +$DOCS_GAINED"
echo "📋 CVs ganados: +$CVS_GAINED"
echo "🖼️ Imágenes ganadas: +$IMAGES_GAINED"
echo ""
echo "📋 REPORTE COMPLETO EN:"
echo "   $INTEGRATION_DIR/REPORTE_FINAL_$TIMESTAMP.txt"
echo ""
echo "🛡️ BACKUP DE SEGURIDAD EN:"
echo "   $SAFETY_BACKUP_DIR/"
echo ""
if [ "$TOTAL_GAINED" -gt 0 ]; then
    echo "🎉 ¡RECUPERACIÓN EXITOSA!"
    echo "   Se han recuperado $TOTAL_GAINED archivos perdidos"
else
    echo "⚠️ NO SE RECUPERARON ARCHIVOS NUEVOS"
    echo "   Posibles causas:"
    echo "   - Los archivos ya estaban en el sistema"
    echo "   - Los backups no contenían archivos únicos"
    echo "   - Problemas durante la extracción o consolidación"
fi
echo ""
echo "🔍 PRÓXIMOS PASOS RECOMENDADOS:"
echo "1. Verificar funcionalidad del sistema web"
echo "2. Probar acceso de usuarios a documentos"
echo "3. Revisar logs de integración si hay problemas"
echo "4. Mantener backup de seguridad por al menos 1 semana"
