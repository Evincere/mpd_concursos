#!/bin/bash

# ============================================================================
# SCRIPT: Mapear Estructura de Archivos del Sistema
# PROPÓSITO: Definir exactamente dónde van los archivos según la configuración
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
REPORT_FILE="MAPEO_ESTRUCTURA_ARCHIVOS_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🗂️  MAPEO DE ESTRUCTURA DE ARCHIVOS DEL SISTEMA${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "🔍 Analizando configuración del sistema..." | tee "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 1. CONFIGURACIÓN SEGÚN CÓDIGO FUENTE
# ============================================================================
echo -e "${BLUE}📊 1. CONFIGURACIÓN SEGÚN STORAGECONFIG.JAVA:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🏠 DIRECTORIO BASE:" | tee -a "$REPORT_FILE"
echo "   • Desarrollo: ./storage" | tee -a "$REPORT_FILE"
echo "   • Producción: storage (relativo al directorio de trabajo)" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📁 SUBDIRECTORIOS CONFIGURADOS:" | tee -a "$REPORT_FILE"
echo "   • documents/          - Documentos MPD (DNI, CUIL, certificados)" | tee -a "$REPORT_FILE"
echo "   • contest-bases/      - Bases de concursos (PDFs)" | tee -a "$REPORT_FILE"
echo "   • cv-documents/       - Documentos de CV (experiencia, educación)" | tee -a "$REPORT_FILE"
echo "   • profile-images/     - Imágenes de perfil de usuarios" | tee -a "$REPORT_FILE"
echo "   • temp/               - Archivos temporales" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 2. ESTRUCTURA ESPERADA EN PRODUCCIÓN
# ============================================================================
echo -e "${BLUE}📊 2. ESTRUCTURA ESPERADA EN PRODUCCIÓN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "📂 /root/concursos/mpd_concursos/storage/" | tee -a "$REPORT_FILE"
echo "├── documents/                    # Documentos principales por DNI" | tee -a "$REPORT_FILE"
echo "│   ├── 23520516/                # Usuario por DNI" | tee -a "$REPORT_FILE"
echo "│   │   ├── dni_frontal.pdf" | tee -a "$REPORT_FILE"
echo "│   │   ├── dni_dorso.pdf" | tee -a "$REPORT_FILE"
echo "│   │   ├── cuil.pdf" | tee -a "$REPORT_FILE"
echo "│   │   └── certificados.pdf" | tee -a "$REPORT_FILE"
echo "│   └── [otros_usuarios]/" | tee -a "$REPORT_FILE"
echo "├── cv-documents/                 # Documentos de CV por UUID" | tee -a "$REPORT_FILE"
echo "│   ├── [user-uuid]/             # Usuario por UUID" | tee -a "$REPORT_FILE"
echo "│   │   ├── experiences/         # Experiencias laborales" | tee -a "$REPORT_FILE"
echo "│   │   └── education/           # Educación" | tee -a "$REPORT_FILE"
echo "│   └── [otros_usuarios]/" | tee -a "$REPORT_FILE"
echo "├── profile-images/               # Imágenes de perfil por UUID" | tee -a "$REPORT_FILE"
echo "│   ├── [user-uuid]/             # Usuario por UUID" | tee -a "$REPORT_FILE"
echo "│   │   └── profile.jpg" | tee -a "$REPORT_FILE"
echo "│   └── [otros_usuarios]/" | tee -a "$REPORT_FILE"
echo "├── contest-bases/                # Bases de concursos" | tee -a "$REPORT_FILE"
echo "│   └── bases_concurso_1.pdf" | tee -a "$REPORT_FILE"
echo "└── temp/                         # Archivos temporales" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 3. VERIFICAR ESTRUCTURA ACTUAL
# ============================================================================
echo -e "${BLUE}📊 3. ESTRUCTURA ACTUAL EN EL SERVIDOR:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

if [ -d "storage" ]; then
    echo "✅ Directorio storage existe" | tee -a "$REPORT_FILE"
    
    # Verificar subdirectorios
    for subdir in "documents" "cv-documents" "profile-images" "contest-bases" "temp"; do
        if [ -d "storage/$subdir" ]; then
            count=$(find "storage/$subdir" -type f 2>/dev/null | wc -l)
            echo "✅ storage/$subdir/ - $count archivos" | tee -a "$REPORT_FILE"
        else
            echo "❌ storage/$subdir/ - No existe" | tee -a "$REPORT_FILE"
        fi
    done
else
    echo "❌ Directorio storage no existe" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 4. MAPEO DE RESPALDOS LOCALES A ESTRUCTURA PRODUCCIÓN
# ============================================================================
echo -e "${BLUE}📊 4. MAPEO DE RESPALDOS LOCALES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

BACKUPS_DIR="/root/BACKUPS_LOCALES_EXTRAIDOS"

if [ -d "$BACKUPS_DIR" ]; then
    echo "🔄 MAPEO DE ARCHIVOS:" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "📄 DOCUMENTS (por DNI):" | tee -a "$REPORT_FILE"
    echo "   Origen: $BACKUPS_DIR/*/documents/[DNI]/" | tee -a "$REPORT_FILE"
    echo "   Destino: storage/documents/[DNI]/" | tee -a "$REPORT_FILE"
    echo "   Ejemplo: 23520516/ → storage/documents/23520516/" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "📝 CV-DOCUMENTS:" | tee -a "$REPORT_FILE"
    echo "   Origen: $BACKUPS_DIR/*/cv-documents/[DNI]/" | tee -a "$REPORT_FILE"
    echo "   Destino: storage/cv-documents/[UUID]/" | tee -a "$REPORT_FILE"
    echo "   NOTA: Requiere mapeo DNI → UUID desde BD" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    echo "🖼️  PROFILE-IMAGES:" | tee -a "$REPORT_FILE"
    echo "   Origen: $BACKUPS_DIR/*/profile-images/[DNI]/" | tee -a "$REPORT_FILE"
    echo "   Destino: storage/profile-images/[UUID]/" | tee -a "$REPORT_FILE"
    echo "   NOTA: Requiere mapeo DNI → UUID desde BD" | tee -a "$REPORT_FILE"
    echo | tee -a "$REPORT_FILE"
    
    # Mostrar algunos ejemplos reales
    echo "📋 EJEMPLOS REALES ENCONTRADOS:" | tee -a "$REPORT_FILE"
    if [ -d "$BACKUPS_DIR/06_agosto/documents" ]; then
        echo "   DNIs en respaldos:" | tee -a "$REPORT_FILE"
        ls "$BACKUPS_DIR/06_agosto/documents" | head -5 | while read dni; do
            file_count=$(find "$BACKUPS_DIR/06_agosto/documents/$dni" -type f 2>/dev/null | wc -l)
            echo "   • $dni ($file_count archivos)" | tee -a "$REPORT_FILE"
        done
    fi
else
    echo "❌ Respaldos locales no disponibles" | tee -a "$REPORT_FILE"
fi

echo | tee -a "$REPORT_FILE"

# ============================================================================
# 5. PLAN DE RESTAURACIÓN
# ============================================================================
echo -e "${BLUE}📊 5. PLAN DE RESTAURACIÓN:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🎯 PASOS NECESARIOS:" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "1️⃣  CREAR ESTRUCTURA DE DIRECTORIOS:" | tee -a "$REPORT_FILE"
echo "   mkdir -p storage/{documents,cv-documents,profile-images,temp}" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "2️⃣  MAPEAR DNI → UUID:" | tee -a "$REPORT_FILE"
echo "   • Consultar BD para obtener UUID de cada DNI" | tee -a "$REPORT_FILE"
echo "   • Crear tabla de mapeo DNI → UUID" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "3️⃣  RESTAURAR DOCUMENTS:" | tee -a "$REPORT_FILE"
echo "   • Copiar directamente por DNI" | tee -a "$REPORT_FILE"
echo "   • Mantener estructura: storage/documents/[DNI]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "4️⃣  RESTAURAR CV-DOCUMENTS:" | tee -a "$REPORT_FILE"
echo "   • Usar mapeo DNI → UUID" | tee -a "$REPORT_FILE"
echo "   • Copiar a: storage/cv-documents/[UUID]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "5️⃣  RESTAURAR PROFILE-IMAGES:" | tee -a "$REPORT_FILE"
echo "   • Usar mapeo DNI → UUID" | tee -a "$REPORT_FILE"
echo "   • Copiar a: storage/profile-images/[UUID]/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "6️⃣  VERIFICAR INTEGRIDAD:" | tee -a "$REPORT_FILE"
echo "   • Validar que archivos son accesibles" | tee -a "$REPORT_FILE"
echo "   • Probar carga desde la aplicación" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

# ============================================================================
# 6. COMANDOS ÚTILES
# ============================================================================
echo -e "${BLUE}📊 6. COMANDOS ÚTILES:${NC}" | tee -a "$REPORT_FILE"
echo "===========================================" | tee -a "$REPORT_FILE"

echo "🔧 CREAR ESTRUCTURA:" | tee -a "$REPORT_FILE"
echo "mkdir -p storage/{documents,cv-documents,profile-images,contest-bases,temp}" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "🔍 VERIFICAR PERMISOS:" | tee -a "$REPORT_FILE"
echo "chown -R root:root storage/" | tee -a "$REPORT_FILE"
echo "chmod -R 755 storage/" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo "📊 ESTADÍSTICAS:" | tee -a "$REPORT_FILE"
echo "find storage/ -type f | wc -l    # Contar archivos" | tee -a "$REPORT_FILE"
echo "du -sh storage/                  # Tamaño total" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

echo -e "${GREEN}✅ MAPEO DE ESTRUCTURA COMPLETADO${NC}"
echo -e "${CYAN}📄 Reporte guardado en: $REPORT_FILE${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN CLAVE:${NC}"
echo -e "${YELLOW}=================${NC}"
echo "• Documents: storage/documents/[DNI]/"
echo "• CV Documents: storage/cv-documents/[UUID]/"
echo "• Profile Images: storage/profile-images/[UUID]/"
echo "• Contest Bases: storage/contest-bases/"
echo "• Temp: storage/temp/"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡MAPEO COMPLETADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"