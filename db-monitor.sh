#!/bin/bash

# Script de Monitoreo de Base de Datos - MPD Concursos
# Autor: Sistema de Administración
# Fecha: $(date +%Y-%m-%d)

# Configuración de colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración de la base de datos
DB_CONTAINER="mpd-concursos-mysql-prod"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# Función para ejecutar consultas SQL
execute_query() {
    local query="$1"
    docker exec -i $DB_CONTAINER mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "$query" 2>/dev/null
}

# Función para mostrar el header
show_header() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    MPD CONCURSOS - DB MONITOR                ║${NC}"
    echo -e "${BLUE}║                     Sistema de Consultas                     ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Función para mostrar el menú principal
show_menu() {
    echo -e "${CYAN}┌─ OPCIONES DISPONIBLES ─────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  1. ${GREEN}Estadísticas Generales del Sistema${NC}"
    echo -e "${CYAN}│${NC}  2. ${GREEN}Buscar Usuario por DNI${NC}"
    echo -e "${CYAN}│${NC}  3. ${GREEN}Estado de Inscripciones por Concurso${NC}"
    echo -e "${CYAN}│${NC}  4. ${GREEN}Documentos Pendientes de Validación${NC}"
    echo -e "${CYAN}│${NC}  5. ${GREEN}Usuarios Registrados por Período${NC}"
    echo -e "${CYAN}│${NC}  6. ${GREEN}Notificaciones No Leídas${NC}"
    echo -e "${CYAN}│${NC}  7. ${GREEN}Estado de Exámenes${NC}"
    echo -e "${CYAN}│${NC}  8. ${GREEN}Usuarios Inactivos/Bloqueados${NC}"
    echo -e "${CYAN}│${NC}  9. ${GREEN}Inscripciones por Estado${NC}"
    echo -e "${CYAN}│${NC} 10. ${GREEN}Búsqueda Avanzada de Usuario${NC}"
    echo -e "${CYAN}│${NC} 11. ${GREEN}Documentos por Usuario${NC}"
    echo -e "${CYAN}│${NC} 12. ${GREEN}Actividad Reciente${NC}"
    echo -e "${CYAN}│${NC}  0. ${RED}Salir${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

# 1. Estadísticas Generales
show_general_stats() {
    echo -e "${YELLOW}📊 ESTADÍSTICAS GENERALES DEL SISTEMA${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    local total_users=$(execute_query "SELECT COUNT(*) as total FROM user_entity;" | tail -n 1)
    local active_users=$(execute_query "SELECT COUNT(*) as total FROM user_entity WHERE status = 'ACTIVE';" | tail -n 1)
    local total_inscriptions=$(execute_query "SELECT COUNT(*) as total FROM inscriptions;" | tail -n 1)
    local active_inscriptions=$(execute_query "SELECT COUNT(*) as total FROM inscriptions WHERE status = 'ACTIVE';" | tail -n 1)
    local total_documents=$(execute_query "SELECT COUNT(*) as total FROM documents;" | tail -n 1)
    local pending_documents=$(execute_query "SELECT COUNT(*) as total FROM documents WHERE status = 'PENDING';" | tail -n 1)
    local total_contests=$(execute_query "SELECT COUNT(*) as total FROM contests;" | tail -n 1)
    
    echo -e "${GREEN}👥 Usuarios Totales:${NC} $total_users"
    echo -e "${GREEN}✅ Usuarios Activos:${NC} $active_users"
    echo -e "${GREEN}📝 Inscripciones Totales:${NC} $total_inscriptions"
    echo -e "${GREEN}🔄 Inscripciones Activas:${NC} $active_inscriptions"
    echo -e "${GREEN}📄 Documentos Totales:${NC} $total_documents"
    echo -e "${GREEN}⏳ Documentos Pendientes:${NC} $pending_documents"
    echo -e "${GREEN}🏆 Concursos Totales:${NC} $total_contests"
    echo ""
}

# 2. Buscar Usuario por DNI
search_user_by_dni() {
    echo -e "${YELLOW}🔍 BÚSQUEDA DE USUARIO POR DNI${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"
    
    read -p "Ingrese el DNI a buscar: " dni
    
    if [[ -z "$dni" ]]; then
        echo -e "${RED}❌ DNI no puede estar vacío${NC}"
        return
    fi
    
    local result=$(execute_query "
        SELECT 
            CONCAT(first_name, ' ', last_name) as 'Nombre Completo',
            dni as 'DNI',
            telefono as 'Teléfono',
            email as 'Email',
            status as 'Estado',
            DATE(created_at) as 'Fecha Registro'
        FROM user_entity 
        WHERE dni = '$dni';
    ")
    
    if [[ $(echo "$result" | wc -l) -le 1 ]]; then
        echo -e "${RED}❌ No se encontró usuario con DNI: $dni${NC}"
    else
        echo -e "${GREEN}✅ Usuario encontrado:${NC}"
        echo "$result" | column -t -s $'\t'
    fi
    echo ""
}

# 3. Estado de Inscripciones por Concurso
show_inscriptions_by_contest() {
    echo -e "${YELLOW}📋 ESTADO DE INSCRIPCIONES POR CONCURSO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    local result=$(execute_query "
        SELECT 
            c.title as 'Concurso',
            COUNT(i.id) as 'Total Inscripciones',
            SUM(CASE WHEN i.status = 'ACTIVE' THEN 1 ELSE 0 END) as 'Activas',
            SUM(CASE WHEN i.status = 'COMPLETED_WITH_DOCS' THEN 1 ELSE 0 END) as 'Completas',
            SUM(CASE WHEN i.status = 'PENDING' THEN 1 ELSE 0 END) as 'Pendientes'
        FROM contests c
        LEFT JOIN inscriptions i ON c.id = i.contest_id
        GROUP BY c.id, c.title
        ORDER BY COUNT(i.id) DESC;
    ")
    
    echo "$result" | column -t -s $'\t'
    echo ""
}

# 4. Documentos Pendientes de Validación
show_pending_documents() {
    echo -e "${YELLOW}📄 DOCUMENTOS PENDIENTES DE VALIDACIÓN${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    local result=$(execute_query "
        SELECT 
            CONCAT(u.first_name, ' ', u.last_name) as 'Usuario',
            u.dni as 'DNI',
            dt.name as 'Tipo Documento',
            d.file_name as 'Archivo',
            DATE(d.upload_date) as 'Fecha Subida',
            DATEDIFF(NOW(), d.upload_date) as 'Días Pendiente'
        FROM documents d
        JOIN user_entity u ON d.user_id = u.id
        JOIN document_types dt ON d.document_type_id = dt.id
        WHERE d.status = 'PENDING'
        ORDER BY d.upload_date ASC
        LIMIT 20;
    ")
    
    echo "$result" | column -t -s $'\t'
    echo ""
}

# 5. Usuarios Registrados por Período
show_users_by_period() {
    echo -e "${YELLOW}📅 USUARIOS REGISTRADOS POR PERÍODO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    echo "Seleccione el período:"
    echo "1. Últimos 7 días"
    echo "2. Último mes"
    echo "3. Últimos 3 meses"
    echo "4. Fecha específica"
    
    read -p "Opción: " period_option
    
    local date_filter=""
    case $period_option in
        1) date_filter="WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)" ;;
        2) date_filter="WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)" ;;
        3) date_filter="WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)" ;;
        4) 
            read -p "Ingrese fecha (YYYY-MM-DD): " specific_date
            date_filter="WHERE DATE(created_at) = '$specific_date'"
            ;;
        *) echo -e "${RED}❌ Opción inválida${NC}"; return ;;
    esac
    
    local result=$(execute_query "
        SELECT 
            DATE(created_at) as 'Fecha',
            COUNT(*) as 'Usuarios Registrados'
        FROM user_entity 
        $date_filter
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC;
    ")
    
    echo "$result" | column -t -s $'\t'
    echo ""
}

# 6. Notificaciones No Leídas
show_unread_notifications() {
    echo -e "${YELLOW}🔔 NOTIFICACIONES NO LEÍDAS${NC}"
    echo -e "${BLUE}═══════════════════════════════${NC}"

    local result=$(execute_query "
        SELECT
            CONCAT(u.first_name, ' ', u.last_name) as 'Usuario',
            u.dni as 'DNI',
            n.subject as 'Asunto',
            n.type as 'Tipo',
            DATE(n.sent_at) as 'Fecha Envío',
            DATEDIFF(NOW(), n.sent_at) as 'Días Sin Leer'
        FROM notifications n
        JOIN user_entity u ON n.recipient_id = u.id
        WHERE n.status = 'PENDING' OR n.read_at IS NULL
        ORDER BY n.sent_at DESC
        LIMIT 20;
    ")

    echo "$result" | column -t -s $'\t'
    echo ""
}

# 7. Estado de Exámenes
show_exam_status() {
    echo -e "${YELLOW}📝 ESTADO DE EXÁMENES${NC}"
    echo -e "${BLUE}═══════════════════════════${NC}"

    local result=$(execute_query "
        SELECT
            title as 'Título',
            type as 'Tipo',
            status as 'Estado',
            duration_minutes as 'Duración (min)',
            DATE(start_time) as 'Fecha Inicio',
            DATE(end_time) as 'Fecha Fin'
        FROM examinations
        ORDER BY start_time DESC;
    ")

    echo "$result" | column -t -s $'\t'
    echo ""
}

# 8. Usuarios Inactivos/Bloqueados
show_inactive_users() {
    echo -e "${YELLOW}🚫 USUARIOS INACTIVOS/BLOQUEADOS${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"

    local result=$(execute_query "
        SELECT
            CONCAT(first_name, ' ', last_name) as 'Nombre Completo',
            dni as 'DNI',
            email as 'Email',
            status as 'Estado',
            DATE(created_at) as 'Fecha Registro'
        FROM user_entity
        WHERE status IN ('INACTIVE', 'BLOCKED')
        ORDER BY created_at DESC;
    ")

    if [[ $(echo "$result" | wc -l) -le 1 ]]; then
        echo -e "${GREEN}✅ No hay usuarios inactivos o bloqueados${NC}"
    else
        echo "$result" | column -t -s $'\t'
    fi
    echo ""
}

# 9. Inscripciones por Estado
show_inscriptions_by_status() {
    echo -e "${YELLOW}📊 INSCRIPCIONES POR ESTADO${NC}"
    echo -e "${BLUE}═══════════════════════════════${NC}"

    local result=$(execute_query "
        SELECT
            status as 'Estado',
            COUNT(*) as 'Cantidad',
            ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM inscriptions)), 2) as 'Porcentaje %'
        FROM inscriptions
        GROUP BY status
        ORDER BY COUNT(*) DESC;
    ")

    echo "$result" | column -t -s $'\t'
    echo ""
}

# 10. Búsqueda Avanzada de Usuario
advanced_user_search() {
    echo -e "${YELLOW}🔍 BÚSQUEDA AVANZADA DE USUARIO${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"

    echo "Buscar por:"
    echo "1. Email"
    echo "2. Nombre/Apellido"
    echo "3. Teléfono"
    echo "4. CUIT"

    read -p "Opción: " search_option
    read -p "Término de búsqueda: " search_term

    if [[ -z "$search_term" ]]; then
        echo -e "${RED}❌ Término de búsqueda no puede estar vacío${NC}"
        return
    fi

    local where_clause=""
    case $search_option in
        1) where_clause="WHERE email LIKE '%$search_term%'" ;;
        2) where_clause="WHERE CONCAT(first_name, ' ', last_name) LIKE '%$search_term%'" ;;
        3) where_clause="WHERE telefono LIKE '%$search_term%'" ;;
        4) where_clause="WHERE cuit LIKE '%$search_term%'" ;;
        *) echo -e "${RED}❌ Opción inválida${NC}"; return ;;
    esac

    local result=$(execute_query "
        SELECT
            CONCAT(first_name, ' ', last_name) as 'Nombre Completo',
            dni as 'DNI',
            email as 'Email',
            telefono as 'Teléfono',
            cuit as 'CUIT',
            status as 'Estado'
        FROM user_entity
        $where_clause
        LIMIT 10;
    ")

    if [[ $(echo "$result" | wc -l) -le 1 ]]; then
        echo -e "${RED}❌ No se encontraron resultados${NC}"
    else
        echo "$result" | column -t -s $'\t'
    fi
    echo ""
}

# 11. Documentos por Usuario
show_user_documents() {
    echo -e "${YELLOW}📄 DOCUMENTOS POR USUARIO${NC}"
    echo -e "${BLUE}═══════════════════════════════${NC}"

    read -p "Ingrese DNI del usuario: " dni

    if [[ -z "$dni" ]]; then
        echo -e "${RED}❌ DNI no puede estar vacío${NC}"
        return
    fi

    local result=$(execute_query "
        SELECT
            dt.name as 'Tipo Documento',
            d.file_name as 'Archivo',
            d.status as 'Estado',
            DATE(d.upload_date) as 'Fecha Subida',
            d.comments as 'Comentarios'
        FROM documents d
        JOIN user_entity u ON d.user_id = u.id
        JOIN document_types dt ON d.document_type_id = dt.id
        WHERE u.dni = '$dni'
        ORDER BY d.upload_date DESC;
    ")

    if [[ $(echo "$result" | wc -l) -le 1 ]]; then
        echo -e "${RED}❌ No se encontraron documentos para el DNI: $dni${NC}"
    else
        echo -e "${GREEN}✅ Documentos encontrados:${NC}"
        echo "$result" | column -t -s $'\t'
    fi
    echo ""
}

# 12. Actividad Reciente
show_recent_activity() {
    echo -e "${YELLOW}⚡ ACTIVIDAD RECIENTE DEL SISTEMA${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"

    echo -e "${CYAN}📝 Últimas Inscripciones (5):${NC}"
    local inscriptions=$(execute_query "
        SELECT
            CONCAT(u.first_name, ' ', u.last_name) as 'Usuario',
            c.title as 'Concurso',
            i.status as 'Estado',
            DATE(i.created_at) as 'Fecha'
        FROM inscriptions i
        JOIN user_entity u ON i.user_id = u.id
        JOIN contests c ON i.contest_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 5;
    ")
    echo "$inscriptions" | column -t -s $'\t'
    echo ""

    echo -e "${CYAN}📄 Últimos Documentos Subidos (5):${NC}"
    local documents=$(execute_query "
        SELECT
            CONCAT(u.first_name, ' ', u.last_name) as 'Usuario',
            dt.name as 'Tipo',
            d.status as 'Estado',
            DATE(d.upload_date) as 'Fecha'
        FROM documents d
        JOIN user_entity u ON d.user_id = u.id
        JOIN document_types dt ON d.document_type_id = dt.id
        ORDER BY d.upload_date DESC
        LIMIT 5;
    ")
    echo "$documents" | column -t -s $'\t'
    echo ""

    echo -e "${CYAN}👥 Últimos Usuarios Registrados (5):${NC}"
    local users=$(execute_query "
        SELECT
            CONCAT(first_name, ' ', last_name) as 'Nombre',
            dni as 'DNI',
            email as 'Email',
            DATE(created_at) as 'Fecha'
        FROM user_entity
        ORDER BY created_at DESC
        LIMIT 5;
    ")
    echo "$users" | column -t -s $'\t'
    echo ""
}

# Función principal
main() {
    # Verificar que el contenedor existe
    if ! docker ps | grep -q $DB_CONTAINER; then
        echo -e "${RED}❌ Error: Contenedor $DB_CONTAINER no está ejecutándose${NC}"
        exit 1
    fi
    
    while true; do
        show_header
        show_menu
        
        read -p "Seleccione una opción: " option
        
        case $option in
            1) show_general_stats ;;
            2) search_user_by_dni ;;
            3) show_inscriptions_by_contest ;;
            4) show_pending_documents ;;
            5) show_users_by_period ;;
            6) show_unread_notifications ;;
            7) show_exam_status ;;
            8) show_inactive_users ;;
            9) show_inscriptions_by_status ;;
            10) advanced_user_search ;;
            11) show_user_documents ;;
            12) show_recent_activity ;;
            0) 
                echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
                exit 0
                ;;
            *) 
                echo -e "${RED}❌ Opción inválida. Presione Enter para continuar...${NC}"
                read
                ;;
        esac
        
        if [[ $option != "0" ]]; then
            echo -e "${CYAN}Presione Enter para continuar...${NC}"
            read
        fi
    done
}

# Ejecutar script
main "$@"
