#!/bin/bash
set -euo pipefail

# SCRIPT DE CORRECCIÓN DEL MAPEO DE VOLÚMENES
# Corrige la conexión entre la aplicación y los archivos históricos

FECHA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/concursos/mpd_concursos/backups_correccion"
VOLUME_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

echo "🛠️ INICIANDO CORRECCIÓN DEL MAPEO DE VOLÚMENES"
echo "📅 Fecha: $(date)"
echo ""

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

echo "🔒 PASO 1: BACKUP DE SEGURIDAD"
echo "   Creando backup del estado actual del contenedor..."
docker exec mpd-concursos-backend tar -czf /tmp/current_app_backup.tar.gz /app/ 2>/dev/null || true
docker cp mpd-concursos-backend:/tmp/current_app_backup.tar.gz "$BACKUP_DIR/backup_pre_fix_$FECHA.tar.gz" 2>/dev/null || echo "   ℹ️  No se pudo copiar backup del contenedor (normal si está vacío)"

echo "   Creando backup del volumen Docker..."
tar -czf "$BACKUP_DIR/backup_storage_volume_$FECHA.tar.gz" "$VOLUME_PATH/"
echo "   ✅ Backups creados en: $BACKUP_DIR"

echo ""
echo "📊 PASO 2: VERIFICACIÓN PREVIA"
echo "   Estado actual del volumen:"
echo "   📁 Directorio: $VOLUME_PATH"
echo "   📄 Archivos PDF: $(find "$VOLUME_PATH" -name "*.pdf" | wc -l)"
echo "   👥 Usuarios: $(find "$VOLUME_PATH/documents" -maxdepth 1 -type d | wc -l 2>/dev/null || echo 0)"
echo "   💾 Tamaño: $(du -sh "$VOLUME_PATH" | cut -f1)"

echo ""
echo "⏹️ PASO 3: DETENER SERVICIOS"
echo "   Deteniendo contenedores (manteniendo volúmenes)..."
docker compose down
echo "   ✅ Servicios detenidos"

echo ""
echo "📂 PASO 4: VERIFICAR ESTRUCTURA DEL VOLUMEN"
echo "   Verificando directorios necesarios..."

# Crear directorios si no existen
mkdir -p "$VOLUME_PATH/documents"
mkdir -p "$VOLUME_PATH/cv-documents"
mkdir -p "$VOLUME_PATH/profile-images"  
mkdir -p "$VOLUME_PATH/contest-bases"
mkdir -p "$VOLUME_PATH/temp"

echo "   ✅ Estructura verificada:"
ls -la "$VOLUME_PATH/"

echo ""
echo "🚀 PASO 5: RECREAR CONTENEDORES CON MAPEO CORRECTO"
echo "   Recreando contenedores desde cero..."
docker compose up -d --force-recreate

echo ""
echo "⏳ PASO 6: ESPERANDO INICIO DE SERVICIOS"
echo "   Esperando que los contenedores inicien..."
sleep 30

# Verificar que los contenedores estén up
if ! docker ps | grep -q mpd-concursos-backend; then
    echo "   ❌ ERROR: El contenedor backend no está corriendo"
    exit 1
fi

echo ""
echo "🔍 PASO 7: VERIFICACIÓN DEL MAPEO"
echo "   Verificando que el volumen esté montado..."

MOUNTS_CHECK=$(docker inspect mpd-concursos-backend | grep -c "Mounts" || echo 0)
if [ "$MOUNTS_CHECK" -gt 0 ]; then
    echo "   ✅ Volumen montado detectado"
    docker inspect mpd-concursos-backend | grep -A 10 "Mounts"
else
    echo "   ❌ ERROR: No se detectó mapeo de volumen"
    echo "   Verificando configuración..."
    docker inspect mpd-concursos-backend | grep -A 5 -B 5 "storage" || echo "   Sin configuración de storage"
fi

echo ""
echo "🔍 PASO 8: VERIFICACIÓN DE ARCHIVOS DENTRO DEL CONTENEDOR"
echo "   Verificando que la aplicación vea los archivos..."

# Esperar un poco más para que el contenedor esté completamente listo
sleep 10

ARCHIVOS_VISIBLES=$(docker exec mpd-concursos-backend find /app/storage -name "*.pdf" 2>/dev/null | wc -l || echo 0)
DIRECTORIOS_USUARIOS=$(docker exec mpd-concursos-backend ls /app/storage/documents/ 2>/dev/null | wc -l || echo 0)

echo "   📄 Archivos PDF visibles por la app: $ARCHIVOS_VISIBLES"
echo "   👥 Directorios de usuarios: $DIRECTORIOS_USUARIOS"

if [ "$ARCHIVOS_VISIBLES" -gt 2000 ]; then
    echo "   ✅ ÉXITO: La aplicación puede ver los archivos históricos"
else
    echo "   ⚠️  ADVERTENCIA: La aplicación ve pocos archivos ($ARCHIVOS_VISIBLES)"
fi

echo ""
echo "🏥 PASO 9: VERIFICACIÓN DE SALUD DE LA APLICACIÓN"
echo "   Verificando logs de la aplicación..."
docker logs mpd-concursos-backend --tail=10

echo ""
echo "📊 PASO 10: RESUMEN FINAL"
echo "   Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
if [ "$ARCHIVOS_VISIBLES" -gt 2000 ] && [ "$DIRECTORIOS_USUARIOS" -gt 250 ]; then
    echo "🎉 ¡CORRECCIÓN EXITOSA!"
    echo "   ✅ Volumen correctamente montado"
    echo "   ✅ Aplicación puede acceder a archivos históricos"
    echo "   ✅ $ARCHIVOS_VISIBLES archivos disponibles"
    echo "   ✅ Sistema listo para nuevos uploads"
else
    echo "❌ CORRECCIÓN INCOMPLETA"
    echo "   El mapeo puede no estar funcionando correctamente"
    echo "   Revisar logs y configuración manualmente"
fi

echo ""
echo "📁 Backups disponibles en: $BACKUP_DIR"
echo "📋 Documentación: plan_correccion_volumenes.md"
echo "📅 Completado: $(date)"

