#!/bin/bash
# Script 0: Verificación del estado del sistema antes de la recuperación

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔍 [$(date)] VERIFICACIÓN DEL ESTADO DEL SISTEMA"
echo "📅 Timestamp: $TIMESTAMP"

echo ""
echo "🐳 ESTADO DE CONTENEDORES DOCKER:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep mpd-concursos || echo "❌ No se encontraron contenedores mpd-concursos"

echo ""
echo "📊 ESTADO ACTUAL DE DOCUMENTOS:"

# Contar documentos actuales
CURRENT_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" 2>/dev/null | wc -l)
CURRENT_CV=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" 2>/dev/null | wc -l)
CURRENT_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)

echo "   📄 Documentos de inscripción: $CURRENT_DOCS"
echo "   📋 Documentos CV: $CURRENT_CV"
echo "   🖼️ Fotos de perfil: $CURRENT_IMAGES"
echo "   📁 Total archivos: $((CURRENT_DOCS + CURRENT_CV + CURRENT_IMAGES))"

echo ""
echo "👥 USUARIOS CON DOCUMENTOS:"
USERS_WITH_DOCS=$(docker exec mpd-concursos-backend-prod ls /app/storage/documents 2>/dev/null | wc -l)
echo "   📁 Directorios de usuarios: $USERS_WITH_DOCS"

echo ""
echo "🗄️ ESTADO DE LA BASE DE DATOS:"
DB_USERS=$(docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) as total FROM user_entity;" 2>/dev/null | tail -n 1)
DB_DOCS=$(docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) as total FROM documents;" 2>/dev/null | tail -n 1)
echo "   👥 Total usuarios en BD: $DB_USERS"
echo "   📄 Total documentos en BD: $DB_DOCS"

echo ""
echo "💾 ESPACIO EN DISCO:"
df -h | grep -E "(Filesystem|/dev/)" | head -2

echo ""
echo "🌐 CONECTIVIDAD DEL BACKEND:"
HEALTH_CHECK=$(curl -s http://localhost:8080/actuator/health 2>/dev/null | grep -o '"status":"UP"' || echo "DOWN")
if [ "$HEALTH_CHECK" = '"status":"UP"' ]; then
    echo "   ✅ Backend: UP"
else
    echo "   ❌ Backend: DOWN o no responde"
fi

echo ""
echo "📋 ESTADO DEL REPOSITORIO GIT:"
cd /root/concursos/mpd_concursos
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git branch --show-current)
UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)

echo "   🌿 Rama actual: $CURRENT_BRANCH"
echo "   📝 Commit actual: $CURRENT_COMMIT"
echo "   📊 Cambios sin commit: $UNCOMMITTED_CHANGES"

if [ "$CURRENT_COMMIT" = "fa63bd9a" ]; then
    echo "   ✅ Código fuente respaldado correctamente"
else
    echo "   ⚠️ Commit actual diferente al respaldo esperado (fa63bd9a)"
fi

echo ""
echo "🔧 VERIFICACIÓN DE SCRIPTS DE RECUPERACIÓN:"
SCRIPTS_DIR="/root/concursos/mpd_concursos/recovery_scripts_external"
REQUIRED_SCRIPTS=(
    "01_backup_current_state.sh"
    "02_extract_from_backup_enhanced.sh"
    "03_consolidate_external_enhanced.sh"
    "04_final_integration_enhanced.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ] && [ -x "$SCRIPTS_DIR/$script" ]; then
        echo "   ✅ $script: Disponible y ejecutable"
    else
        echo "   ❌ $script: No encontrado o no ejecutable"
    fi
done

echo ""
echo "📡 VERIFICACIÓN DE CONECTIVIDAD EXTERNA:"
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "   ✅ Conectividad a Internet: OK"
else
    echo "   ❌ Conectividad a Internet: FALLO"
fi

echo ""
echo "🎯 RESUMEN DE VERIFICACIÓN:"
echo "   📊 Estado actual documentado: $((CURRENT_DOCS + CURRENT_CV + CURRENT_IMAGES)) archivos"
echo "   👥 Usuarios con documentos: $USERS_WITH_DOCS"
echo "   🐳 Contenedores: $(docker ps | grep mpd-concursos | wc -l)/3 funcionando"
echo "   🌐 Backend: $([ "$HEALTH_CHECK" = '"status":"UP"' ] && echo "Funcionando" || echo "Con problemas")"
echo "   📋 Código fuente: $([ "$CURRENT_COMMIT" = "fa63bd9a" ] && echo "Respaldado" || echo "Verificar respaldo")"

echo ""
if [ "$HEALTH_CHECK" = '"status":"UP"' ] && [ "$CURRENT_COMMIT" = "fa63bd9a" ] && [ $((CURRENT_DOCS + CURRENT_CV + CURRENT_IMAGES)) -gt 300 ]; then
    echo "✅ SISTEMA LISTO PARA RECUPERACIÓN HÍBRIDA"
    echo ""
    echo "🚀 PRÓXIMO PASO:"
    echo "   ./recovery_scripts_external/01_backup_current_state.sh"
else
    echo "⚠️ SISTEMA REQUIERE ATENCIÓN ANTES DE PROCEDER"
    echo ""
    echo "🔧 ACCIONES REQUERIDAS:"
    [ "$HEALTH_CHECK" != '"status":"UP"' ] && echo "   - Verificar y reparar backend"
    [ "$CURRENT_COMMIT" != "fa63bd9a" ] && echo "   - Hacer commit y push del código actual"
    [ $((CURRENT_DOCS + CURRENT_CV + CURRENT_IMAGES)) -le 300 ] && echo "   - Verificar estado de documentos actual"
fi

echo ""
echo "📋 INFORMACIÓN PARA REFERENCIA:"
echo "   🕐 Verificación realizada: $(date)"
echo "   📝 Timestamp: $TIMESTAMP"
echo "   🖥️ Servidor: $(hostname)"
echo "   📍 IP: $(hostname -I | awk '{print $1}')"