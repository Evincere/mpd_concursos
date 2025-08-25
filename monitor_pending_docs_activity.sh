#!/bin/bash

# Monitor de Actividad de Usuarios con Documentos Pendientes
# Uso: ./monitor_pending_docs_activity.sh [opciones]

set -euo pipefail

# Variables de configuración
LOG_FILE="/var/log/mpd-concursos/pending_docs_activity.log"
DB_CONTAINER="mpd-concursos-mysql"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# Función para logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Función para ejecutar consulta SQL
execute_sql() {
    local query="$1"
    docker exec "${DB_CONTAINER}" mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "${query}" 2>/dev/null
}

# Función para verificar conectividad
check_db_connection() {
    log "INFO" "Verificando conexión a base de datos..."
    if ! docker exec "${DB_CONTAINER}" mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "SELECT 1;" &>/dev/null; then
        log "ERROR" "No se pudo conectar a la base de datos"
        exit 1
    fi
    log "INFO" "Conexión a base de datos OK"
}

# Función para obtener estado general
show_status() {
    log "INFO" "Obteniendo estado general..."
    
    echo "=== ESTADO GENERAL DEL CONCURSO ==="
    execute_sql "
    SELECT 
        i.status as Estado,
        COUNT(*) as Cantidad,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM inscriptions WHERE contest_id = 1), 2) as Porcentaje
    FROM inscriptions i 
    WHERE i.contest_id = 1
    GROUP BY i.status
    ORDER BY Cantidad DESC;
    "
}

# Función para mostrar usuarios pendientes
show_users() {
    log "INFO" "Obteniendo usuarios pendientes..."
    
    echo "=== USUARIOS CON DOCUMENTOS PENDIENTES ==="
    execute_sql "
    SELECT 
        u.email as Email,
        CONCAT(u.first_name,  , u.last_name) as Nombre,
        u.dni as DNI,
        i.current_step as Paso,
        (SELECT COUNT(*) FROM documents d 
         JOIN document_types dt ON d.document_type_id = dt.id 
         WHERE d.user_id = u.id AND dt.required = 1 AND d.is_archived = 0) as Docs_Cargados,
        (7 - (SELECT COUNT(*) FROM documents d 
              JOIN document_types dt ON d.document_type_id = dt.id 
              WHERE d.user_id = u.id AND dt.required = 1 AND d.is_archived = 0)) as Docs_Faltantes
    FROM user_entity u
    JOIN inscriptions i ON u.id = i.user_id
    WHERE i.contest_id = 1 
        AND i.status =  COMPLETED_PENDING_DOCS
    ORDER BY Docs_Faltantes ASC, Docs_Cargados DESC
    LIMIT 20;
    "
}

# Función para actividad del día
show_today() {
    log "INFO" "Obteniendo actividad de hoy..."
    
    echo "=== ACTIVIDAD DEL DÍA ACTUAL ==="
    execute_sql "
    SELECT 
        Documentos subidos hoy as Actividad,
        COUNT(*) as Cantidad,
        COUNT(DISTINCT user_id) as Usuarios_Unicos
    FROM documents 
    WHERE DATE(upload_date) = CURDATE();
    "
    
    echo ""
    echo "=== USUARIOS ACTIVOS HOY ==="
    execute_sql "
    SELECT 
        u.email as Email,
        CONCAT(u.first_name,  , u.last_name) as Nombre,
        i.status as Estado,
        COUNT(d.id) as Docs_Subidos_Hoy
    FROM user_entity u
    JOIN inscriptions i ON u.id = i.user_id
    JOIN documents d ON u.id = d.user_id
    WHERE i.contest_id = 1 
        AND DATE(d.upload_date) = CURDATE()
    GROUP BY u.id, u.first_name, u.last_name, u.email, i.status
    ORDER BY Docs_Subidos_Hoy DESC
    LIMIT 10;
    "
}

# Función principal
main() {
    mkdir -p "$(dirname "${LOG_FILE}")"
    check_db_connection
    
    case "${1:-}" in
        -h|--help)
            echo "Monitor de Actividad - Usuarios con Documentos Pendientes"
            echo ""
            echo "Uso: $0 [OPCIÓN]"
            echo ""
            echo "Opciones:"
            echo "  -h, --help      Mostrar esta ayuda"
            echo "  -s, --status    Estado general del concurso"
            echo "  -u, --users     Listar usuarios pendientes"
            echo "  -t, --today     Actividad del día"
            echo ""
            echo "Ejemplos:"
            echo "  $0 --status     # Ver estado general"
            echo "  $0 --users      # Ver usuarios pendientes"  
            echo "  $0 --today      # Ver actividad de hoy"
            echo "  $0              # Ver todo (status + users)"
            ;;
        -s|--status)
            show_status
            ;;
        -u|--users)
            show_users
            ;;
        -t|--today)
            show_today
            ;;
        *)
            show_status
            echo ""
            show_users
            ;;
    esac
    
    log "INFO" "Monitor finalizado exitosamente"
}

main "$@"
