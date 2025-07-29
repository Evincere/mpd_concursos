#!/bin/bash

# =============================================================================
# CONFIGURACIÓN DE CRON PARA BACKUPS AUTOMÁTICOS - MPD CONCURSOS
# =============================================================================
# Script para configurar backups automáticos usando cron
# Incluye configuración flexible de horarios y validaciones
#
# Autor: MPD Development Team
# Versión: 1.0
# Fecha: 2025-07-29
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-system.sh"
LOG_DIR="${LOG_DIR:-/app/logs}"
CRON_LOG="$LOG_DIR/cron-backup.log"

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
}

show_usage() {
    cat << EOF
Uso: $0 [OPCIONES]

DESCRIPCIÓN:
    Configura backups automáticos usando cron para el sistema MPD Concursos

OPCIONES:
    -f, --frequency FREQ    Frecuencia del backup (daily, weekly, monthly)
                           Default: daily
    -t, --time TIME        Hora del backup en formato HH:MM
                           Default: 02:00
    -d, --day DAY          Día para backups semanales (0-6, 0=domingo)
                           o día del mes para backups mensuales (1-31)
                           Default: 0 (domingo) para semanal, 1 para mensual
    -r, --remove           Remover configuración de cron existente
    -s, --status           Mostrar estado actual de cron
    -h, --help             Mostrar esta ayuda

EJEMPLOS:
    $0                                    # Backup diario a las 02:00
    $0 -f weekly -t 03:30 -d 0           # Backup semanal los domingos a las 03:30
    $0 -f monthly -t 01:00 -d 15         # Backup mensual el día 15 a las 01:00
    $0 -r                                # Remover configuración de cron
    $0 -s                                # Mostrar estado actual

FRECUENCIAS:
    daily     - Todos los días a la hora especificada
    weekly    - Una vez por semana en el día especificado
    monthly   - Una vez por mes en el día especificado

EOF
}

validate_time() {
    local time="$1"
    
    if [[ ! "$time" =~ ^([0-1][0-9]|2[0-3]):([0-5][0-9])$ ]]; then
        log_error "Formato de hora inválido: $time. Use HH:MM (00:00-23:59)"
        return 1
    fi
    
    return 0
}

validate_day() {
    local day="$1"
    local frequency="$2"
    
    if [[ "$frequency" == "weekly" ]]; then
        if [[ ! "$day" =~ ^[0-6]$ ]]; then
            log_error "Día inválido para backup semanal: $day. Use 0-6 (0=domingo)"
            return 1
        fi
    elif [[ "$frequency" == "monthly" ]]; then
        if [[ ! "$day" =~ ^([1-9]|[12][0-9]|3[01])$ ]]; then
            log_error "Día inválido para backup mensual: $day. Use 1-31"
            return 1
        fi
    fi
    
    return 0
}

check_dependencies() {
    # Verificar que el script de backup existe
    if [[ ! -f "$BACKUP_SCRIPT" ]]; then
        log_error "Script de backup no encontrado: $BACKUP_SCRIPT"
        return 1
    fi
    
    # Verificar que el script es ejecutable
    if [[ ! -x "$BACKUP_SCRIPT" ]]; then
        log_info "Haciendo ejecutable el script de backup..."
        chmod +x "$BACKUP_SCRIPT"
    fi
    
    # Verificar que cron está disponible
    if ! command -v crontab &> /dev/null; then
        log_error "crontab no está disponible en el sistema"
        return 1
    fi
    
    return 0
}

generate_cron_expression() {
    local frequency="$1"
    local time="$2"
    local day="$3"
    
    local hour minute
    IFS=':' read -r hour minute <<< "$time"
    
    case "$frequency" in
        "daily")
            echo "$minute $hour * * *"
            ;;
        "weekly")
            echo "$minute $hour * * $day"
            ;;
        "monthly")
            echo "$minute $hour $day * *"
            ;;
        *)
            log_error "Frecuencia no soportada: $frequency"
            return 1
            ;;
    esac
}

get_current_cron() {
    crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" || true
}

remove_backup_cron() {
    log_info "Removiendo configuración de cron para backups..."
    
    local current_cron
    current_cron=$(crontab -l 2>/dev/null || true)
    
    if [[ -z "$current_cron" ]]; then
        log_info "No hay configuración de cron existente"
        return 0
    fi
    
    # Filtrar líneas que no contengan el script de backup
    local new_cron
    new_cron=$(echo "$current_cron" | grep -v -F "$BACKUP_SCRIPT" || true)
    
    if [[ "$current_cron" == "$new_cron" ]]; then
        log_info "No se encontró configuración de backup en cron"
        return 0
    fi
    
    # Aplicar nueva configuración
    if [[ -z "$new_cron" ]]; then
        # Si no quedan entradas, remover crontab completamente
        crontab -r 2>/dev/null || true
        log_success "Configuración de cron removida completamente"
    else
        # Aplicar crontab filtrado
        echo "$new_cron" | crontab -
        log_success "Configuración de backup removida de cron"
    fi
}

install_backup_cron() {
    local frequency="$1"
    local time="$2"
    local day="$3"
    
    log_info "Instalando configuración de cron para backups..."
    log_info "Frecuencia: $frequency, Hora: $time, Día: $day"
    
    # Generar expresión cron
    local cron_expression
    cron_expression=$(generate_cron_expression "$frequency" "$time" "$day")
    
    # Crear entrada de cron con redirección de logs
    local cron_entry="$cron_expression $BACKUP_SCRIPT >> $CRON_LOG 2>&1"
    
    # Obtener crontab actual
    local current_cron
    current_cron=$(crontab -l 2>/dev/null || true)
    
    # Remover entradas existentes del script de backup
    local filtered_cron
    filtered_cron=$(echo "$current_cron" | grep -v -F "$BACKUP_SCRIPT" || true)
    
    # Agregar nueva entrada
    local new_cron
    if [[ -z "$filtered_cron" ]]; then
        new_cron="$cron_entry"
    else
        new_cron="$filtered_cron"$'\n'"$cron_entry"
    fi
    
    # Aplicar nueva configuración
    echo "$new_cron" | crontab -
    
    log_success "Configuración de cron instalada exitosamente"
    log_info "Expresión cron: $cron_expression"
    log_info "Comando: $BACKUP_SCRIPT"
    log_info "Logs: $CRON_LOG"
}

show_cron_status() {
    log_info "Estado actual de configuración de cron para backups:"
    echo ""
    
    local current_entry
    current_entry=$(get_current_cron)
    
    if [[ -z "$current_entry" ]]; then
        echo "❌ No hay configuración de backup automático"
        echo ""
        echo "Para configurar backups automáticos, ejecute:"
        echo "  $0 -f daily -t 02:00"
        echo ""
        return 0
    fi
    
    echo "✅ Configuración activa:"
    echo "  $current_entry"
    echo ""
    
    # Intentar parsear la configuración
    local cron_parts
    read -ra cron_parts <<< "$current_entry"
    
    local minute="${cron_parts[0]}"
    local hour="${cron_parts[1]}"
    local day_month="${cron_parts[2]}"
    local month="${cron_parts[3]}"
    local day_week="${cron_parts[4]}"
    
    echo "Detalles:"
    printf "  ⏰ Hora: %02d:%02d\n" "$hour" "$minute"
    
    if [[ "$day_month" == "*" && "$day_week" == "*" ]]; then
        echo "  📅 Frecuencia: Diaria"
    elif [[ "$day_month" == "*" && "$day_week" != "*" ]]; then
        local day_names=("Domingo" "Lunes" "Martes" "Miércoles" "Jueves" "Viernes" "Sábado")
        echo "  📅 Frecuencia: Semanal (${day_names[$day_week]})"
    elif [[ "$day_month" != "*" && "$day_week" == "*" ]]; then
        echo "  📅 Frecuencia: Mensual (día $day_month)"
    else
        echo "  📅 Frecuencia: Personalizada"
    fi
    
    echo "  📝 Logs: $CRON_LOG"
    echo ""
    
    # Mostrar próxima ejecución si es posible
    if command -v date &> /dev/null; then
        echo "Próxima ejecución estimada:"
        # Esta es una estimación simple, no considera todos los casos edge
        local next_hour_min=$(printf "%02d:%02d" "$hour" "$minute")
        echo "  🕐 Hoy a las $next_hour_min (si aún no ha pasado)"
        echo ""
    fi
    
    # Mostrar últimas líneas del log si existe
    if [[ -f "$CRON_LOG" ]]; then
        echo "Últimas líneas del log:"
        tail -5 "$CRON_LOG" 2>/dev/null | sed 's/^/  /' || echo "  (log vacío o no accesible)"
        echo ""
    fi
}

create_log_directory() {
    if [[ ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log_info "Directorio de logs creado: $LOG_DIR"
    fi
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    local frequency="daily"
    local time="02:00"
    local day=""
    local remove_cron=false
    local show_status=false
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--frequency)
                frequency="$2"
                shift 2
                ;;
            -t|--time)
                time="$2"
                shift 2
                ;;
            -d|--day)
                day="$2"
                shift 2
                ;;
            -r|--remove)
                remove_cron=true
                shift
                ;;
            -s|--status)
                show_status=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Opción desconocida: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Crear directorio de logs
    create_log_directory
    
    log_info "=== CONFIGURACIÓN DE BACKUPS AUTOMÁTICOS ==="
    
    # Mostrar estado si se solicita
    if [[ "$show_status" == "true" ]]; then
        show_cron_status
        exit 0
    fi
    
    # Remover configuración si se solicita
    if [[ "$remove_cron" == "true" ]]; then
        remove_backup_cron
        exit 0
    fi
    
    # Validar dependencias
    if ! check_dependencies; then
        exit 1
    fi
    
    # Validar parámetros
    if ! validate_time "$time"; then
        exit 1
    fi
    
    # Establecer día por defecto según frecuencia
    if [[ -z "$day" ]]; then
        case "$frequency" in
            "daily")
                day=""  # No se usa para daily
                ;;
            "weekly")
                day="0"  # Domingo
                ;;
            "monthly")
                day="1"  # Día 1 del mes
                ;;
            *)
                log_error "Frecuencia no soportada: $frequency"
                exit 1
                ;;
        esac
    fi
    
    # Validar día si es necesario
    if [[ "$frequency" != "daily" ]]; then
        if ! validate_day "$day" "$frequency"; then
            exit 1
        fi
    fi
    
    # Instalar configuración de cron
    install_backup_cron "$frequency" "$time" "$day"
    
    echo ""
    echo "✅ Configuración completada exitosamente"
    echo ""
    echo "Para verificar el estado: $0 -s"
    echo "Para remover la configuración: $0 -r"
    echo ""
    
    # Mostrar estado final
    show_cron_status
}

# =============================================================================
# EJECUCIÓN
# =============================================================================

# Verificar si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
