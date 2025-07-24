#!/bin/bash

# Script de deployment para producción - MPD Concursos
# Fecha: 2025-07-24
# Descripción: Script mejorado para deployment en producción con validaciones

set -e  # Salir si cualquier comando falla

echo "=========================================="
echo "🚀 DEPLOYMENT PRODUCCIÓN - MPD CONCURSOS"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para validar variables de entorno
validate_env_vars() {
    log_info "Validando variables de entorno..."
    
    local required_vars=(
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_SECRET"
        "SERVER_HOST"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Variables de entorno faltantes:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "Por favor, configura estas variables en .env.production"
        exit 1
    fi
    
    log_success "Todas las variables de entorno requeridas están definidas"
}

# Función para cargar variables de entorno
load_env_file() {
    local env_file=".env.production"
    
    if [[ ! -f "$env_file" ]]; then
        log_error "Archivo $env_file no encontrado"
        log_info "Creando archivo de ejemplo..."
        cat > "$env_file" << 'EOF'
# Variables de entorno para producción - MPD Concursos
# IMPORTANTE: Configura estos valores antes del deployment

# Base de datos MySQL
MYSQL_ROOT_PASSWORD=tu_password_root_seguro
MYSQL_DATABASE=mpd_concursos
MYSQL_USER=mpd_user
MYSQL_PASSWORD=tu_password_usuario_seguro

# Configuración del servidor
SERVER_HOST=tu_servidor.com
SERVER_PORT_FRONTEND=8000
SERVER_PORT_BACKEND=8080
SERVER_PORT_MYSQL=3307

# Configuración de seguridad JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_minimo_256_bits
JWT_EXPIRATION=86400000

# Configuración CORS
CORS_ALLOWED_ORIGINS=https://tu_servidor.com,http://tu_servidor.com:8000

# Configuración de base de datos
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000

# Configuración de memoria Java
JAVA_OPTS="-Xmx1g -Xms512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
EOF
        log_warning "Archivo $env_file creado. Por favor, configúralo y ejecuta el script nuevamente."
        exit 1
    fi
    
    log_info "Cargando variables de entorno desde $env_file..."

    # Cargar variables de entorno de forma más segura
    set -a  # Exportar automáticamente todas las variables

    # Procesar el archivo línea por línea para manejar mejor las comillas
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Saltar líneas vacías y comentarios
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Evaluar la línea de forma segura
        if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            eval "export $line"
        fi
    done < "$env_file"

    set +a

    log_success "Variables de entorno cargadas correctamente"
}

# Función para verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."
    
    local deps=("docker" "docker-compose")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep no está instalado"
            exit 1
        fi
    done
    
    log_success "Todas las dependencias están disponibles"
}

# Función para hacer backup de la base de datos
backup_database() {
    log_info "Creando backup de la base de datos..."
    
    local backup_dir="./backups"
    local backup_file="$backup_dir/mpd_concursos_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    # Intentar hacer backup si el contenedor existe
    if docker ps -a --format "table {{.Names}}" | grep -q "mpd-concursos-mysql-prod"; then
        log_info "Haciendo backup de la base de datos existente..."
        docker exec mpd-concursos-mysql-prod mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$backup_file" 2>/dev/null || {
            log_warning "No se pudo hacer backup de la base de datos (posiblemente no existe)"
        }
    else
        log_info "No hay base de datos existente para hacer backup"
    fi
}

# Función principal de deployment
deploy() {
    log_info "Iniciando deployment..."
    
    # Detener servicios existentes
    log_info "Deteniendo servicios existentes..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    # Limpiar imágenes antiguas
    log_info "Limpiando imágenes Docker antiguas..."
    docker system prune -f || true
    
    # Construir y levantar servicios
    log_info "Construyendo y levantando servicios..."
    docker-compose -f docker-compose.prod.yml up --build -d
    
    # Esperar a que los servicios estén listos
    log_info "Esperando a que los servicios estén listos..."
    sleep 30
    
    # Verificar estado de los servicios
    log_info "Verificando estado de los servicios..."
    docker-compose -f docker-compose.prod.yml ps
    
    # Verificar logs por errores críticos
    log_info "Verificando logs por errores..."
    if docker-compose -f docker-compose.prod.yml logs backend | grep -i "error\|exception\|failed" | head -5; then
        log_warning "Se encontraron algunos errores en los logs. Revisa los logs completos con:"
        echo "docker-compose -f docker-compose.prod.yml logs backend"
    fi
    
    log_success "Deployment completado!"
    log_info "Servicios disponibles en:"
    echo "  - Frontend: http://$SERVER_HOST:${SERVER_PORT_FRONTEND:-8000}"
    echo "  - Backend:  http://$SERVER_HOST:${SERVER_PORT_BACKEND:-8080}"
    echo "  - API:      http://$SERVER_HOST:${SERVER_PORT_BACKEND:-8080}/api"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  deploy    Ejecutar deployment completo (por defecto)"
    echo "  validate  Solo validar configuración"
    echo "  backup    Solo hacer backup de la base de datos"
    echo "  logs      Mostrar logs de los servicios"
    echo "  status    Mostrar estado de los servicios"
    echo "  help      Mostrar esta ayuda"
    echo ""
}

# Función para mostrar logs
show_logs() {
    log_info "Mostrando logs de los servicios..."
    docker-compose -f docker-compose.prod.yml logs -f --tail=50
}

# Función para mostrar estado
show_status() {
    log_info "Estado de los servicios:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    log_info "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Función principal
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            load_env_file
            validate_env_vars
            check_dependencies
            backup_database
            deploy
            ;;
        "validate")
            load_env_file
            validate_env_vars
            check_dependencies
            log_success "Configuración válida"
            ;;
        "backup")
            load_env_file
            backup_database
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Opción desconocida: $action"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
