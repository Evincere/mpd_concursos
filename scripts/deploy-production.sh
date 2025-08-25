#!/bin/bash

# Script de deployment para producción - MPD Concursos
# Autor: Sistema de deployment automatizado
# Fecha: 2025-08-18
# Modificado para usar solo Nginx del sistema (sin nginx-proxy de Docker)

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.ssl.yml" ]; then
    error "docker-compose.ssl.yml no encontrado. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

log "🚀 Iniciando deployment de producción (usando Nginx del sistema)..."

# 1. Verificar Git status
log "📋 Verificando estado de Git..."
if [ -n "$(git status --porcelain)" ]; then
    warning "Hay cambios sin commitear en Git. Continuando..."
fi

# 2. Crear directorios necesarios
log "📁 Creando directorios necesarios..."
mkdir -p logs
mkdir -p scripts
mkdir -p storage
chmod 755 logs scripts storage

success "Directorios creados correctamente"

# 3. Verificar espacio en disco
log "💾 Verificando espacio en disco..."
AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # Menos de 1GB
    warning "Espacio en disco bajo: $(df -h . | tail -1 | awk '{print $4}') disponible"
fi

# 4. Parar servicios existentes
log "🛑 Parando servicios existentes..."
docker compose -f docker-compose.ssl.yml down --remove-orphans || true

# 5. Limpiar recursos Docker no utilizados
log "🧹 Limpiando recursos Docker no utilizados..."
docker system prune -f

# 6. Construir e iniciar servicios
log "🔨 Construyendo e iniciando servicios..."
docker compose -f docker-compose.ssl.yml up -d --build

# 7. Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# 8. Verificar estado de los servicios
log "🔍 Verificando estado de los servicios..."
docker compose -f docker-compose.ssl.yml ps

# 9. Verificar health checks
log "🏥 Verificando health checks..."
sleep 10

# Verificar MySQL
if docker compose -f docker-compose.ssl.yml ps mysql | grep -q "Up (healthy)"; then
    success "MySQL está funcionando correctamente"
else
    warning "MySQL no está completamente listo"
fi

# Verificar Backend
if docker compose -f docker-compose.ssl.yml ps backend | grep -q "Up (healthy)"; then
    success "Backend está funcionando correctamente"
else
    warning "Backend no está completamente listo"
fi

# Verificar Frontend
if docker compose -f docker-compose.ssl.yml ps frontend | grep -q "Up"; then
    success "Frontend está funcionando correctamente"
else
    warning "Frontend no está completamente listo"
fi

# 10. Verificar conectividad
log "🌐 Verificando conectividad..."
if curl -s -f http://localhost:8080/api/health > /dev/null; then
    success "Backend API responde correctamente"
else
    warning "Backend API no responde"
fi

if curl -s -f http://localhost:8000 > /dev/null; then
    success "Frontend responde correctamente"
else
    warning "Frontend no responde"
fi

# 11. Mostrar logs recientes si hay errores
log "📋 Verificando logs por errores..."
if docker compose -f docker-compose.ssl.yml logs --tail=20 | grep -i "error\|exception\|failed" > /dev/null; then
    warning "Se encontraron algunos errores en los logs. Revisa los logs completos con:"
    echo "docker compose -f docker-compose.ssl.yml logs backend"
fi

# 12. Configurar backups automáticos
log "🔄 Configurando backups automáticos..."
if [ -f "./scripts/setup-backup-cron.sh" ]; then
    ./scripts/setup-backup-cron.sh -f daily -t 00:00 || warning "Error al configurar backup a las 00:00"
    ./scripts/setup-backup-cron.sh -f daily -t 06:00 || warning "Error al configurar backup a las 06:00"
    ./scripts/setup-backup-cron.sh -f daily -t 12:00 || warning "Error al configurar backup a las 12:00"
    ./scripts/setup-backup-cron.sh -f daily -t 18:00 || warning "Error al configurar backup a las 18:00"
    success "Backups automáticos configurados"
else
    warning "Script de backup no encontrado. Configúralos manualmente."
fi

# 13. Verificar Nginx del sistema
log "🌐 Verificando Nginx del sistema..."
if systemctl is-active --quiet nginx; then
    success "Nginx del sistema está funcionando"
    log "📋 Recuerda verificar que la configuración SSL incluya proxy para dashboard-monitor"
else
    warning "Nginx del sistema no está funcionando. Verificar configuración."
fi

# 14. Mostrar información final
echo ""
success "Deployment completado!"
echo ""
log "📊 Servicios disponibles en:"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}'):8000 (via Nginx: https://${DOMAIN:-vps-4778464-x.dattaweb.com})"
echo "  - Backend:  http://$(hostname -I | awk '{print $1}'):8080 (via Nginx: https://${DOMAIN:-vps-4778464-x.dattaweb.com}/api)"
echo "  - Dashboard Monitor: https://${DOMAIN:-vps-4778464-x.dattaweb.com}/dashboard-monitor"
echo ""
log "📁 Directorios de almacenamiento:"
echo "  - Documentos: ./storage (mapeado a /app/document-storage)"
echo "  - Logs:       ./logs"
echo "  - Backups:    Docker volume backup_data_prod"
echo ""
log "🔧 Comandos útiles:"
echo "  - Ver logs:     docker compose -f docker-compose.ssl.yml logs -f"
echo "  - Reiniciar:    docker compose -f docker-compose.ssl.yml restart"
echo "  - Parar:        docker compose -f docker-compose.ssl.yml down"
echo "  - Nginx logs:   sudo tail -f /var/log/nginx/access.log"
echo ""
