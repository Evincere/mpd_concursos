#!/bin/bash

# ============================================================================
# SCRIPT: Examinar Estado Actual del Usuario Sergio Pereyra
# PROPÓSITO: Verificar documentación actual antes de la prueba
# USUARIO: Sergio Pereyra - DNI 26598410
# FECHA: 2025-08-07
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="EXAMEN_SERGIO_PEREYRA_${TIMESTAMP}.txt"
DNI="26598410"
USUARIO="Sergio Pereyra"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}👤 EXAMEN DEL USUARIO: $USUARIO (DNI: $DNI)${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Examinando estado actual del usuario..." | tee "$REPORT_FILE"
echo "Usuario: $USUARIO" | tee -a "$REPORT_FILE"
echo "DNI: $DNI" | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. BUSCAR EN BASE DE DATOS
# ============================================================================
echo -e "${BLUE}📊 1. INFORMACIÓN EN BASE DE DATOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Crear consulta SQL para buscar el usuario
cat > "/tmp/query_sergio_pereyra.sql" << EOF
-- Buscar información del usuario Sergio Pereyra
SELECT 
    u.id as user_id,
    u.nombre,
    u.apellido,
    u.cedula,
    u.email,
    u.telefono,
    u.fecha_registro,
    u.estado,
    u.profile_image_url
FROM usuarios u 
WHERE u.cedula = '$DNI' OR u.nombre LIKE '%Sergio%' AND u.apellido LIKE '%Pereyra%';

-- Buscar documentos del usuario
SELECT 
    d.id as document_id,
    d.nombre_archivo,
    d.ruta_archivo,
    d.tipo_documento,
    d.fecha_subida,
    d.estado,
    d.tamaño_archivo
FROM documentos d
JOIN usuarios u ON d.usuario_id = u.id
WHERE u.cedula = '$DNI';

-- Buscar inscripciones del usuario
SELECT 
    i.id as inscription_id,
    i.fecha_inscripcion,
    i.estado,
    c.nombre as concurso_nombre
FROM inscripciones i
JOIN usuarios u ON i.usuario_id = u.id
JOIN concursos c ON i.concurso_id = c.id
WHERE u.cedula = '$DNI';
EOF

echo "🔍 Consultando base de datos..." | tee -a "$REPORT_FILE"

# Intentar ejecutar la consulta (si MySQL está disponible)
if command -v mysql >/dev/null 2>&1; then
    echo "✅ MySQL disponible, ejecutando consultas..." | tee -a "$REPORT_FILE"
    
    # Ejecutar consulta de usuario
    echo "👤 DATOS DEL USUARIO:" | tee -a "$REPORT_FILE"
    mysql -u root -p'Semper2024!' concursos_mpd < /tmp/query_sergio_pereyra.sql 2>/dev/null | tee -a "$REPORT_FILE" || echo "❌ Error en consulta de usuario" | tee -a "$REPORT_FILE"
    
else
    echo "❌ MySQL no disponible directamente" | tee -a "$REPORT_FILE"
    echo "💡 Usar: docker exec -it mpd-concursos-mysql-prod mysql -u root -p concursos_mpd < /tmp/query_sergio_pereyra.sql" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. BUSCAR EN VOLUMEN DOCKER - DOCUMENTS
# ============================================================================
echo -e "${BLUE}📊 2. ARCHIVOS EN VOLUMEN DOCKER - DOCUMENTS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
USER_DOCUMENTS_DIR="$DOCKER_STORAGE/documents/$DNI"

if [ -d "$USER_DOCUMENTS_DIR" ]; then
    echo "✅ Directorio de documentos encontrado: $USER_DOCUMENTS_DIR" | tee -a "$REPORT_FILE"
    
    # Listar archivos
    echo "📄 ARCHIVOS ACTUALES:" | tee -a "$REPORT_FILE"
    ls -la "$USER_DOCUMENTS_DIR" | while read line; do
        echo "   $line" | tee -a "$REPORT_FILE"
    done
    
    # Contar y calcular tamaño
    file_count=$(find "$USER_DOCUMENTS_DIR" -type f | wc -l)
    total_size=$(du -sh "$USER_DOCUMENTS_DIR" 2>/dev/null | cut -f1)
    echo "📊 Total: $file_count archivos ($total_size)" | tee -a "$REPORT_FILE"
    
else
    echo "❌ Directorio de documentos NO encontrado: $USER_DOCUMENTS_DIR" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. BUSCAR EN VOLUMEN DOCKER - PROFILE IMAGES
# ============================================================================
echo -e "${BLUE}📊 3. ARCHIVOS EN VOLUMEN DOCKER - PROFILE IMAGES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Buscando imágenes de perfil por UUID..." | tee -a "$REPORT_FILE"
echo "NOTA: Las imágenes se almacenan por UUID, no por DNI" | tee -a "$REPORT_FILE"

PROFILE_IMAGES_DIR="$DOCKER_STORAGE/profile-images"

if [ -d "$PROFILE_IMAGES_DIR" ]; then
    echo "📂 Directorios de imágenes de perfil existentes:" | tee -a "$REPORT_FILE"
    ls "$PROFILE_IMAGES_DIR" | head -5 | while read uuid_dir; do
        if [ -d "$PROFILE_IMAGES_DIR/$uuid_dir" ]; then
            file_count=$(find "$PROFILE_IMAGES_DIR/$uuid_dir" -type f | wc -l)
            echo "   • $uuid_dir/ ($file_count archivos)" | tee -a "$REPORT_FILE"
        fi
    done
    echo "   ... (mostrando solo primeros 5)" | tee -a "$REPORT_FILE"
else
    echo "❌ Directorio de imágenes de perfil no encontrado" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. BUSCAR EN VOLUMEN DOCKER - CV DOCUMENTS
# ============================================================================
echo -e "${BLUE}📊 4. ARCHIVOS EN VOLUMEN DOCKER - CV DOCUMENTS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔍 Buscando documentos de CV por UUID..." | tee -a "$REPORT_FILE"
echo "NOTA: Los CVs se almacenan por UUID, no por DNI" | tee -a "$REPORT_FILE"

CV_DOCUMENTS_DIR="$DOCKER_STORAGE/cv-documents"

if [ -d "$CV_DOCUMENTS_DIR" ]; then
    echo "📂 Directorios de CV existentes:" | tee -a "$REPORT_FILE"
    ls "$CV_DOCUMENTS_DIR" | head -5 | while read uuid_dir; do
        if [ -d "$CV_DOCUMENTS_DIR/$uuid_dir" ]; then
            file_count=$(find "$CV_DOCUMENTS_DIR/$uuid_dir" -type f | wc -l)
            echo "   • $uuid_dir/ ($file_count archivos)" | tee -a "$REPORT_FILE"
        fi
    done
    echo "   ... (mostrando solo primeros 5)" | tee -a "$REPORT_FILE"
else
    echo "❌ Directorio de CV documents no encontrado" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. BUSCAR EN RESPALDOS LOCALES
# ============================================================================
echo -e "${BLUE}📊 5. ARCHIVOS EN RESPALDOS LOCALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

if [ -d "$BACKUPS_DIR" ]; then
    echo "🔍 Buscando en respaldos locales..." | tee -a "$REPORT_FILE"
    
    for fecha in "04_agosto" "05_agosto" "06_agosto"; do
        echo "📅 $fecha:" | tee -a "$REPORT_FILE"
        
        # Buscar en documents
        if [ -d "$BACKUPS_DIR/$fecha/documents/$DNI" ]; then
            file_count=$(find "$BACKUPS_DIR/$fecha/documents/$DNI" -type f | wc -l)
            echo "   📄 Documents: $file_count archivos" | tee -a "$REPORT_FILE"
            
            # Mostrar algunos archivos
            if [ $file_count -gt 0 ]; then
                echo "   Ejemplos:" | tee -a "$REPORT_FILE"
                find "$BACKUPS_DIR/$fecha/documents/$DNI" -type f | head -3 | while read file; do
                    filename=$(basename "$file")
                    filesize=$(du -h "$file" 2>/dev/null | cut -f1)
                    echo "     • $filename ($filesize)" | tee -a "$REPORT_FILE"
                done
            fi
        else
            echo "   📄 Documents: No encontrado" | tee -a "$REPORT_FILE"
        fi
        
        # Buscar en cv-documents
        if [ -d "$BACKUPS_DIR/$fecha/cv-documents/$DNI" ]; then
            file_count=$(find "$BACKUPS_DIR/$fecha/cv-documents/$DNI" -type f | wc -l)
            echo "   📝 CV Documents: $file_count archivos" | tee -a "$REPORT_FILE"
        else
            echo "   📝 CV Documents: No encontrado" | tee -a "$REPORT_FILE"
        fi
        
        # Buscar en profile-images
        if [ -d "$BACKUPS_DIR/$fecha/profile-images/$DNI" ]; then
            file_count=$(find "$BACKUPS_DIR/$fecha/profile-images/$DNI" -type f | wc -l)
            echo "   🖼️  Profile Images: $file_count archivos" | tee -a "$REPORT_FILE"
        else
            echo "   🖼️  Profile Images: No encontrado" | tee -a "$REPORT_FILE"
        fi
        
        echo | tee -a "$REPORT_FILE"
    done
else
    echo "❌ Respaldos locales no disponibles" | tee -a "$REPORT_FILE"
fi

# ============================================================================
# 6. PREPARAR PARA PRUEBA
# ============================================================================
echo -e "${BLUE}📊 6. PREPARACIÓN PARA PRUEBA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🎯 PLAN DE PRUEBA:" | tee -a "$REPORT_FILE"
echo "1. Hacer login como Sergio Pereyra (DNI: $DNI)" | tee -a "$REPORT_FILE"
echo "2. Subir un documento de prueba" | tee -a "$REPORT_FILE"
echo "3. Verificar que aparece en: $USER_DOCUMENTS_DIR" | tee -a "$REPORT_FILE"
echo "4. Visualizar el documento desde la plataforma" | tee -a "$REPORT_FILE"
echo "5. Eliminar el documento" | tee -a "$REPORT_FILE"
echo "6. Confirmar eliminación en el sistema de archivos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📋 COMANDOS DE MONITOREO:" | tee -a "$REPORT_FILE"
echo "# Monitorear directorio del usuario:" | tee -a "$REPORT_FILE"
echo "watch -n 2 'ls -la $USER_DOCUMENTS_DIR'" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"
echo "# Ver logs del backend:" | tee -a "$REPORT_FILE"
echo "docker logs -f mpd-concursos-backend-prod" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 7. CREAR ARCHIVO DE MONITOREO
# ============================================================================
echo -e "${BLUE}📊 7. CREAR SCRIPT DE MONITOREO:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Crear script de monitoreo en tiempo real
cat > "monitor_sergio_pereyra.sh" << 'EOF'
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
EOF

chmod +x monitor_sergio_pereyra.sh

echo "✅ Script de monitoreo creado: monitor_sergio_pereyra.sh" | tee -a "$REPORT_FILE"
echo "   Ejecutar con: ./monitor_sergio_pereyra.sh" | tee -a "$REPORT_FILE"

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ EXAMEN DEL USUARIO COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"
echo -e "${CYAN}🔍 Monitor creado en: monitor_sergio_pereyra.sh${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN PARA SERGIO PEREYRA (DNI: $DNI):${NC}"
echo -e "${YELLOW}============================================${NC}"
echo "• Directorio esperado: $USER_DOCUMENTS_DIR"
echo "• Script de monitoreo: ./monitor_sergio_pereyra.sh"
echo "• Consulta SQL: /tmp/query_sergio_pereyra.sql"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡LISTO PARA LA PRUEBA!${NC}"
echo -e "${CYAN}============================================================================${NC}"