#!/bin/bash
# Script 4: Verificación final del proceso de recuperación

set -e

echo "🔍 [$(date)] VERIFICANDO PROCESO DE RECUPERACIÓN"

STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

# Verificar que Docker esté corriendo
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Error: Docker no está disponible"
    exit 1
fi

# Verificar que los contenedores estén ejecutándose
echo "🐳 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar acceso a la base de datos
echo ""
echo "💾 Verificando acceso a base de datos..."
if docker exec mpd-concursos-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2) mpd_concursos -e "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Base de datos accesible"
else
    echo "❌ Error: No se puede acceder a la base de datos"
    exit 1
fi

# Contar documentos en la base de datos
echo ""
echo "📊 Estadísticas de documentos en base de datos:"
docker exec mpd-concursos-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT 
    'Total documentos' as metrica, COUNT(*) as valor
FROM documents
UNION ALL
SELECT 
    'Docs con archivo' as metrica, COUNT(*) as valor
FROM documents WHERE file_path IS NOT NULL
UNION ALL
SELECT 
    'Docs estado PENDING' as metrica, COUNT(*) as valor
FROM documents WHERE status = 'PENDING'
UNION ALL
SELECT 
    'Docs subidos 1-3 Ago' as metrica, COUNT(*) as valor
FROM documents WHERE upload_date >= '2025-08-01' AND upload_date <= '2025-08-03 08:00:00';
"

# Verificar archivos físicos en storage
echo ""
echo "📁 Estadísticas de archivos físicos:"
if [ -d "$STORAGE_PATH" ]; then
    TOTAL_PDFS=$(find "$STORAGE_PATH" -name "*.pdf" 2>/dev/null | wc -l)
    STORAGE_SIZE=$(du -sh "$STORAGE_PATH" 2>/dev/null | cut -f1)
    echo "   Total archivos PDF: $TOTAL_PDFS"
    echo "   Tamaño total storage: $STORAGE_SIZE"
else
    echo "❌ Error: Directorio de storage no existe: $STORAGE_PATH"
fi

# Generar reporte de usuarios afectados actualizado
echo ""
echo "📋 Generando reporte actualizado de usuarios afectados..."
docker exec mpd-concursos-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT COUNT(DISTINCT u.email) as usuarios_con_docs_pendientes
FROM documents d
INNER JOIN user_entity u ON d.user_id = u.id
WHERE d.upload_date >= '2025-08-01' 
  AND d.upload_date <= '2025-08-03 08:00:00' 
  AND d.status = 'PENDING';
" | tail -n +2 > usuarios_pendientes_post_recuperacion.txt

USUARIOS_PENDIENTES=$(cat usuarios_pendientes_post_recuperacion.txt)

echo ""
echo "🎯 RESUMEN FINAL:"
echo "   👥 Usuarios con documentos pendientes: $USUARIOS_PENDIENTES"

if [ "$USUARIOS_PENDIENTES" -eq 0 ]; then
    echo "   🎉 ¡ÉXITO! Todos los documentos han sido recuperados"
elif [ "$USUARIOS_PENDIENTES" -lt 10 ]; then
    echo "   ✅ PARCIALMENTE EXITOSO - Pocos usuarios pendientes"
else
    echo "   ⚠️  REVISAR - Aún hay muchos usuarios con documentos pendientes"
fi

echo ""
echo "📝 Archivo de log generado: usuarios_pendientes_post_recuperacion.txt"
echo "🔗 Próximo paso: Probar descarga de documentos desde la aplicación web"

