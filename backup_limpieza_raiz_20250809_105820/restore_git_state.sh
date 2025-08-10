#!/bin/bash
# Script para restaurar el estado del código después de usar respaldos del proveedor

echo "🔄 [$(date)] RESTAURANDO ESTADO DEL CÓDIGO DESDE REPOSITORIO REMOTO"

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo "❌ Error: No estamos en un repositorio git"
    exit 1
fi

echo "📥 Actualizando desde repositorio remoto..."

# Configurar git si es necesario
git config user.email "admin@mpd-concursos.gov.ar" 2>/dev/null || true
git config user.name "MPD Concursos Admin" 2>/dev/null || true

# Obtener cambios del remoto
git fetch origin main

# Resetear al estado del remoto (esto sobrescribirá cambios locales)
echo "⚠️ Reseteando al estado del repositorio remoto..."
git reset --hard origin/main

echo "✅ Código restaurado desde repositorio remoto"
echo "📊 Estado actual:"
git log --oneline -5

echo ""
echo "🎯 PRÓXIMO PASO:"
echo "Los scripts de recuperación están ahora disponibles en:"
echo "- recovery_scripts_external/"
echo "- RECOVERY_INCIDENT_REPORT.md"
