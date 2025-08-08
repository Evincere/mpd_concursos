#!/bin/bash

# ============================================================================
# SCRIPT: Recuperar Documentación de Usuario Específico
# PROPÓSITO: Probar recuperación completa de un usuario antes de la restauración masiva
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

# Verificar parámetros
if [ $# -ne 2 ]; then
    echo -e "${RED}❌ Error: Se requieren exactamente 2 parámetros${NC}"
    echo -e "${YELLOW}Uso: $0 <DNI> <NOMBRE_USUARIO>${NC}"
    echo -e "${YELLOW}Ejemplo: $0 12345678 'JUAN_CARLOS_PEREZ'${NC}"
    exit 1
fi

DNI="$1"
NOMBRE_USUARIO="$2"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="RECUPERACION_USUARIO_${DNI}_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🔄 RECUPERACIÓN DE USUARIO ESPECÍFICO${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔄 Iniciando recuperación de usuario..." | tee "$REPORT_FILE"
echo "DNI: $DNI" | tee -a "$REPORT_FILE"
echo "Nombre: $NOMBRE_USUARIO" | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# Variables
BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
USER_TARGET_DIR="$DOCKER_STORAGE/documents/$DNI"

# ============================================================================
# 1. VERIFICAR DISPONIBILIDAD DE RESPALDOS
# ============================================================================
echo -e "${BLUE}📊 1. VERIFICANDO RESPALDOS DISPONIBLES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ ! -d "$BACKUPS_DIR" ]; then
    echo "❌ ERROR: Directorio de respaldos no encontrado: $BACKUPS_DIR" | tee -a "$REPORT_FILE"
    exit 1
fi

echo "✅ Directorio de respaldos encontrado" | tee -a "$REPORT_FILE"

# Verificar presencia del usuario en respaldos
USER_FOUND=false
FECHAS_ENCONTRADAS=()

for fecha in "04_agosto" "05_agosto" "06_agosto"; do
    if [ -d "$BACKUPS_DIR/$fecha/documents/$DNI" ]; then
        USER_FOUND=true
        FECHAS_ENCONTRADAS+=("$fecha")
        file_count=$(find "$BACKUPS_DIR/$fecha/documents/$DNI" -type f | wc -l)
        echo "✅ $fecha: $file_count archivos en documents/" | tee -a "$REPORT_FILE"
    else
        echo "❌ $fecha: No encontrado en documents/" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar CV documents
    if [ -d "$BACKUPS_DIR/$fecha/cv-documents/$DNI" ]; then
        cv_count=$(find "$BACKUPS_DIR/$fecha/cv-documents/$DNI" -type f | wc -l)
        echo "✅ $fecha: $cv_count archivos en cv-documents/" | tee -a "$REPORT_FILE"
    fi
    
    # Verificar profile images
    if [ -d "$BACKUPS_DIR/$fecha/profile-images/$DNI" ]; then
        img_count=$(find "$BACKUPS_DIR/$fecha/profile-images/$DNI" -type f | wc -l)
        echo "✅ $fecha: $img_count archivos en profile-images/" | tee -a "$REPORT_FILE"
    fi
done

if [ "$USER_FOUND" = false ]; then
    echo "❌ ERROR: Usuario $DNI no encontrado en ningún respaldo" | tee -a "$REPORT_FILE"
    exit 1
fi

echo "✅ Usuario encontrado en ${#FECHAS_ENCONTRADAS[@]} fechas: ${FECHAS_ENCONTRADAS[*]}" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. OBTENER UUID DEL USUARIO DESDE BD
# ============================================================================
echo -e "${BLUE}📊 2. OBTENIENDO UUID DEL USUARIO:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Consultar UUID del usuario
UUID_QUERY="SELECT HEX(id) as uuid FROM user_entity WHERE dni = '$DNI' LIMIT 1;"
USER_UUID=$(docker exec mpd-concursos-mysql-prod mysql -u root -p'root1234' mpd_concursos -e "$UUID_QUERY" 2>/dev/null | tail -n +2)

if [ -n "$USER_UUID" ] && [ "$USER_UUID" != "uuid" ]; then
    # Formatear UUID con guiones
    FORMATTED_UUID=$(echo "$USER_UUID" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
    echo "✅ UUID encontrado: $FORMATTED_UUID" | tee -a "$REPORT_FILE"
else
    echo "⚠️  UUID no encontrado en BD, usando solo DNI para documents/" | tee -a "$REPORT_FILE"
    FORMATTED_UUID=""
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. ESTADO ACTUAL DEL USUARIO
# ============================================================================
echo -e "${BLUE}📊 3. ESTADO ACTUAL EN DOCKER VOLUME:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ -d "$USER_TARGET_DIR" ]; then
    current_files=$(find "$USER_TARGET_DIR" -type f | wc -l)
    current_size=$(du -sh "$USER_TARGET_DIR" | cut -f1)
    echo "📂 Directorio actual existe: $current_files archivos ($current_size)" | tee -a "$REPORT_FILE"
    
    echo "📄 Archivos actuales:" | tee -a "$REPORT_FILE"
    ls -la "$USER_TARGET_DIR" | while read line; do
        echo "   $line" | tee -a "$REPORT_FILE"
    done
else
    echo "📂 Directorio actual: No existe (se creará)" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. CREAR BACKUP DEL ESTADO ACTUAL
# ============================================================================
echo -e "${BLUE}📊 4. CREANDO BACKUP DEL ESTADO ACTUAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

BACKUP_ACTUAL_DIR="/tmp/backup_usuario_${DNI}_${TIMESTAMP}"
mkdir -p "$BACKUP_ACTUAL_DIR"

if [ -d "$USER_TARGET_DIR" ]; then
    cp -r "$USER_TARGET_DIR" "$BACKUP_ACTUAL_DIR/documents_backup"
    echo "✅ Backup creado en: $BACKUP_ACTUAL_DIR/documents_backup" | tee -a "$REPORT_FILE"
else
    echo "ℹ️  No hay estado actual que respaldar" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. RESTAURAR DOCUMENTS (POR DNI)
# ============================================================================
echo -e "${BLUE}📊 5. RESTAURANDO DOCUMENTS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Crear directorio de destino
mkdir -p "$USER_TARGET_DIR"

TOTAL_DOCS_RESTORED=0

for fecha in "${FECHAS_ENCONTRADAS[@]}"; do
    SOURCE_DIR="$BACKUPS_DIR/$fecha/documents/$DNI"
    
    if [ -d "$SOURCE_DIR" ]; then
        echo "📅 Procesando $fecha..." | tee -a "$REPORT_FILE"
        
        # Copiar archivos
        file_count=0
        for file in "$SOURCE_DIR"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                target_file="$USER_TARGET_DIR/$filename"
                
                # Solo copiar si no existe o es más reciente
                if [ ! -f "$target_file" ] || [ "$file" -nt "$target_file" ]; then
                    cp "$file" "$target_file"
                    ((file_count++))
                    ((TOTAL_DOCS_RESTORED++))
                    echo "   ✅ $filename" | tee -a "$REPORT_FILE"
                else
                    echo "   ⏭️  $filename (ya existe, más reciente)" | tee -a "$REPORT_FILE"
                fi
            fi
        done
        
        echo "   📊 $fecha: $file_count archivos restaurados" | tee -a "$REPORT_FILE"
    fi
done

echo "📊 Total documents restaurados: $TOTAL_DOCS_RESTORED" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. RESTAURAR CV-DOCUMENTS (SI HAY UUID)
# ============================================================================
if [ -n "$FORMATTED_UUID" ]; then
    echo -e "${BLUE}📊 6. RESTAURANDO CV-DOCUMENTS:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    CV_TARGET_DIR="$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID"
    mkdir -p "$CV_TARGET_DIR"
    
    TOTAL_CV_RESTORED=0
    
    for fecha in "${FECHAS_ENCONTRADAS[@]}"; do
        CV_SOURCE_DIR="$BACKUPS_DIR/$fecha/cv-documents/$DNI"
        
        if [ -d "$CV_SOURCE_DIR" ]; then
            echo "📅 Procesando CV $fecha..." | tee -a "$REPORT_FILE"
            
            # Copiar archivos CV
            cv_count=0
            for file in "$CV_SOURCE_DIR"/*; do
                if [ -f "$file" ]; then
                    filename=$(basename "$file")
                    target_file="$CV_TARGET_DIR/$filename"
                    
                    if [ ! -f "$target_file" ] || [ "$file" -nt "$target_file" ]; then
                        cp "$file" "$target_file"
                        ((cv_count++))
                        ((TOTAL_CV_RESTORED++))
                        echo "   ✅ $filename" | tee -a "$REPORT_FILE"
                    fi
                fi
            done
            
            echo "   📊 $fecha: $cv_count archivos CV restaurados" | tee -a "$REPORT_FILE"
        fi
    done
    
    echo "📊 Total CV-documents restaurados: $TOTAL_CV_RESTORED" | tee -a "$REPORT_FILE"
else
    echo -e "${YELLOW}📊 6. CV-DOCUMENTS: OMITIDO (sin UUID)${NC}" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 7. RESTAURAR PROFILE-IMAGES (SI HAY UUID)
# ============================================================================
if [ -n "$FORMATTED_UUID" ]; then
    echo -e "${BLUE}📊 7. RESTAURANDO PROFILE-IMAGES:${NC}" | tee -a "$REPORT_FILE"
    echo "===========================================" | tee -a "$REPORT_FILE"
    
    IMG_TARGET_DIR="$DOCKER_STORAGE/profile-images/$FORMATTED_UUID"
    mkdir -p "$IMG_TARGET_DIR"
    
    TOTAL_IMG_RESTORED=0
    
    for fecha in "${FECHAS_ENCONTRADAS[@]}"; do
        IMG_SOURCE_DIR="$BACKUPS_DIR/$fecha/profile-images/$DNI"
        
        if [ -d "$IMG_SOURCE_DIR" ]; then
            echo "📅 Procesando imágenes $fecha..." | tee -a "$REPORT_FILE"
            
            # Copiar archivos de imagen
            img_count=0
            for file in "$IMG_SOURCE_DIR"/*; do
                if [ -f "$file" ]; then
                    filename=$(basename "$file")
                    target_file="$IMG_TARGET_DIR/$filename"
                    
                    if [ ! -f "$target_file" ] || [ "$file" -nt "$target_file" ]; then
                        cp "$file" "$target_file"
                        ((img_count++))
                        ((TOTAL_IMG_RESTORED++))
                        echo "   ✅ $filename" | tee -a "$REPORT_FILE"
                    fi
                fi
            done
            
            echo "   📊 $fecha: $img_count imágenes restauradas" | tee -a "$REPORT_FILE"
        fi
    done
    
    echo "📊 Total profile-images restauradas: $TOTAL_IMG_RESTORED" | tee -a "$REPORT_FILE"
else
    echo -e "${YELLOW}📊 7. PROFILE-IMAGES: OMITIDO (sin UUID)${NC}" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 8. VERIFICACIÓN FINAL
# ============================================================================
echo -e "${BLUE}📊 8. VERIFICACIÓN FINAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

# Verificar documents
if [ -d "$USER_TARGET_DIR" ]; then
    final_docs=$(find "$USER_TARGET_DIR" -type f | wc -l)
    final_size=$(du -sh "$USER_TARGET_DIR" | cut -f1)
    echo "📄 Documents finales: $final_docs archivos ($final_size)" | tee -a "$REPORT_FILE"
else
    echo "❌ Documents: Directorio no creado" | tee -a "$REPORT_FILE"
fi

# Verificar CV documents
if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" ]; then
    final_cv=$(find "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" -type f | wc -l)
    echo "📝 CV Documents finales: $final_cv archivos" | tee -a "$REPORT_FILE"
fi

# Verificar profile images
if [ -n "$FORMATTED_UUID" ] && [ -d "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" ]; then
    final_img=$(find "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" -type f | wc -l)
    echo "🖼️  Profile Images finales: $final_img archivos" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 9. AJUSTAR PERMISOS
# ============================================================================
echo -e "${BLUE}📊 9. AJUSTANDO PERMISOS:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

chown -R root:root "$USER_TARGET_DIR" 2>/dev/null || true
chmod -R 755 "$USER_TARGET_DIR" 2>/dev/null || true

if [ -n "$FORMATTED_UUID" ]; then
    if [ -d "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" ]; then
        chown -R root:root "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" 2>/dev/null || true
        chmod -R 755 "$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID" 2>/dev/null || true
    fi
    
    if [ -d "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" ]; then
        chown -R root:root "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" 2>/dev/null || true
        chmod -R 755 "$DOCKER_STORAGE/profile-images/$FORMATTED_UUID" 2>/dev/null || true
    fi
fi

echo "✅ Permisos ajustados (root:root, 755)" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 10. RESUMEN FINAL
# ============================================================================
echo -e "${BLUE}📊 10. RESUMEN FINAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

TOTAL_RESTORED=$((TOTAL_DOCS_RESTORED + ${TOTAL_CV_RESTORED:-0} + ${TOTAL_IMG_RESTORED:-0}))

echo "🎯 USUARIO: $DNI ($NOMBRE_USUARIO)" | tee -a "$REPORT_FILE"
echo "📊 ARCHIVOS RESTAURADOS:" | tee -a "$REPORT_FILE"
echo "   • Documents: $TOTAL_DOCS_RESTORED" | tee -a "$REPORT_FILE"
echo "   • CV Documents: ${TOTAL_CV_RESTORED:-0}" | tee -a "$REPORT_FILE"
echo "   • Profile Images: ${TOTAL_IMG_RESTORED:-0}" | tee -a "$REPORT_FILE"
echo "   • TOTAL: $TOTAL_RESTORED archivos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

if [ $TOTAL_RESTORED -gt 0 ]; then
    echo "🎉 RESULTADO: RECUPERACIÓN EXITOSA" | tee -a "$REPORT_FILE"
    echo "✅ Usuario $DNI restaurado correctamente" | tee -a "$REPORT_FILE"
    echo "✅ Archivos disponibles en el sistema" | tee -a "$REPORT_FILE"
    echo "✅ Permisos configurados correctamente" | tee -a "$REPORT_FILE"
else
    echo "⚠️  RESULTADO: SIN ARCHIVOS RESTAURADOS" | tee -a "$REPORT_FILE"
    echo "❓ Verificar disponibilidad en respaldos" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ RECUPERACIÓN DE USUARIO COMPLETADA${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"
echo -e "${CYAN}💾 Backup del estado anterior en: $BACKUP_ACTUAL_DIR${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo -e "${YELLOW}=====================${NC}"
echo "• Usuario: $DNI"
echo "• UUID: ${FORMATTED_UUID:-'No encontrado'}"
echo "• Archivos restaurados: $TOTAL_RESTORED"
echo "• Estado: $([ $TOTAL_RESTORED -gt 0 ] && echo "✅ EXITOSO" || echo "⚠️ SIN ARCHIVOS")"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡RECUPERACIÓN DE USUARIO COMPLETADA!${NC}"
echo -e "${CYAN}============================================================================${NC}"