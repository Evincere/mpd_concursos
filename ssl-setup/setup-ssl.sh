#!/bin/bash

# Script de configuración SSL para MPD Concursos
# Autor: Augment Agent
# Fecha: 2025-06-24

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   error "Este script debe ejecutarse como root"
   exit 1
fi

# Verificar argumentos
if [ $# -ne 2 ]; then
    error "Uso: $0 <dominio> <email>"
    echo "Ejemplo: $0 concursos.mpd.gob.ar admin@mpd.gob.ar"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

log "Iniciando configuración SSL para $DOMAIN"

# Validar formato de email
if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    error "Formato de email inválido: $EMAIL"
    exit 1
fi

# Crear directorios necesarios
log "Creando estructura de directorios..."
mkdir -p ssl-setup/certbot/{conf,www,logs}
mkdir -p logs

# Configurar archivo .env
log "Configurando variables de entorno..."
cat > .env << EOF
# Configuración SSL para MPD Concursos
DOMAIN=$DOMAIN
SSL_EMAIL=$EMAIL
MYSQL_ROOT_PASSWORD=root1234_secure_$(openssl rand -hex 8)
MYSQL_DATABASE=mpd_concursos
MYSQL_USER=mpd_user
MYSQL_PASSWORD=mpd_password_secure_$(openssl rand -hex 8)
ENVIRONMENT=production
LOG_LEVEL=INFO
EOF

# Configurar nginx.conf con el dominio correcto
log "Configurando Nginx para $DOMAIN..."
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" ssl-setup/nginx.conf > ssl-setup/nginx.conf.tmp
mv ssl-setup/nginx.conf.tmp ssl-setup/nginx.conf

# Detener servicios actuales si están ejecutándose
log "Deteniendo servicios actuales..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Verificar que el puerto 80 esté libre
if netstat -tuln | grep -q ":80 "; then
    warn "El puerto 80 está en uso. Deteniendo servicios..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
fi

# Iniciar servicios sin SSL primero
log "Iniciando servicios temporales para validación de dominio..."
docker-compose -f docker-compose.ssl.yml up -d nginx-proxy

# Esperar a que nginx esté listo
sleep 10

# Verificar que nginx está funcionando
if ! curl -f http://localhost/health >/dev/null 2>&1; then
    error "Nginx no está respondiendo correctamente"
    exit 1
fi

# Obtener certificado SSL
log "Obteniendo certificado SSL de Let's Encrypt..."
docker-compose -f docker-compose.ssl.yml run --rm certbot

# Verificar que el certificado se obtuvo correctamente
if [ ! -f "ssl-setup/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    error "No se pudo obtener el certificado SSL"
    exit 1
fi

log "Certificado SSL obtenido exitosamente"

# Reiniciar nginx con SSL
log "Reiniciando servicios con SSL habilitado..."
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d

# Esperar a que todos los servicios estén listos
log "Esperando a que todos los servicios estén listos..."
sleep 30

# Verificar que HTTPS funciona
log "Verificando configuración HTTPS..."
if curl -f -k https://localhost/health >/dev/null 2>&1; then
    log "✅ HTTPS configurado correctamente"
else
    warn "HTTPS no está respondiendo correctamente, verificando configuración..."
fi

# Configurar renovación automática
log "Configurando renovación automática de certificados..."
cat > /etc/cron.d/certbot-renew << EOF
# Renovar certificados SSL automáticamente
0 12 * * * root cd $(pwd) && docker-compose -f docker-compose.ssl.yml run --rm certbot renew --quiet && docker-compose -f docker-compose.ssl.yml exec nginx-proxy nginx -s reload
EOF

log "✅ Configuración SSL completada exitosamente"
log "🌐 Tu aplicación está disponible en: https://$DOMAIN"
log "📧 Certificado registrado para: $EMAIL"
log "🔄 Renovación automática configurada"

echo ""
log "Comandos útiles:"
echo "  - Ver logs: docker-compose -f docker-compose.ssl.yml logs -f"
echo "  - Renovar certificado manualmente: docker-compose -f docker-compose.ssl.yml run --rm certbot renew"
echo "  - Reiniciar servicios: docker-compose -f docker-compose.ssl.yml restart"
echo ""
