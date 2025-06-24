#!/bin/bash

# Script de renovación SSL para MPD Concursos
# Autor: Augment Agent
# Fecha: 2025-06-24

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar que se ejecuta desde el directorio correcto
if [ ! -f "docker-compose.ssl.yml" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

log "Iniciando proceso de renovación de certificados SSL..."

# Verificar estado de los contenedores
if ! docker-compose -f docker-compose.ssl.yml ps | grep -q "Up"; then
    warn "Los servicios no están ejecutándose. Iniciando servicios..."
    docker-compose -f docker-compose.ssl.yml up -d
    sleep 30
fi

# Intentar renovar certificados
log "Verificando y renovando certificados..."
if docker-compose -f docker-compose.ssl.yml run --rm certbot renew --quiet; then
    log "✅ Certificados verificados/renovados exitosamente"
    
    # Recargar nginx para aplicar nuevos certificados
    log "Recargando configuración de Nginx..."
    if docker-compose -f docker-compose.ssl.yml exec nginx-proxy nginx -s reload; then
        log "✅ Nginx recargado exitosamente"
    else
        warn "No se pudo recargar Nginx, reiniciando contenedor..."
        docker-compose -f docker-compose.ssl.yml restart nginx-proxy
    fi
    
    # Verificar que HTTPS sigue funcionando
    sleep 5
    if curl -f -k https://localhost/health >/dev/null 2>&1; then
        log "✅ HTTPS funcionando correctamente después de la renovación"
    else
        error "HTTPS no está funcionando después de la renovación"
        exit 1
    fi
    
else
    error "Error al renovar certificados"
    exit 1
fi

# Limpiar logs antiguos de certbot
find ssl-setup/certbot/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true

log "✅ Proceso de renovación completado exitosamente"
