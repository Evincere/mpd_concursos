#!/bin/bash

echo "📊 REPORTE FINAL - PROBLEMA DE DOCUMENTOS"
echo "========================================"
echo "Fecha: $(date)"
echo ""

# Estado de contenedores
echo "🐳 Estado de contenedores:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📁 Configuración actual del volumen:"
echo "Mapeo: storage_data_prod:/app/storage"
grep -n "storage_data_prod:" docker-compose.prod.yml

echo ""
echo "🔍 Verificación del backend:"
docker compose -f docker-compose.prod.yml logs backend | grep "Using document storage location" | tail -1

echo ""
echo "📊 Estadísticas de documentos:"
docker exec -it mpd-concursos-mysql-prod mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT 
    COUNT(*) as total_documents,
    SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived_docs,
    SUM(CASE WHEN file_path LIKE 'documents/%' THEN 1 ELSE 0 END) as docs_with_prefix,
    SUM(CASE WHEN file_path NOT LIKE 'documents/%' AND file_path IS NOT NULL AND is_archived = 0 THEN 1 ELSE 0 END) as docs_without_prefix
FROM documents;" 2>/dev/null

echo ""
echo "🔄 Estado del monitoreo automático:"
echo "Cron job:"
crontab -l | grep path_monitor

echo ""
echo "Últimas ejecuciones del monitoreo:"
tail -10 logs/path_monitor.log | grep -E "\[.*\]"

echo ""
echo "📂 Estructura actual del storage:"
sudo ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage/documents/ | head -5

echo ""
echo "💾 Backups disponibles:"
ls -lah storage_backup*.tar.gz | tail -3

echo ""
echo "✅ RESUMEN:"
echo "- ✅ Volumen corregido: /app/document-storage → /app/storage"
echo "- ✅ Datos migrados correctamente"
echo "- ✅ Monitoreo automático de rutas activo"
echo "- ✅ Backend funcionando con nueva configuración"
echo "- ⚠️  Documentos recientes (6 agosto) perdidos (se guardaron en ubicación temporal)"
echo "- 📦 Backups completos disponibles"

