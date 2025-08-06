#!/bin/bash
# Script de monitoreo y corrección automática de rutas de documentos
# Ejecutar cada 5 minutos via cron

LOG_FILE="/root/concursos/mpd_concursos/logs/path_monitor.log"
MYSQL_PASS=$(grep MYSQL_ROOT_PASSWORD /root/concursos/mpd_concursos/.env.production | cut -d'=' -f2)

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_message "🔍 Iniciando monitoreo de rutas de documentos"

# Buscar documentos con rutas incorrectas (subidos en los últimos 10 minutos)
INCORRECT_PATHS=$(docker exec mpd-concursos-mysql-prod mysql -u root -p"$MYSQL_PASS" mpd_concursos -e "
SELECT COUNT(*) 
FROM documents 
WHERE file_path IS NOT NULL 
  AND file_path NOT LIKE 'documents/%' 
  AND upload_date >= DATE_SUB(NOW(), INTERVAL 10 MINUTE);
" 2>/dev/null | tail -n 1)

if [ "$INCORRECT_PATHS" -gt 0 ]; then
    log_message "⚠️  Encontradas $INCORRECT_PATHS rutas incorrectas - Corrigiendo..."
    
    # Corregir rutas automáticamente
    docker exec mpd-concursos-mysql-prod mysql -u root -p"$MYSQL_PASS" mpd_concursos -e "
    UPDATE documents 
    SET file_path = CONCAT('documents/', file_path) 
    WHERE file_path IS NOT NULL 
      AND file_path NOT LIKE 'documents/%'
      AND upload_date >= DATE_SUB(NOW(), INTERVAL 10 MINUTE);
    " 2>/dev/null

    log_message "✅ Corrección automática completada para $INCORRECT_PATHS documentos"
    
    # Generar alerta por email/slack si es necesario
    echo "ALERTA: Rutas corregidas automáticamente - $INCORRECT_PATHS documentos" >> "$LOG_FILE"
else
    log_message "✅ No se encontraron rutas incorrectas en los últimos 10 minutos"
fi

log_message "🔍 Monitoreo completado"
