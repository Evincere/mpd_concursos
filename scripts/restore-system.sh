#!/bin/bash

# =============================================================================
# SISTEMA DE RESTAURACIÓN COMPLETO - MPD CONCURSOS
# =============================================================================
# Script para restaurar backups de base de datos y archivos
# Incluye validaciones de seguridad y confirmaciones
#
# Autor: MPD Development Team
# Versión: 1.0
# Fecha: 2025-07-29
# =============================================================================

set -euo pipefail  # Salir en caso de error

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

# Directorios
BACKUP_BASE_DIR="${BACKUP_DIR:-/app/backups}"
STORAGE_DIR="${STORAGE_BASE_DIR:-/app/storage}"
LOG_DIR="${LOG_DIR:-/app/logs}"

# Base de datos
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${MYSQL_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-root1234}"
DB_NAME="${MYSQL_DATABASE:-mpd_concursos}"

# Archivos de log
RESTORE_LOG="$LOG_DIR/restore.log"
ERROR_LOG="$LOG_DIR/restore-error.log"

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

log_info() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $message" | tee -a "$RESTORE_LOG"
}

log_error() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $message" | tee -a "$RESTORE_LOG" "$ERROR_LOG"
}

log_success() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $message" | tee -a "$RESTORE_LOG"
}

log_warning() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $message" | tee -a "$RESTORE_LOG"
}

show_usage() {
    cat << EOF
Uso: $0 [OPCIONES] <BACKUP_DATE>

DESCRIPCIÓN:
    Restaura backups de base de datos y archivos del sistema MPD Concursos

PARÁMETROS:
    BACKUP_DATE     Fecha del backup en formato YYYYMMDD_HHMMSS
                    Ejemplo: 20250729_020000

OPCIONES:
    -d, --database-only     Restaurar solo la base de datos
    -f, --files-only        Restaurar solo los archivos
    -y, --yes              Confirmar automáticamente (no interactivo)
    -l, --list             Listar backups disponibles
    -h, --help             Mostrar esta ayuda

EJEMPLOS:
    $0 20250729_020000                    # Restaurar todo
    $0 -d 20250729_020000                 # Solo base de datos
    $0 -f 20250729_020000                 # Solo archivos
    $0 -l                                 # Listar backups disponibles

EOF
}

list_available_backups() {
    log_info "Listando backups disponibles..."
    
    echo ""
    echo "=== BACKUPS DE BASE DE DATOS ==="
    find "$BACKUP_BASE_DIR" -name "db_backup_*.sql*" -type f 2>/dev/null | sort -r | while read -r file; do
        local size=$(du -h "$file" 2>/dev/null | cut -f1)
        local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "$(basename "$file") - $size - $date"
    done
    
    echo ""
    echo "=== BACKUPS DE ARCHIVOS ==="
    find "$BACKUP_BASE_DIR" -name "files_backup_*.tar*" -type f 2>/dev/null | sort -r | while read -r file; do
        local size=$(du -h "$file" 2>/dev/null | cut -f1)
        local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "$(basename "$file") - $size - $date"
    done
    
    echo ""
}

confirm_action() {
    local message="$1"
    local auto_confirm="${2:-false}"
    
    if [[ "$auto_confirm" == "true" ]]; then
        log_info "Confirmación automática habilitada"
        return 0
    fi
    
    echo ""
    echo "⚠️  ADVERTENCIA: $message"
    echo ""
    read -p "¿Está seguro de que desea continuar? (escriba 'SI' para confirmar): " confirmation
    
    if [[ "$confirmation" != "SI" ]]; then
        log_info "Operación cancelada por el usuario"
        exit 0
    fi
}

check_backup_files() {
    local backup_date="$1"
    local check_db="${2:-true}"
    local check_files="${3:-true}"
    
    local db_file=""
    local files_file=""
    local missing_files=()
    
    if [[ "$check_db" == "true" ]]; then
        # Buscar archivo de base de datos (con o sin compresión)
        if [[ -f "$BACKUP_BASE_DIR/db_backup_${backup_date}.sql.gz" ]]; then
            db_file="$BACKUP_BASE_DIR/db_backup_${backup_date}.sql.gz"
        elif [[ -f "$BACKUP_BASE_DIR/db_backup_${backup_date}.sql" ]]; then
            db_file="$BACKUP_BASE_DIR/db_backup_${backup_date}.sql"
        else
            missing_files+=("db_backup_${backup_date}.sql[.gz]")
        fi
    fi
    
    if [[ "$check_files" == "true" ]]; then
        # Buscar archivo de archivos (con o sin compresión)
        if [[ -f "$BACKUP_BASE_DIR/files_backup_${backup_date}.tar.gz" ]]; then
            files_file="$BACKUP_BASE_DIR/files_backup_${backup_date}.tar.gz"
        elif [[ -f "$BACKUP_BASE_DIR/files_backup_${backup_date}.tar" ]]; then
            files_file="$BACKUP_BASE_DIR/files_backup_${backup_date}.tar"
        else
            missing_files+=("files_backup_${backup_date}.tar[.gz]")
        fi
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Archivos de backup no encontrados: ${missing_files[*]}"
        echo ""
        echo "Archivos buscados en: $BACKUP_BASE_DIR"
        list_available_backups
        exit 1
    fi
    
    echo "$db_file|$files_file"
}

create_pre_restore_backup() {
    log_info "Creando backup de seguridad antes de la restauración..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_restore_dir="$BACKUP_BASE_DIR/pre-restore-$timestamp"
    
    mkdir -p "$pre_restore_dir"
    
    # Backup de base de datos actual
    if mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --databases "$DB_NAME" > "$pre_restore_dir/current_db.sql" 2>/dev/null; then
        log_success "Backup de base de datos actual creado"
    else
        log_warning "No se pudo crear backup de base de datos actual"
    fi
    
    # Backup de archivos actuales
    if [[ -d "$STORAGE_DIR" ]]; then
        if tar -cf "$pre_restore_dir/current_files.tar" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")" 2>/dev/null; then
            log_success "Backup de archivos actuales creado"
        else
            log_warning "No se pudo crear backup de archivos actuales"
        fi
    fi
    
    log_info "Backup de seguridad guardado en: $pre_restore_dir"
}

restore_database() {
    local db_backup_file="$1"
    
    log_info "Iniciando restauración de base de datos desde: $(basename "$db_backup_file")"
    
    # Determinar si el archivo está comprimido
    local temp_file=""
    local sql_file="$db_backup_file"
    
    if [[ "$db_backup_file" == *.gz ]]; then
        temp_file="/tmp/restore_db_$$.sql"
        if gunzip -c "$db_backup_file" > "$temp_file"; then
            sql_file="$temp_file"
            log_info "Archivo descomprimido temporalmente"
        else
            log_error "Error al descomprimir archivo de base de datos"
            return 1
        fi
    fi
    
    # Restaurar base de datos
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < "$sql_file" 2>/dev/null; then
        log_success "Base de datos restaurada exitosamente"
        
        # Limpiar archivo temporal
        if [[ -n "$temp_file" && -f "$temp_file" ]]; then
            rm "$temp_file"
        fi
        
        return 0
    else
        log_error "Error al restaurar base de datos"
        
        # Limpiar archivo temporal
        if [[ -n "$temp_file" && -f "$temp_file" ]]; then
            rm "$temp_file"
        fi
        
        return 1
    fi
}

restore_files() {
    local files_backup_file="$1"
    
    log_info "Iniciando restauración de archivos desde: $(basename "$files_backup_file")"
    
    # Crear backup del directorio actual si existe
    if [[ -d "$STORAGE_DIR" ]]; then
        local backup_current="$STORAGE_DIR.backup.$(date +%Y%m%d_%H%M%S)"
        if mv "$STORAGE_DIR" "$backup_current"; then
            log_info "Directorio actual respaldado en: $backup_current"
        else
            log_warning "No se pudo respaldar directorio actual"
        fi
    fi
    
    # Crear directorio padre si no existe
    mkdir -p "$(dirname "$STORAGE_DIR")"
    
    # Determinar comando de extracción según compresión
    local extract_cmd=""
    if [[ "$files_backup_file" == *.gz ]]; then
        extract_cmd="tar -xzf"
    else
        extract_cmd="tar -xf"
    fi
    
    # Restaurar archivos
    if $extract_cmd "$files_backup_file" -C "$(dirname "$STORAGE_DIR")" 2>/dev/null; then
        log_success "Archivos restaurados exitosamente"
        
        # Verificar que el directorio se restauró correctamente
        if [[ -d "$STORAGE_DIR" ]]; then
            local file_count=$(find "$STORAGE_DIR" -type f | wc -l)
            log_info "Directorio restaurado con $file_count archivos"
        else
            log_warning "El directorio de storage no se encontró después de la restauración"
        fi
        
        return 0
    else
        log_error "Error al restaurar archivos"
        return 1
    fi
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    local backup_date=""
    local database_only=false
    local files_only=false
    local auto_confirm=false
    local list_backups=false
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--database-only)
                database_only=true
                shift
                ;;
            -f|--files-only)
                files_only=true
                shift
                ;;
            -y|--yes)
                auto_confirm=true
                shift
                ;;
            -l|--list)
                list_backups=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Opción desconocida: $1"
                show_usage
                exit 1
                ;;
            *)
                backup_date="$1"
                shift
                ;;
        esac
    done
    
    # Crear directorio de logs si no existe
    mkdir -p "$LOG_DIR"
    
    log_info "=== INICIANDO SISTEMA DE RESTAURACIÓN ==="
    
    # Listar backups si se solicita
    if [[ "$list_backups" == "true" ]]; then
        list_available_backups
        exit 0
    fi
    
    # Validar fecha de backup
    if [[ -z "$backup_date" ]]; then
        log_error "Debe especificar una fecha de backup"
        show_usage
        exit 1
    fi
    
    # Validar formato de fecha
    if [[ ! "$backup_date" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
        log_error "Formato de fecha inválido. Use: YYYYMMDD_HHMMSS"
        exit 1
    fi
    
    # Determinar qué restaurar
    local restore_db=true
    local restore_files=true
    
    if [[ "$database_only" == "true" ]]; then
        restore_files=false
    elif [[ "$files_only" == "true" ]]; then
        restore_db=false
    fi
    
    # Verificar archivos de backup
    local backup_files
    backup_files=$(check_backup_files "$backup_date" "$restore_db" "$restore_files")
    IFS='|' read -r db_file files_file <<< "$backup_files"
    
    # Mostrar información de restauración
    echo ""
    echo "=== INFORMACIÓN DE RESTAURACIÓN ==="
    echo "Fecha de backup: $backup_date"
    echo "Restaurar base de datos: $restore_db"
    echo "Restaurar archivos: $restore_files"
    if [[ -n "$db_file" ]]; then
        echo "Archivo de BD: $(basename "$db_file")"
    fi
    if [[ -n "$files_file" ]]; then
        echo "Archivo de archivos: $(basename "$files_file")"
    fi
    echo ""
    
    # Confirmación de seguridad
    confirm_action "Esta operación sobrescribirá los datos actuales" "$auto_confirm"
    
    # Crear backup de seguridad
    create_pre_restore_backup
    
    # Variables para tracking
    local restore_success=true
    
    # Restaurar base de datos
    if [[ "$restore_db" == "true" && -n "$db_file" ]]; then
        if restore_database "$db_file"; then
            log_success "Restauración de base de datos exitosa"
        else
            log_error "Restauración de base de datos falló"
            restore_success=false
        fi
    fi
    
    # Restaurar archivos
    if [[ "$restore_files" == "true" && -n "$files_file" ]]; then
        if restore_files "$files_file"; then
            log_success "Restauración de archivos exitosa"
        else
            log_error "Restauración de archivos falló"
            restore_success=false
        fi
    fi
    
    # Resultado final
    if [[ "$restore_success" == "true" ]]; then
        log_success "=== RESTAURACIÓN COMPLETADA EXITOSAMENTE ==="
        exit 0
    else
        log_error "=== RESTAURACIÓN COMPLETADA CON ERRORES ==="
        exit 1
    fi
}

# =============================================================================
# EJECUCIÓN
# =============================================================================

# Verificar si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
