#!/bin/bash

# ============================================================================
# SCRIPT: Mapear Estructura Docker y Volúmenes
# PROPÓSITO: Entender la estructura completa de Docker y volúmenes persistentes
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
REPORT_FILE="MAPEO_ESTRUCTURA_DOCKER_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🐳 MAPEO DE ESTRUCTURA DOCKER Y VOLÚMENES${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Analizando configuración Docker..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. CONFIGURACIÓN DOCKER COMPOSE
# ============================================================================
echo -e "${BLUE}📊 1. CONFIGURACIÓN DOCKER COMPOSE:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🐳 VOLÚMENES CONFIGURADOS:" | tee -a "$REPORT_FILE"
echo "   • storage_data_prod: /app/storage (dentro del contenedor)" | tee -a "$REPORT_FILE"
echo "   • backup_data_prod: /app/backups (dentro del contenedor)" | tee -a "$REPORT_FILE"
echo "   • mysql_data_prod: /var/lib/mysql (base de datos)" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "🔗 MAPEO DE VOLÚMENES:" | tee -a "$REPORT_FILE"
echo "   Host → Contenedor:" | tee -a "$REPORT_FILE"
echo "   /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data → /app/storage" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. VERIFICAR VOLÚMENES DOCKER
# ============================================================================
echo -e "${BLUE}📊 2. VOLÚMENES DOCKER EXISTENTES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📋 VOLÚMENES RELACIONADOS CON STORAGE:" | tee -a "$REPORT_FILE"
docker volume ls | grep -E "(storage|mpd)" | while read driver name; do
    echo "   • $name ($driver)" | tee -a "$REPORT_FILE"
done

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. ESTRUCTURA ACTUAL DEL VOLUMEN PRINCIPAL
# ============================================================================
echo -e "${BLUE}📊 3. ESTRUCTURA DEL VOLUMEN PRINCIPAL:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

if [ -d "$DOCKER_STORAGE" ]; then
    echo "✅ Volumen principal encontrado: $DOCKER_STORAGE" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "📁 ESTRUCTURA ACTUAL:" | tee -a "$REPORT_FILE"
    ls -la "$DOCKER_STORAGE" | while read line; do
        echo "   $line" | tee -a "$REPORT_FILE"
    done
    echo | tee -a "$REPORT_FILE"
    
    # Analizar cada subdirectorio
    for subdir in "documents" "cv-documents" "profile-images" "contest-bases" "temp"; do
        if [ -d "$DOCKER_STORAGE/$subdir" ]; then
            count=$(find "$DOCKER_STORAGE/$subdir" -type f 2>/dev/null | wc -l)
            size=$(du -sh "$DOCKER_STORAGE/$subdir" 2>/dev/null | cut -f1)
            echo "📂 $subdir/: $count archivos ($size)" | tee -a "$REPORT_FILE"
            
            # Mostrar algunos ejemplos
            if [ $count -gt 0 ]; then
                echo "   Ejemplos:" | tee -a "$REPORT_FILE"
                ls "$DOCKER_STORAGE/$subdir" | head -3 | while read item; do
                    if [ -d "$DOCKER_STORAGE/$subdir/$item" ]; then
                        item_count=$(find "$DOCKER_STORAGE/$subdir/$item" -type f 2>/dev/null | wc -l)
                        echo "   • $item/ ($item_count archivos)" | tee -a "$REPORT_FILE"
                    else
                        echo "   • $item" | tee -a "$REPORT_FILE"
                    fi
                done
            fi
            echo | tee -a "$REPORT_FILE"
        else
            echo "❌ $subdir/: No existe" | tee -a "$REPORT_FILE"
        fi
    done
else
    echo "❌ Volumen principal no encontrado" | tee -a "$REPORT_FILE"
fi

# ============================================================================
# 4. ANÁLISIS DE ARCHIVOS RECUPERADOS
# ============================================================================
echo -e "${BLUE}📊 4. ARCHIVOS RECUPERADOS EXISTENTES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ -d "$DOCKER_STORAGE" ]; then
    for recovered_dir in "recovered_documents" "recovered_cv_documents" "recovered_profile_images"; do
        if [ -d "$DOCKER_STORAGE/$recovered_dir" ]; then
            count=$(find "$DOCKER_STORAGE/$recovered_dir" -type f 2>/dev/null | wc -l)
            size=$(du -sh "$DOCKER_STORAGE/$recovered_dir" 2>/dev/null | cut -f1)
            echo "📦 $recovered_dir/: $count archivos ($size)" | tee -a "$REPORT_FILE"
        else
            echo "❌ $recovered_dir/: No existe" | tee -a "$REPORT_FILE"
        fi
    done
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. COMPARACIÓN CON RESPALDOS LOCALES
# ============================================================================
echo -e "${BLUE}📊 5. COMPARACIÓN CON RESPALDOS LOCALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

if [ -d "$BACKUPS_DIR" ] && [ -d "$DOCKER_STORAGE" ]; then
    echo "🔄 COMPARACIÓN DE CONTENIDO:" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Comparar documents
    if [ -d "$BACKUPS_DIR/06_agosto/documents" ] && [ -d "$DOCKER_STORAGE/documents" ]; then
        backup_users=$(ls "$BACKUPS_DIR/06_agosto/documents" | wc -l)
        docker_users=$(ls "$DOCKER_STORAGE/documents" | wc -l)
        echo "📄 DOCUMENTS:" | tee -a "$REPORT_FILE"
        echo "   • Respaldos locales: $backup_users usuarios" | tee -a "$REPORT_FILE"
        echo "   • Docker volume: $docker_users usuarios" | tee -a "$REPORT_FILE"
        
        # Verificar usuarios comunes
        common_users=0
        ls "$BACKUPS_DIR/06_agosto/documents" | while read dni; do
            if [ -d "$DOCKER_STORAGE/documents/$dni" ]; then
                ((common_users++))
            fi
        done 2>/dev/null || common_users=0
        echo "   • Usuarios comunes: $common_users" | tee -a "$REPORT_FILE"
        echo | tee -a "$REPORT_FILE"
    fi
    
    # Comparar profile-images
    if [ -d "$BACKUPS_DIR/06_agosto/profile-images" ] && [ -d "$DOCKER_STORAGE/profile-images" ]; then
        backup_profiles=$(ls "$BACKUPS_DIR/06_agosto/profile-images" | wc -l)
        docker_profiles=$(ls "$DOCKER_STORAGE/profile-images" | wc -l)
        echo "🖼️  PROFILE IMAGES:" | tee -a "$REPORT_FILE"
        echo "   • Respaldos locales: $backup_profiles usuarios (por DNI)" | tee -a "$REPORT_FILE"
        echo "   • Docker volume: $docker_profiles usuarios (por UUID)" | tee -a "$REPORT_FILE"
        echo | tee -a "$REPORT_FILE"
    fi
else
    echo "❌ No se pueden comparar (falta respaldos locales o volumen Docker)" | tee -a "$REPORT_FILE"
fi

# ============================================================================
# 6. PLAN DE RESTAURACIÓN DOCKER
# ============================================================================
echo -e "${BLUE}📊 6. PLAN DE RESTAURACIÓN DOCKER:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🎯 ESTRATEGIA DE RESTAURACIÓN:" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "1️⃣  PREPARAR VOLUMEN DOCKER:" | tee -a "$REPORT_FILE"
echo "   • Volumen ya existe: mpd_concursos_storage_data_prod" | tee -a "$REPORT_FILE"
echo "   • Ruta física: $DOCKER_STORAGE" | tee -a "$REPORT_FILE"
echo "   • Montado en contenedor: /app/storage" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "2️⃣  RESTAURAR DIRECTAMENTE AL VOLUMEN:" | tee -a "$REPORT_FILE"
echo "   • Copiar desde respaldos locales → $DOCKER_STORAGE" | tee -a "$REPORT_FILE"
echo "   • Mantener estructura esperada por la aplicación" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "3️⃣  MAPEO DE DIRECTORIOS:" | tee -a "$REPORT_FILE"
echo "   📄 Documents (por DNI):" | tee -a "$REPORT_FILE"
echo "      Origen: /root/BACKUPS_LOCALES_EXTRAIDOS/*/documents/[DNI]/" | tee -a "$REPORT_FILE"
echo "      Destino: $DOCKER_STORAGE/documents/[DNI]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"
echo "   📝 CV Documents (requiere mapeo DNI→UUID):" | tee -a "$REPORT_FILE"
echo "      Origen: /root/BACKUPS_LOCALES_EXTRAIDOS/*/cv-documents/[DNI]/" | tee -a "$REPORT_FILE"
echo "      Destino: $DOCKER_STORAGE/cv-documents/[UUID]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"
echo "   🖼️  Profile Images (requiere mapeo DNI→UUID):" | tee -a "$REPORT_FILE"
echo "      Origen: /root/BACKUPS_LOCALES_EXTRAIDOS/*/profile-images/[DNI]/" | tee -a "$REPORT_FILE"
echo "      Destino: $DOCKER_STORAGE/profile-images/[UUID]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "4️⃣  VERIFICACIÓN POST-RESTAURACIÓN:" | tee -a "$REPORT_FILE"
echo "   • Verificar permisos (root:root)" | tee -a "$REPORT_FILE"
echo "   • Reiniciar contenedor backend" | tee -a "$REPORT_FILE"
echo "   • Probar acceso desde aplicación" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 7. COMANDOS ÚTILES DOCKER
# ============================================================================
echo -e "${BLUE}📊 7. COMANDOS ÚTILES DOCKER:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🐳 GESTIÓN DE CONTENEDORES:" | tee -a "$REPORT_FILE"
echo "docker-compose -f docker-compose.prod.yml down    # Parar servicios" | tee -a "$REPORT_FILE"
echo "docker-compose -f docker-compose.prod.yml up -d   # Iniciar servicios" | tee -a "$REPORT_FILE"
echo "docker-compose -f docker-compose.prod.yml restart backend  # Reiniciar backend" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📂 ACCESO AL VOLUMEN:" | tee -a "$REPORT_FILE"
echo "ls -la $DOCKER_STORAGE/                           # Ver contenido" | tee -a "$REPORT_FILE"
echo "du -sh $DOCKER_STORAGE/*                          # Tamaños" | tee -a "$REPORT_FILE"
echo "find $DOCKER_STORAGE -type f | wc -l              # Contar archivos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "🔧 PERMISOS:" | tee -a "$REPORT_FILE"
echo "chown -R root:root $DOCKER_STORAGE/               # Ajustar propietario" | tee -a "$REPORT_FILE"
echo "chmod -R 755 $DOCKER_STORAGE/                     # Ajustar permisos" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ MAPEO DOCKER COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN CLAVE DOCKER:${NC}"
echo -e "${YELLOW}=========================${NC}"
echo "• Volumen principal: mpd_concursos_storage_data_prod"
echo "• Ruta física: $DOCKER_STORAGE"
echo "• Montado en: /app/storage (dentro del contenedor)"
echo "• Estructura: documents/, cv-documents/, profile-images/, contest-bases/, temp/"
echo "• Estado: ✅ Volumen existe y tiene contenido"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡MAPEO DOCKER COMPLETADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"