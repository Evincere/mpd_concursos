#!/bin/bash

# ===============================================================================
# SCRIPT DE GESTIÓN - DASHBOARD MONITOR MPD v2.0 FINAL
# ===============================================================================
# Fecha: 2025-08-18
# Propósito: Centralizar operabilidad del microservicio dashboard-monitor
# Incluye: Gestión PM2 + detección mejorada + control completo
# ===============================================================================

# Configuración
DASHBOARD_DIR="/home/semper/dashboard-monitor"
SERVICE_NAME="dashboard-monitor"
PORT=9002
USER="semper"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar banner
show_banner() {
    echo -e "${BLUE}"
    echo "════════════════════════════════════════════════════════════════"
    echo "      GESTIÓN DASHBOARD MONITOR v2.0 - MPD CONCURSOS           "
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Función para logging con timestamp
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Verificar si PM2 está gestionando el servicio
check_pm2() {
    if command -v pm2 >/dev/null 2>&1; then
        local PM2_STATUS=$(pm2 list | grep "dashboard-monitor")
        if [ ! -z "$PM2_STATUS" ]; then
            return 0  # PM2 está gestionando
        fi
    fi
    return 1  # PM2 no está gestionando
}

# Obtener todos los PIDs relacionados con el dashboard
get_dashboard_pids() {
    # Buscar proceso principal que escucha en puerto 9002
    local MAIN_PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT" | awk '{print $7}' | cut -d/ -f1)
    
    # Buscar procesos next-server
    local NEXT_PIDS=$(pgrep -f "next-server.*v15" 2>/dev/null)
    
    # Buscar procesos worker de Next.js en el directorio del dashboard
    local WORKER_PIDS=$(pgrep -f "$DASHBOARD_DIR.*processChild" 2>/dev/null)
    
    # Combinar todos los PIDs únicos
    local ALL_PIDS="$MAIN_PID $NEXT_PIDS $WORKER_PIDS"
    echo "$ALL_PIDS" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' '
}

# Verificar estado del servicio
check_status() {
    # Primero verificar si PM2 está gestionando
    if check_pm2; then
        echo -e "${BLUE}=== ESTADO VIA PM2 ===${NC}"
        pm2 list | grep -E "(dashboard-monitor|id.*name.*mode)"
    fi
    
    # Verificar puerto
    local PORT_PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT" | awk '{print $7}' | cut -d/ -f1)
    
    if [ ! -z "$PORT_PID" ]; then
        echo -e "${GREEN}✅ Dashboard Monitor está EJECUTÁNDOSE${NC}"
        echo -e "   PID Principal: $PORT_PID"
        echo -e "   Puerto: $PORT"
        echo -e "   URL: http://localhost:$PORT"
        
        # Mostrar todos los procesos relacionados
        local ALL_PIDS=$(get_dashboard_pids)
        if [ ! -z "$ALL_PIDS" ]; then
            echo -e "   PIDs Relacionados: $ALL_PIDS"
        fi
        
        # Verificar health endpoint
        local HEALTH=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:$PORT/api/health" 2>/dev/null)
        if [ "$HEALTH" = "200" ]; then
            echo -e "   Health: ${GREEN}✅ HEALTHY${NC}"
        else
            echo -e "   Health: ${RED}❌ UNHEALTHY (Code: $HEALTH)${NC}"
        fi
        
        # Mostrar información del proceso principal
        echo -e "\n${BLUE}=== INFORMACIÓN DEL PROCESO PRINCIPAL ===${NC}"
        ps -p $PORT_PID -o pid,ppid,user,cmd,%mem,%cpu --no-headers 2>/dev/null || echo "No se pudo obtener info del proceso"
        
        return 0
    else
        echo -e "${RED}❌ Dashboard Monitor NO está ejecutándose${NC}"
        echo -e "   Puerto $PORT no está en uso"
        
        # Verificar si hay procesos zombie
        local ZOMBIE_PIDS=$(get_dashboard_pids)
        if [ ! -z "$ZOMBIE_PIDS" ]; then
            echo -e "${YELLOW}⚠️  Procesos relacionados detectados (posibles zombies): $ZOMBIE_PIDS${NC}"
        fi
        
        return 1
    fi
}

# Detener servicio (inteligente: PM2 o directo)
stop_service() {
    log "Deteniendo Dashboard Monitor..."
    
    # Si PM2 está gestionando, usar PM2
    if check_pm2; then
        log "Detectado PM2. Deteniendo via PM2..."
        pm2 stop dashboard-monitor
        
        # Verificar que se detuvo
        sleep 2
        if ! check_status >/dev/null 2>&1; then
            log "✅ Servicio detenido correctamente via PM2"
            return 0
        else
            log_warn "PM2 stop no funcionó. Intentando método directo..."
        fi
    fi
    
    # Método directo si PM2 no funciona o no está disponible
    local ALL_PIDS=$(get_dashboard_pids)
    
    if [ -z "$ALL_PIDS" ]; then
        log_warn "No se encontraron procesos del Dashboard Monitor ejecutándose"
        return 0
    fi
    
    log "PIDs encontrados para detener: $ALL_PIDS"
    
    # Intentar terminación graceful primero
    log "Enviando señal TERM a todos los procesos..."
    for PID in $ALL_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            log "  Enviando TERM a PID $PID"
            kill $PID 2>/dev/null
        fi
    done
    
    # Esperar terminación graceful
    local RETRY=0
    while [ $RETRY -lt 8 ]; do
        local REMAINING_PIDS=""
        for PID in $ALL_PIDS; do
            if kill -0 $PID 2>/dev/null; then
                REMAINING_PIDS="$REMAINING_PIDS $PID"
            fi
        done
        
        if [ -z "$REMAINING_PIDS" ]; then
            log "✅ Todos los procesos terminados correctamente"
            return 0
        fi
        
        log "Esperando terminación graceful... PIDs restantes:$REMAINING_PIDS (${RETRY}/8)"
        sleep 1
        ((RETRY++))
    done
    
    log_error "Algunos procesos no terminaron gracefully. Usa 'force-stop' para terminación forzada."
    return 1
}

# Iniciar servicio (inteligente: PM2 o directo)
start_service() {
    log "Iniciando Dashboard Monitor..."
    
    check_directory
    
    # Verificar si ya está ejecutándose
    if check_status >/dev/null 2>&1; then
        log_warn "El servicio ya está ejecutándose"
        check_status
        return 0
    fi
    
    # Si PM2 está disponible y configurado, usar PM2
    if check_pm2; then
        log "Detectado PM2. Iniciando via PM2..."
        pm2 start dashboard-monitor
        
        sleep 3
        if check_status >/dev/null 2>&1; then
            log "✅ Dashboard Monitor iniciado correctamente via PM2"
            check_status
            return 0
        else
            log_warn "PM2 start no funcionó. Intentando método directo..."
        fi
    fi
    
    # Método directo si PM2 no funciona
    # Limpiar procesos zombie si existen
    local ZOMBIE_PIDS=$(get_dashboard_pids)
    if [ ! -z "$ZOMBIE_PIDS" ]; then
        log_warn "Limpiando procesos zombie antes de iniciar..."
        for PID in $ZOMBIE_PIDS; do
            kill -9 $PID 2>/dev/null
        done
        sleep 1
    fi
    
    # Cambiar al directorio del dashboard
    cd "$DASHBOARD_DIR"
    
    # Verificaciones previas
    if [ ! -f "package.json" ]; then
        log_error "No se encontró package.json en $DASHBOARD_DIR"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        log_warn "node_modules no encontrado. Instalando dependencias..."
        sudo -u $USER npm install
    fi
    
    if [ ! -d ".next" ]; then
        log_warn "Build no encontrado. Construyendo aplicación..."
        sudo -u $USER npm run build
    fi
    
    log "Iniciando servicio como usuario $USER..."
    
    # Crear directorio de logs si no existe
    sudo -u $USER mkdir -p "$DASHBOARD_DIR/logs"
    
    # Iniciar el servicio en background
    sudo -u $USER bash -c "cd $DASHBOARD_DIR && nohup npm start > logs/startup-$(date +%Y%m%d_%H%M%S).log 2>&1 & echo \$! > logs/dashboard.pid"
    
    # Esperar y verificar
    sleep 3
    
    local RETRY=0
    while [ $RETRY -lt 10 ]; do
        if check_status >/dev/null 2>&1; then
            log "✅ Dashboard Monitor iniciado correctamente"
            check_status
            return 0
        fi
        log "Esperando que el servicio inicie... (${RETRY}/10)"
        sleep 2
        ((RETRY++))
    done
    
    log_error "El servicio no pudo iniciarse correctamente"
    return 1
}

# Función para detener TODOS los procesos de forma agresiva
force_stop() {
    log "🔥 PARADA FORZADA - Deteniendo TODOS los procesos relacionados..."
    
    # Detener via PM2 primero si está disponible
    if check_pm2; then
        log "Deteniendo via PM2 primero..."
        pm2 stop dashboard-monitor >/dev/null 2>&1
        pm2 delete dashboard-monitor >/dev/null 2>&1
    fi
    
    # Detener por puerto
    local PORT_PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT" | awk '{print $7}' | cut -d/ -f1)
    if [ ! -z "$PORT_PID" ]; then
        log "Deteniendo proceso del puerto $PORT (PID: $PORT_PID)"
        kill -9 $PORT_PID 2>/dev/null
    fi
    
    # Detener TODOS los procesos next-server
    local NEXT_PIDS=$(pgrep -f "next-server" 2>/dev/null)
    for PID in $NEXT_PIDS; do
        log "Deteniendo next-server PID: $PID"
        kill -9 $PID 2>/dev/null
    done
    
    # Detener workers del dashboard específicamente
    local WORKER_PIDS=$(pgrep -f "$DASHBOARD_DIR" 2>/dev/null)
    for PID in $WORKER_PIDS; do
        log "Deteniendo worker PID: $PID"
        kill -9 $PID 2>/dev/null
    done
    
    sleep 2
    
    # Verificación final
    local REMAINING_PORT=$(netstat -tlnp 2>/dev/null | grep ":$PORT")
    if [ -z "$REMAINING_PORT" ]; then
        log "✅ Puerto $PORT liberado correctamente"
    else
        log_error "Puerto $PORT aún está en uso: $REMAINING_PORT"
    fi
    
    # Limpiar archivos de PID
    rm -f "$DASHBOARD_DIR/logs/dashboard.pid" 2>/dev/null
}

# Reiniciar servicio
restart_service() {
    log "Reiniciando Dashboard Monitor..."
    
    if check_pm2; then
        log "Reiniciando via PM2..."
        pm2 restart dashboard-monitor
        sleep 3
        check_status
    else
        stop_service
        sleep 3
        start_service
    fi
}

# Gestión específica de PM2
pm2_management() {
    local ACTION="$1"
    
    if ! command -v pm2 >/dev/null 2>&1; then
        log_error "PM2 no está instalado en el sistema"
        return 1
    fi
    
    case "$ACTION" in
        "status")
            log "Estado de PM2 para dashboard-monitor:"
            pm2 list | grep -E "(dashboard-monitor|id.*name.*mode)" | head -5
            ;;
        "stop")
            log "Deteniendo dashboard-monitor via PM2..."
            pm2 stop dashboard-monitor
            ;;
        "start")
            log "Iniciando dashboard-monitor via PM2..."
            pm2 start dashboard-monitor
            ;;
        "restart")
            log "Reiniciando dashboard-monitor via PM2..."
            pm2 restart dashboard-monitor
            ;;
        "logs")
            log "Mostrando logs de PM2..."
            pm2 logs dashboard-monitor --lines 20
            ;;
        "delete")
            log "Eliminando dashboard-monitor de PM2..."
            pm2 delete dashboard-monitor
            ;;
        *)
            echo -e "${BLUE}COMANDOS PM2 DISPONIBLES:${NC}"
            echo "  $0 pm2 status    # Estado PM2"
            echo "  $0 pm2 stop      # Detener via PM2"
            echo "  $0 pm2 start     # Iniciar via PM2"  
            echo "  $0 pm2 restart   # Reiniciar via PM2"
            echo "  $0 pm2 logs      # Logs de PM2"
            echo "  $0 pm2 delete    # Eliminar de PM2"
            ;;
    esac
}

# Mostrar logs en tiempo real
show_logs() {
    log "Mostrando logs del Dashboard Monitor..."
    
    # Primero verificar logs de PM2
    if check_pm2; then
        echo -e "${BLUE}=== LOGS DE PM2 (últimas 20 líneas) ===${NC}"
        pm2 logs dashboard-monitor --lines 20 --nostream
        echo -e "${BLUE}=== LOGS DE PM2 EN TIEMPO REAL (Ctrl+C para salir) ===${NC}"
        pm2 logs dashboard-monitor
        return
    fi
    
    # Logs tradicionales si no hay PM2
    if [ -f "$DASHBOARD_DIR/logs/combined.log" ]; then
        echo -e "${BLUE}=== LOGS RECIENTES ===${NC}"
        tail -20 "$DASHBOARD_DIR/logs/combined.log"
        echo -e "${BLUE}=== LOGS EN TIEMPO REAL (Ctrl+C para salir) ===${NC}"
        tail -f "$DASHBOARD_DIR/logs/combined.log"
    else
        # Buscar otros archivos de log
        local LATEST_LOG=$(find "$DASHBOARD_DIR/logs" -name "*.log" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2)
        if [ ! -z "$LATEST_LOG" ]; then
            log "Usando archivo de log más reciente: $LATEST_LOG"
            tail -f "$LATEST_LOG"
        else
            log_error "No se encontraron archivos de logs"
        fi
    fi
}

# Verificar salud del sistema
health_check() {
    log "Verificando salud del sistema..."
    
    echo -e "${BLUE}=== ESTADO DEL SERVICIO ===${NC}"
    check_status
    
    echo -e "\n${BLUE}=== GESTIÓN DE PROCESOS ===${NC}"
    if check_pm2; then
        echo -e "${GREEN}✅ PM2 está gestionando el servicio${NC}"
        pm2 list | grep dashboard-monitor
    else
        echo -e "${YELLOW}⚠️  PM2 no está gestionando el servicio (modo manual)${NC}"
    fi
    
    echo -e "\n${BLUE}=== TODOS LOS PROCESOS RELACIONADOS ===${NC}"
    ps aux | grep -E "(next|dashboard)" | grep -v grep | head -10
    
    echo -e "\n${BLUE}=== VERIFICACIÓN DE PUERTO ===${NC}"
    local PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep ":$PORT")
    if [ ! -z "$PORT_CHECK" ]; then
        echo -e "${GREEN}✅ Puerto $PORT está en uso${NC}"
        echo "$PORT_CHECK"
    else
        echo -e "${RED}❌ Puerto $PORT no está en uso${NC}"
    fi
    
    echo -e "\n${BLUE}=== VERIFICACIÓN DE HEALTH ENDPOINT ===${NC}"
    local HEALTH_RESPONSE=$(curl -s "http://localhost:$PORT/api/health" 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$HEALTH_RESPONSE" ]; then
        echo -e "${GREEN}✅ Health endpoint responde correctamente${NC}"
        echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Health endpoint no responde${NC}"
    fi
    
    echo -e "\n${BLUE}=== VERIFICACIÓN DE BASE DE DATOS ===${NC}"
    local DB_CHECK=$(docker exec mpd-concursos-mysql mysql -u root -proot1234 -e "SELECT 1" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Conexión a base de datos OK${NC}"
    else
        echo -e "${RED}❌ No se puede conectar a la base de datos${NC}"
    fi
}

# Verificar configuración
check_config() {
    log "Verificando configuración..."
    
    echo -e "${BLUE}=== ARCHIVO .env ===${NC}"
    if [ -f "$DASHBOARD_DIR/.env" ]; then
        echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
        echo "Variables clave:"
        grep -E "^(PORT|DB_|BACKEND_API_URL)" "$DASHBOARD_DIR/.env" | head -5
    else
        echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    fi
    
    echo -e "\n${BLUE}=== CONFIGURACIÓN PM2 ===${NC}"
    if [ -f "$DASHBOARD_DIR/ecosystem.config.js" ]; then
        echo -e "${GREEN}✅ Configuración PM2 encontrada${NC}"
        cat "$DASHBOARD_DIR/ecosystem.config.js"
    else
        echo -e "${YELLOW}⚠️  No se encontró ecosystem.config.js${NC}"
    fi
    
    echo -e "\n${BLUE}=== CONFIGURACIÓN NGINX ===${NC}"
    if grep -q "dashboard-monitor\|monitor" /etc/nginx/sites-enabled/mpd-concursos 2>/dev/null; then
        echo -e "${GREEN}✅ Configuración Nginx encontrada${NC}"
        echo "Configuración:"
        grep -A 5 -B 1 "dashboard-monitor\|monitor" /etc/nginx/sites-enabled/mpd-concursos | head -10
    else
        echo -e "${RED}❌ Configuración Nginx no encontrada para dashboard-monitor${NC}"
    fi
}

# Compilar/build el proyecto
build_service() {
    log "Construyendo Dashboard Monitor..."
    
    check_directory
    cd "$DASHBOARD_DIR"
    
    log "Instalando dependencias..."
    sudo -u $USER npm install
    
    log "Construyendo aplicación Next.js..."
    sudo -u $USER npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Build completado correctamente"
    else
        log_error "Error en el build"
        return 1
    fi
}

# Mostrar ayuda
show_help() {
    show_banner
    echo -e "${BLUE}USO:${NC} $0 [COMANDO]"
    echo ""
    echo -e "${BLUE}COMANDOS PRINCIPALES:${NC}"
    echo "  start         Iniciar el microservicio (automático: PM2 o directo)"
    echo "  stop          Detener el microservicio (método graceful)"
    echo "  force-stop    Detener TODOS los procesos relacionados (método agresivo)"
    echo "  restart       Reiniciar el microservicio"
    echo "  status        Mostrar estado actual del servicio"
    echo ""
    echo -e "${BLUE}COMANDOS DE MONITOREO:${NC}"
    echo "  health        Verificación completa de salud del sistema"
    echo "  logs          Mostrar logs en tiempo real"
    echo "  config        Verificar configuración actual"
    echo ""
    echo -e "${BLUE}COMANDOS DE MANTENIMIENTO:${NC}"
    echo "  build         Construir/compilar la aplicación"
    echo "  help          Mostrar esta ayuda"
    echo ""
    echo -e "${BLUE}COMANDOS PM2:${NC}"
    echo "  pm2 status    Estado PM2 del servicio"
    echo "  pm2 stop      Detener via PM2"
    echo "  pm2 start     Iniciar via PM2"
    echo "  pm2 restart   Reiniciar via PM2"
    echo "  pm2 logs      Logs de PM2"
    echo "  pm2 delete    Eliminar de PM2"
    echo ""
    echo -e "${BLUE}EJEMPLOS:${NC}"
    echo "  $0 status        # Ver estado actual"
    echo "  $0 force-stop    # Detener completamente"
    echo "  $0 pm2 restart   # Reiniciar via PM2"
    echo "  $0 health        # Diagnóstico completo"
    echo ""
    echo -e "${YELLOW}NOTA:${NC} El microservicio se ejecuta en puerto $PORT"
    echo -e "${YELLOW}DIRECTORIO:${NC} $DASHBOARD_DIR"
    echo -e "${YELLOW}VERSION:${NC} v2.0 - Soporte PM2 + detección mejorada"
}

# Función principal
main() {
    # Manejar comandos PM2
    if [ "$1" = "pm2" ]; then
        show_banner
        pm2_management "$2"
        exit $?
    fi
    
    case "${1:-help}" in
        "start")
            show_banner
            start_service
            ;;
        "stop")
            show_banner
            stop_service
            ;;
        "force-stop")
            show_banner
            force_stop
            ;;
        "restart")
            show_banner
            restart_service
            ;;
        "status")
            show_banner
            check_status
            ;;
        "health")
            show_banner
            health_check
            ;;
        "logs")
            show_banner
            show_logs
            ;;
        "build")
            show_banner
            build_service
            ;;
        "config")
            show_banner
            check_config
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
    echo "Uso: sudo $0 [comando]"
    exit 1
fi

# Ejecutar función principal con todos los argumentos
main "$@"
