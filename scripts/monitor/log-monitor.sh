#!/bin/bash

# Monitor de Logs en Tiempo Real - MPD Concursos
# Autor: Sistema de Administración

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración de contenedores
BACKEND_CONTAINER="mpd-concursos-backend-prod"
FRONTEND_CONTAINER="mpd-concursos-frontend-prod"
DB_CONTAINER="mpd-concursos-mysql-prod"

# Función para mostrar el header
show_header() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    MPD CONCURSOS - LOG MONITOR               ║${NC}"
    echo -e "${BLUE}║                   Monitor de Logs en Tiempo Real             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Función para mostrar el menú
show_menu() {
    echo -e "${CYAN}┌─ OPCIONES DE MONITOREO ────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  1. ${GREEN}Logs Backend (Tiempo Real)${NC}"
    echo -e "${CYAN}│${NC}  2. ${GREEN}Logs Frontend (Tiempo Real)${NC}"
    echo -e "${CYAN}│${NC}  3. ${GREEN}Logs Base de Datos (Tiempo Real)${NC}"
    echo -e "${CYAN}│${NC}  4. ${GREEN}Logs de Todos los Servicios${NC}"
    echo -e "${CYAN}│${NC}  5. ${GREEN}Últimas 100 líneas - Backend${NC}"
    echo -e "${CYAN}│${NC}  6. ${GREEN}Últimas 100 líneas - Frontend${NC}"
    echo -e "${CYAN}│${NC}  7. ${GREEN}Últimas 100 líneas - Base de Datos${NC}"
    echo -e "${CYAN}│${NC}  8. ${GREEN}Buscar en Logs${NC}"
    echo -e "${CYAN}│${NC}  9. ${GREEN}Estado de Contenedores${NC}"
    echo -e "${CYAN}│${NC} 10. ${GREEN}Estadísticas de Recursos${NC}"
    echo -e "${CYAN}│${NC}  0. ${RED}Salir${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

# Función para verificar contenedores
check_containers() {
    local missing_containers=()
    
    if ! docker ps | grep -q $BACKEND_CONTAINER; then
        missing_containers+=("Backend")
    fi
    
    if ! docker ps | grep -q $FRONTEND_CONTAINER; then
        missing_containers+=("Frontend")
    fi
    
    if ! docker ps | grep -q $DB_CONTAINER; then
        missing_containers+=("Base de Datos")
    fi
    
    if [ ${#missing_containers[@]} -gt 0 ]; then
        echo -e "${RED}❌ Contenedores no encontrados: ${missing_containers[*]}${NC}"
        echo -e "${YELLOW}💡 Verifica que todos los servicios estén ejecutándose${NC}"
        return 1
    fi
    
    return 0
}

# 1. Logs Backend en tiempo real
monitor_backend_logs() {
    echo -e "${YELLOW}📋 MONITOREANDO LOGS DEL BACKEND${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"
    echo -e "${CYAN}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    docker logs -f $BACKEND_CONTAINER 2>&1 | while read line; do
        if [[ $line == *"ERROR"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"WARN"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"INFO"* ]]; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# 2. Logs Frontend en tiempo real
monitor_frontend_logs() {
    echo -e "${YELLOW}🌐 MONITOREANDO LOGS DEL FRONTEND${NC}"
    echo -e "${BLUE}════════════════════════════════════${NC}"
    echo -e "${CYAN}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    docker logs -f $FRONTEND_CONTAINER
}

# 3. Logs Base de Datos en tiempo real
monitor_db_logs() {
    echo -e "${YELLOW}🗄️ MONITOREANDO LOGS DE LA BASE DE DATOS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${CYAN}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    docker logs -f $DB_CONTAINER
}

# 4. Logs de todos los servicios
monitor_all_logs() {
    echo -e "${YELLOW}🔄 MONITOREANDO TODOS LOS SERVICIOS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    # Usar docker compose logs si está disponible, sino logs individuales
    if command -v docker compose &> /dev/null; then
        docker compose logs -f
    else
        # Monitorear en paralelo usando subshells
        (docker logs -f $BACKEND_CONTAINER 2>&1 | sed 's/^/[BACKEND] /') &
        (docker logs -f $FRONTEND_CONTAINER 2>&1 | sed 's/^/[FRONTEND] /') &
        (docker logs -f $DB_CONTAINER 2>&1 | sed 's/^/[DATABASE] /') &
        wait
    fi
}

# 5-7. Últimas líneas de logs
show_recent_logs() {
    local container=$1
    local service_name=$2
    
    echo -e "${YELLOW}📄 ÚLTIMAS 100 LÍNEAS - $service_name${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    docker logs --tail 100 $container 2>&1 | while read line; do
        if [[ $line == *"ERROR"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"WARN"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"INFO"* ]]; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done
    
    echo ""
}

# 8. Buscar en logs
search_logs() {
    echo -e "${YELLOW}🔍 BÚSQUEDA EN LOGS${NC}"
    echo -e "${BLUE}═══════════════════${NC}"
    
    echo "Seleccione el servicio:"
    echo "1. Backend"
    echo "2. Frontend"
    echo "3. Base de Datos"
    echo "4. Todos los servicios"
    
    read -p "Opción: " service_option
    read -p "Término de búsqueda: " search_term
    
    if [[ -z "$search_term" ]]; then
        echo -e "${RED}❌ Término de búsqueda no puede estar vacío${NC}"
        return
    fi
    
    case $service_option in
        1)
            echo -e "${GREEN}🔍 Buscando '$search_term' en logs del Backend:${NC}"
            docker logs $BACKEND_CONTAINER 2>&1 | grep -i "$search_term" | tail -20
            ;;
        2)
            echo -e "${GREEN}🔍 Buscando '$search_term' en logs del Frontend:${NC}"
            docker logs $FRONTEND_CONTAINER 2>&1 | grep -i "$search_term" | tail -20
            ;;
        3)
            echo -e "${GREEN}🔍 Buscando '$search_term' en logs de la Base de Datos:${NC}"
            docker logs $DB_CONTAINER 2>&1 | grep -i "$search_term" | tail -20
            ;;
        4)
            echo -e "${GREEN}🔍 Buscando '$search_term' en todos los servicios:${NC}"
            echo -e "${CYAN}--- BACKEND ---${NC}"
            docker logs $BACKEND_CONTAINER 2>&1 | grep -i "$search_term" | tail -10
            echo -e "${CYAN}--- FRONTEND ---${NC}"
            docker logs $FRONTEND_CONTAINER 2>&1 | grep -i "$search_term" | tail -10
            echo -e "${CYAN}--- DATABASE ---${NC}"
            docker logs $DB_CONTAINER 2>&1 | grep -i "$search_term" | tail -10
            ;;
        *)
            echo -e "${RED}❌ Opción inválida${NC}"
            ;;
    esac
    echo ""
}

# 9. Estado de contenedores
show_container_status() {
    echo -e "${YELLOW}📊 ESTADO DE CONTENEDORES${NC}"
    echo -e "${BLUE}═══════════════════════════${NC}"
    
    echo -e "${GREEN}🐳 Contenedores en ejecución:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep mpd-concursos
    
    echo ""
    echo -e "${GREEN}💾 Uso de espacio por imágenes:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(mpd_concursos|mysql)"
    
    echo ""
}

# 10. Estadísticas de recursos
show_resource_stats() {
    echo -e "${YELLOW}📈 ESTADÍSTICAS DE RECURSOS${NC}"
    echo -e "${BLUE}═══════════════════════════════${NC}"
    
    echo -e "${GREEN}🔄 Uso de CPU y Memoria por contenedor:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep mpd-concursos
    
    echo ""
    echo -e "${GREEN}💽 Uso de disco:${NC}"
    df -h | grep -E "(/$|/var/lib/docker)"
    
    echo ""
}

# Función principal
main() {
    # Verificar contenedores al inicio
    if ! check_containers; then
        exit 1
    fi
    
    while true; do
        show_header
        show_menu
        
        read -p "Seleccione una opción: " option
        
        case $option in
            1) monitor_backend_logs ;;
            2) monitor_frontend_logs ;;
            3) monitor_db_logs ;;
            4) monitor_all_logs ;;
            5) show_recent_logs $BACKEND_CONTAINER "BACKEND" ;;
            6) show_recent_logs $FRONTEND_CONTAINER "FRONTEND" ;;
            7) show_recent_logs $DB_CONTAINER "BASE DE DATOS" ;;
            8) search_logs ;;
            9) show_container_status ;;
            10) show_resource_stats ;;
            0) 
                echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
                exit 0
                ;;
            *) 
                echo -e "${RED}❌ Opción inválida. Presione Enter para continuar...${NC}"
                read
                ;;
        esac
        
        if [[ $option != "0" && $option != "1" && $option != "2" && $option != "3" && $option != "4" ]]; then
            echo -e "${CYAN}Presione Enter para continuar...${NC}"
            read
        fi
    done
}

# Ejecutar script
main "$@"
