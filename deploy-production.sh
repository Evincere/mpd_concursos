#!/bin/bash

# Script de deployment para servidor Donweb
# MPD Concursos - Versión de Producción
# Servidor: vps-4778464-x.dattaweb.com (149.50.132.23)

set -e

echo "🚀 Iniciando deployment de MPD Concursos en producción..."
echo "📍 Servidor: 149.50.132.23"
echo "⏰ Fecha: $(date)"

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
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    error "No se encontró docker-compose.yml. Ejecuta este script desde la raíz del proyecto."
fi

# Verificar que Docker está instalado y funcionando
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado o no está en el PATH"
fi

if ! docker info &> /dev/null; then
    error "Docker no está funcionando. Verifica que el servicio esté iniciado."
fi

# Verificar que Docker Compose está disponible
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado o no está en el PATH"
fi

log "✅ Verificaciones iniciales completadas"

# Crear directorios necesarios
log "📁 Creando directorios necesarios..."
mkdir -p logs
mkdir -p mysql-init
mkdir -p backups

# Detener contenedores existentes si están corriendo
log "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Limpiar imágenes antiguas (opcional)
read -p "¿Deseas limpiar imágenes Docker antiguas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🧹 Limpiando imágenes Docker antiguas..."
    docker system prune -f
    docker image prune -f
fi

# Construir imágenes
log "🔨 Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Verificar que las imágenes se construyeron correctamente
log "🔍 Verificando imágenes construidas..."
if ! docker images | grep -q "mpd-concursos"; then
    warn "No se encontraron imágenes de mpd-concursos. Continuando..."
fi

# Iniciar servicios
log "🚀 Iniciando servicios en producción..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los contenedores
log "🔍 Verificando estado de los contenedores..."
docker-compose -f docker-compose.prod.yml ps

# Verificar conectividad
log "🌐 Verificando conectividad de servicios..."

# Verificar MySQL
log "Verificando MySQL..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent; then
        log "✅ MySQL está funcionando"
        break
    fi
    if [ $i -eq 30 ]; then
        error "❌ MySQL no responde después de 30 intentos"
    fi
    sleep 2
done

# Verificar Backend
log "Verificando Backend..."
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health &> /dev/null; then
        log "✅ Backend está funcionando"
        break
    fi
    if [ $i -eq 30 ]; then
        error "❌ Backend no responde después de 30 intentos"
    fi
    sleep 2
done

# Verificar Frontend
log "Verificando Frontend..."
for i in {1..15}; do
    if curl -f http://localhost:8000 &> /dev/null; then
        log "✅ Frontend está funcionando"
        break
    fi
    if [ $i -eq 15 ]; then
        error "❌ Frontend no responde después de 15 intentos"
    fi
    sleep 2
done

# Mostrar logs recientes
log "📋 Mostrando logs recientes..."
echo "=== LOGS MYSQL ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 mysql
echo "=== LOGS BACKEND ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 backend
echo "=== LOGS FRONTEND ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend

# Información final
log "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "📊 Información del deployment:"
echo "  🌐 Frontend: http://149.50.132.23:8000"
echo "  🔧 Backend:  http://149.50.132.23:8080"
echo "  🗄️  MySQL:   149.50.132.23:3307"
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs:        docker-compose -f docker-compose.prod.yml logs -f [servicio]"
echo "  Reiniciar:       docker-compose -f docker-compose.prod.yml restart [servicio]"
echo "  Detener todo:    docker-compose -f docker-compose.prod.yml down"
echo "  Estado:          docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🔍 Para monitorear:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"

log "✅ Deployment finalizado. La aplicación está lista para usar."
