#!/bin/bash
# Plan Híbrido Simplificado - Máxima seguridad, máxima recuperación

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORK_DIR="/root/recovery_hybrid_$TIMESTAMP"
BACKUP_DIR="/root/backups"

echo "🎯 PLAN HÍBRIDO SIMPLIFICADO - INICIANDO"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio de trabajo: $WORK_DIR"

# Crear directorios
mkdir -p "$WORK_DIR" "$BACKUP_DIR"

echo ""
echo "📋 FASE 1: BACKUP COMPLETO DEL ESTADO ACTUAL"
echo "=============================================="

# Backup de volúmenes Docker actuales
echo "💾 Creando backup de storage actual..."
docker run --rm \
    -v mpd_concursos_storage_data_prod:/data \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/current_complete_$TIMESTAMP.tar.gz" -C /data .

# Backup de base de datos actual
echo "🗄️ Creando backup de BD actual..."
docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > "$BACKUP_DIR/current_db_$TIMESTAMP.sql"

# Crear inventario detallado
echo "📊 Creando inventario actual..."
docker exec mpd-concursos-backend-prod find /app/storage -type f -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" > "$BACKUP_DIR/current_inventory_$TIMESTAMP.txt"

echo "✅ Backup completo creado"
echo "   📦 Storage: $BACKUP_DIR/current_complete_$TIMESTAMP.tar.gz"
echo "   🗄️ BD: $BACKUP_DIR/current_db_$TIMESTAMP.sql"
echo "   📋 Inventario: $BACKUP_DIR/current_inventory_$TIMESTAMP.txt"

echo ""
echo "🎯 PRÓXIMOS PASOS MANUALES:"
echo "=========================="
echo ""
echo "1. 📥 RESTAURAR AL 4 AGOSTO (Dashboard del proveedor)"
echo "   - Ir a: Copias de seguridad"
echo "   - Seleccionar: 04/08/2025 - Ubuntu 22.04"
echo "   - Confirmar restauración"
echo "   - ESPERAR a que complete"
echo ""
echo "2. 🔄 EJECUTAR EXTRACCIÓN:"
echo "   ./extract_and_save.sh 4agosto"
echo ""
echo "3. 📥 RESTAURAR AL 5 AGOSTO"
echo "   - Seleccionar: 05/08/2025 - Ubuntu 22.04"
echo "   - Confirmar restauración"
echo ""
echo "4. 🔄 EJECUTAR EXTRACCIÓN:"
echo "   ./extract_and_save.sh 5agosto"
echo ""
echo "5. 📥 RESTAURAR AL 6 AGOSTO (MADRUGADA)"
echo "   - Seleccionar: 06/08/2025 - Ubuntu 22.04"
echo "   - Confirmar restauración"
echo ""
echo "6. 🔄 RESTAURAR NUESTRO TRABAJO:"
echo "   ./restore_our_work.sh $TIMESTAMP"
echo ""
echo "7. 🔄 INTEGRAR TODO:"
echo "   ./integrate_all_recovered.sh"
echo ""
echo "⚠️ IMPORTANTE:"
echo "- Guarda este timestamp: $TIMESTAMP"
echo "- No elimines archivos de $BACKUP_DIR"
echo "- Cada paso incluye verificaciones automáticas"
echo "- Tiempo total estimado: 4-6 horas"
