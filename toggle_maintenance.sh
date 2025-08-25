#!/bin/bash

# ================================================================
# SCRIPT PARA ACTIVAR/DESACTIVAR MODO MANTENIMIENTO
# ================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_CONTAINER="mpd-concursos-frontend"
NGINX_CONTAINER="mpd-concursos-nginx-proxy"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

show_help() {
    cat << HELP
Gestor de Modo Mantenimiento - Concursos MPD

USO:
    $0 [COMANDO]

COMANDOS:
    enable      Activar modo mantenimiento
    disable     Desactivar modo mantenimiento  
    status      Ver estado actual
    help        Mostrar esta ayuda

EJEMPLOS:
    $0 enable   # Activar página de mantenimiento
    $0 disable  # Volver al funcionamiento normal
    $0 status   # Ver si está en mantenimiento

HELP
}

backup_current_config() {
    log "${YELLOW}Creando backup de configuración actual...${NC}"
    
    # Backup de la configuración actual del frontend
    docker exec $FRONTEND_CONTAINER cp /etc/nginx/conf.d/default.conf /tmp/nginx.conf.backup
    docker cp $FRONTEND_CONTAINER:/tmp/nginx.conf.backup ./nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    log "${GREEN}Backup creado exitosamente${NC}"
}

enable_maintenance() {
    log "${YELLOW}🔧 Activando modo mantenimiento...${NC}"
    
    # 1. Crear backup
    backup_current_config
    
    # 2. Copiar página de mantenimiento al contenedor
    log "📄 Copiando página de mantenimiento..."
    docker exec $FRONTEND_CONTAINER mkdir -p /usr/share/nginx/html/maintenance
    docker cp ./maintenance/maintenance.html $FRONTEND_CONTAINER:/usr/share/nginx/html/maintenance/
    
    # 3. Copiar nueva configuración de nginx
    log "⚙️ Actualizando configuración de nginx..."
    docker cp ./maintenance/nginx-maintenance.conf $FRONTEND_CONTAINER:/etc/nginx/conf.d/default.conf
    
    # 4. Recargar nginx
    log "🔄 Recargando configuración de nginx..."
    docker exec $FRONTEND_CONTAINER nginx -t
    docker exec $FRONTEND_CONTAINER nginx -s reload
    
    # 5. Verificar
    sleep 2
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        log "${GREEN}✅ Modo mantenimiento activado exitosamente${NC}"
        log "${GREEN}📄 Los usuarios verán la página de mantenimiento${NC}"
        log "${GREEN}👨‍💼 Los administradores pueden acceder a /admin y /api/${NC}"
    else
        log "${RED}❌ Error al activar modo mantenimiento${NC}"
        return 1
    fi
}

disable_maintenance() {
    log "${YELLOW}🔧 Desactivando modo mantenimiento...${NC}"
    
    # Restaurar configuración original
    LATEST_BACKUP=$(ls -t nginx.conf.backup.* 2>/dev/null | head -1)
    
    if [ -f "$LATEST_BACKUP" ]; then
        log "📄 Restaurando configuración desde: $LATEST_BACKUP"
        docker cp "$LATEST_BACKUP" $FRONTEND_CONTAINER:/etc/nginx/conf.d/default.conf
        
        # Recargar nginx
        log "🔄 Recargando configuración de nginx..."
        docker exec $FRONTEND_CONTAINER nginx -t
        docker exec $FRONTEND_CONTAINER nginx -s reload
        
        sleep 2
        log "${GREEN}✅ Modo mantenimiento desactivado exitosamente${NC}"
        log "${GREEN}🌐 La plataforma está nuevamente accesible${NC}"
    else
        log "${RED}❌ No se encontró backup de configuración${NC}"
        log "${YELLOW}💡 Puede restaurar manualmente copiando la configuración original${NC}"
        return 1
    fi
}

check_status() {
    log "🔍 Verificando estado actual..."
    
    # Verificar si la página de mantenimiento está activa
    if curl -s http://localhost | grep -q "Proceso Finalizado"; then
        log "${YELLOW}🔧 MODO MANTENIMIENTO: ACTIVADO${NC}"
        log "📄 Los usuarios ven la página de mantenimiento"
        return 0
    else
        log "${GREEN}🌐 MODO NORMAL: PLATAFORMA ACCESIBLE${NC}"
        log "✅ Los usuarios pueden acceder normalmente"
        return 1
    fi
}

# Función principal
main() {
    case "${1:-help}" in
        enable)
            enable_maintenance
            ;;
        disable)
            disable_maintenance
            ;;
        status)
            check_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Comando desconocido: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Verificar que Docker esté disponible y contenedores corriendo
if ! command -v docker &> /dev/null; then
    log "${RED}❌ Docker no está disponible${NC}"
    exit 1
fi

if ! docker ps | grep -q $FRONTEND_CONTAINER; then
    log "${RED}❌ Contenedor $FRONTEND_CONTAINER no está corriendo${NC}"
    exit 1
fi

# Ejecutar función principal
main "$@"
