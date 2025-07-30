#!/bin/bash

# =============================================================================
# SISTEMA DE BACKUP COMPLETO - MPD CONCURSOS
# =============================================================================
# Script para realizar backups automáticos de base de datos y archivos
# Incluye compresión, rotación automática y notificaciones
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

# Configuración de retención
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
COMPRESSION_ENABLED="${BACKUP_COMPRESSION:-true}"
NOTIFICATION_ENABLED="${BACKUP_NOTIFICATION:-true}"
NOTIFICATION_EMAIL="${BACKUP_NOTIFICATION_EMAIL:-sistemas@defensamendoza.gob.ar}"

# Archivos de log
BACKUP_LOG="$LOG_DIR/backup.log"
ERROR_LOG="$LOG_DIR/backup-error.log"

# Timestamp para nombres de archivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

log_info() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $message" | tee -a "$BACKUP_LOG"
}

log_error() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $message" | tee -a "$BACKUP_LOG" "$ERROR_LOG"
}

log_success() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $message" | tee -a "$BACKUP_LOG"
}

send_notification() {
    local subject="$1"
    local message="$2"
    local status="$3"  # success, error, warning
    
    if [[ "$NOTIFICATION_ENABLED" == "true" ]]; then
        # Aquí se puede implementar el envío de emails
        # Por ahora solo logueamos
        log_info "NOTIFICATION [$status]: $subject - $message"
        
        # Ejemplo de implementación con mail (si está disponible)
        # echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

check_dependencies() {
    local missing_deps=()
    
    # Verificar mysqldump
    if ! command -v mysqldump &> /dev/null; then
        missing_deps+=("mysqldump")
    fi
    
    # Verificar tar
    if ! command -v tar &> /dev/null; then
        missing_deps+=("tar")
    fi
    
    # Verificar gzip si la compresión está habilitada
    if [[ "$COMPRESSION_ENABLED" == "true" ]] && ! command -v gzip &> /dev/null; then
        missing_deps+=("gzip")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Dependencias faltantes: ${missing_deps[*]}"
        send_notification "Backup Failed - Missing Dependencies" "Faltan las siguientes dependencias: ${missing_deps[*]}" "error"
        exit 1
    fi
}

create_backup_directories() {
    local dirs=("$BACKUP_BASE_DIR" "$LOG_DIR")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "Directorio creado: $dir"
        fi
    done
}

# =============================================================================
# FUNCIONES DE BACKUP
# =============================================================================

backup_database() {
    log_info "Iniciando backup de base de datos..."
    
    local db_backup_file="$BACKUP_BASE_DIR/db_backup_$TIMESTAMP.sql"
    local compressed_file="$db_backup_file.gz"
    
    # Realizar dump de la base de datos
    if mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --databases "$DB_NAME" > "$db_backup_file" 2>/dev/null; then
        
        log_success "Dump de base de datos completado: $db_backup_file"
        
        # Comprimir si está habilitado
        if [[ "$COMPRESSION_ENABLED" == "true" ]]; then
            if gzip "$db_backup_file"; then
                log_success "Base de datos comprimida: $compressed_file"
                echo "$compressed_file"
            else
                log_error "Error al comprimir backup de base de datos"
                echo "$db_backup_file"
            fi
        else
            echo "$db_backup_file"
        fi
    else
        log_error "Error al realizar dump de base de datos"
        send_notification "Database Backup Failed" "Error al realizar backup de la base de datos $DB_NAME" "error"
        return 1
    fi
}

backup_files() {
    log_info "Iniciando backup de archivos..."
    
    if [[ ! -d "$STORAGE_DIR" ]]; then
        log_error "Directorio de storage no encontrado: $STORAGE_DIR"
        return 1
    fi
    
    local files_backup_file="$BACKUP_BASE_DIR/files_backup_$TIMESTAMP.tar"
    local compressed_file="$files_backup_file.gz"
    
    # Crear archivo tar
    if tar -cf "$files_backup_file" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")" 2>/dev/null; then
        log_success "Backup de archivos completado: $files_backup_file"
        
        # Comprimir si está habilitado
        if [[ "$COMPRESSION_ENABLED" == "true" ]]; then
            if gzip "$files_backup_file"; then
                log_success "Archivos comprimidos: $compressed_file"
                echo "$compressed_file"
            else
                log_error "Error al comprimir backup de archivos"
                echo "$files_backup_file"
            fi
        else
            echo "$files_backup_file"
        fi
    else
        log_error "Error al crear backup de archivos"
        send_notification "Files Backup Failed" "Error al realizar backup de archivos en $STORAGE_DIR" "error"
        return 1
    fi
}

cleanup_old_backups() {
    log_info "Iniciando limpieza de backups antiguos (retención: $RETENTION_DAYS días)..."
    
    local deleted_count=0
    
    # Limpiar backups de base de datos
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "Backup eliminado: $(basename "$file")"
    done < <(find "$BACKUP_BASE_DIR" -name "db_backup_*.sql*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # Limpiar backups de archivos
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "Backup eliminado: $(basename "$file")"
    done < <(find "$BACKUP_BASE_DIR" -name "files_backup_*.tar*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "Limpieza completada: $deleted_count archivos eliminados"
    else
        log_info "No hay backups antiguos para eliminar"
    fi
}

generate_backup_report() {
    local db_backup_file="$1"
    local files_backup_file="$2"
    local start_time="$3"
    local end_time="$4"
    
    local report_file="$BACKUP_BASE_DIR/backup_report_$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
=============================================================================
REPORTE DE BACKUP - MPD CONCURSOS
=============================================================================
Fecha: $(date '+%Y-%m-%d %H:%M:%S')
Servidor: $(hostname)
Usuario: $(whoami)

CONFIGURACIÓN:
- Directorio de backups: $BACKUP_BASE_DIR
- Directorio de storage: $STORAGE_DIR
- Base de datos: $DB_NAME@$DB_HOST
- Retención: $RETENTION_DAYS días
- Compresión: $COMPRESSION_ENABLED

RESULTADOS:
- Inicio: $start_time
- Fin: $end_time
- Duración: $((end_time - start_time)) segundos

ARCHIVOS GENERADOS:
- Base de datos: $(basename "$db_backup_file") ($(du -h "$db_backup_file" 2>/dev/null | cut -f1 || echo "N/A"))
- Archivos: $(basename "$files_backup_file") ($(du -h "$files_backup_file" 2>/dev/null | cut -f1 || echo "N/A"))

ESPACIO EN DISCO:
$(df -h "$BACKUP_BASE_DIR" 2>/dev/null || echo "No disponible")

=============================================================================
EOF

    log_info "Reporte generado: $report_file"
    echo "$report_file"
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log_info "=== INICIANDO BACKUP COMPLETO ==="
    log_info "Timestamp: $TIMESTAMP"
    
    # Verificaciones iniciales
    check_dependencies
    create_backup_directories
    
    # Variables para tracking
    local db_backup_file=""
    local files_backup_file=""
    local backup_success=true
    
    # Realizar backup de base de datos
    if db_backup_file=$(backup_database); then
        log_success "Backup de base de datos exitoso"
    else
        log_error "Backup de base de datos falló"
        backup_success=false
    fi
    
    # Realizar backup de archivos
    if files_backup_file=$(backup_files); then
        log_success "Backup de archivos exitoso"
    else
        log_error "Backup de archivos falló"
        backup_success=false
    fi
    
    # Limpiar backups antiguos
    cleanup_old_backups
    
    # Generar reporte
    local end_time=$(date +%s)
    local report_file=$(generate_backup_report "$db_backup_file" "$files_backup_file" "$start_time" "$end_time")
    
    # Enviar notificación final
    if [[ "$backup_success" == "true" ]]; then
        local message="Backup completado exitosamente en $(hostname) - $(date)"
        send_notification "Backup Successful" "$message" "success"
        log_success "=== BACKUP COMPLETADO EXITOSAMENTE ==="
        exit 0
    else
        local message="Backup completado con errores en $(hostname) - $(date)"
        send_notification "Backup Completed with Errors" "$message" "warning"
        log_error "=== BACKUP COMPLETADO CON ERRORES ==="
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
