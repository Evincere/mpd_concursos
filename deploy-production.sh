#!/bin/bash

# Script de deployment para producción con SSL - MPD Concursos
# Versión 2.0 - Preserva datos críticos y usa Docker Compose moderno
# IMPORTANTE: Preserva volúmenes críticos existentes

set -e  # Salir si cualquier comando falla

echo "=============================================="
echo "🚀 DEPLOYMENT PRODUCCIÓN SSL - MPD CONCURSOS"
echo "=============================================="
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
        "DOMAIN"
        "SSL_EMAIL"
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
        log_info "Usa .env.production.example como referencia"
        exit 1
    fi
    
    # Validar longitud del JWT secret
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        log_error "JWT_SECRET debe tener al menos 32 caracteres"
        exit 1
    fi
    
    log_success "Todas las variables de entorno requeridas están definidas"
}

# Función para cargar variables de entorno
load_env_file() {
    local env_file=".env.production"
    
    if [[ ! -f "$env_file" ]]; then
        log_error "Archivo $env_file no encontrado"
        log_info "Copia y configura .env.production.example como .env.production"
        exit 1
    fi
    
    log_info "Cargando variables de entorno desde $env_file..."

    # Cargar variables de entorno de forma segura
    set -a  # Exportar automáticamente todas las variables

    # Procesar el archivo línea por línea
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
    
    local deps=("docker")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep no está instalado"
            exit 1
        fi
    done
    
    # Verificar Docker Compose moderno
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose v2 no está disponible. Usa 'docker compose' en lugar de 'docker-compose'"
        exit 1
    fi
    
    log_success "Todas las dependencias están disponibles"
}

# Función para verificar volúmenes críticos
verify_critical_volumes() {
    log_info "Verificando volúmenes críticos..."
    
    local critical_volumes=(
        "mpd_concursos_mysql_data_prod"
        "mpd_concursos_storage_data_prod"
    )
    
    for volume in "${critical_volumes[@]}"; do
        if docker volume inspect "$volume" &> /dev/null; then
            log_success "Volumen crítico encontrado: $volume"
        else
            log_warning "Volumen crítico no encontrado: $volume"
            log_info "Se creará automáticamente durante el deployment"
        fi
    done
}

# Función para hacer backup de la base de datos
backup_database() {
    log_info "Creando backup de la base de datos..."
    
    local backup_dir="./backups"
    local backup_file="$backup_dir/mpd_concursos_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    # Intentar hacer backup si el contenedor existe y está corriendo
    if docker ps --format "table {{.Names}}" | grep -q "mpd-concursos-mysql"; then
        log_info "Haciendo backup de la base de datos existente..."
        if docker exec mpd-concursos-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$backup_file" 2>/dev/null; then
            log_success "Backup creado: $backup_file"
        else
            log_warning "No se pudo hacer backup de la base de datos (posiblemente no existe o no está accesible)"
        fi
    else
        log_info "No hay base de datos existente para hacer backup"
    fi
}

# Función para configurar SSL inicial
setup_ssl_initial() {
    log_info "Configurando certificados SSL inicial..."
    
    # Crear estructura de directorios
    mkdir -p ssl-setup/certbot/{conf,www,logs}
    
    # Verificar si ya existen certificados
    if [[ -f "ssl-setup/certbot/conf/live/$DOMAIN/fullchain.pem" ]]; then
        log_success "Certificados SSL ya existen para $DOMAIN"
        return 0
    fi
    
    log_info "Solicitando certificados SSL para $DOMAIN..."
    log_warning "Asegúrate de que el dominio $DOMAIN apunte a este servidor"
    
    # Crear configuración temporal de Nginx para validación HTTP
    cat > ssl-setup/nginx-temp.conf << 'TEMP_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
TEMP_EOF
    
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" ssl-setup/nginx-temp.conf
}

# Función principal de deployment
deploy() {
    log_info "Iniciando deployment con SSL..."

    # Detener servicios existentes de forma segura
    log_info "Deteniendo servicios existentes de forma segura..."
    docker compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.ssl.yml down --remove-orphans 2>/dev/null || true

    # Limpiar imágenes no utilizadas (conserva volúmenes)
    log_info "Limpiando imágenes Docker no utilizadas..."
    docker image prune -f || true

    # Construir y levantar servicios
    log_info "Construyendo y levantando servicios con SSL..."
    docker compose -f docker-compose.production.yml up --build -d

    # Esperar a que los servicios estén listos
    log_info "Esperando a que los servicios estén listos..."
    sleep 45

    # Verificar estado de los servicios
    log_info "Verificando estado de los servicios..."
    docker compose -f docker-compose.production.yml ps

    # Verificar logs por errores críticos
    log_info "Verificando logs por errores..."
    if docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | head -5; then
        log_warning "Se encontraron algunos errores en los logs. Revisa los logs completos con:"
        echo "docker compose -f docker-compose.production.yml logs backend"
    fi

    # Verificar SSL
    log_info "Verificando configuración SSL..."
    if curl -fsSL https://$DOMAIN/health &>/dev/null; then
        log_success "SSL configurado correctamente"
    else
        log_warning "SSL podría necesitar tiempo adicional para propagarse"
    fi

    log_success "Deployment completado!"
    log_info "Servicios disponibles en:"
    echo "  - HTTPS (Producción): https://$DOMAIN"
    echo "  - HTTP (Redirige):    http://$DOMAIN"
    echo "  - API:                https://$DOMAIN/api"
    echo "  - WebSockets:         wss://$DOMAIN/ws"
    echo ""
    log_info "URLs de desarrollo/acceso directo:"
    echo "  - Frontend directo:   http://$SERVER_HOST:8000 (bypass proxy)"
    echo "  - Backend directo:    http://$SERVER_HOST:8080 (bypass proxy)"
    echo ""
    log_info "Datos críticos preservados en volúmenes:"
    echo "  - Base de datos:      mpd_concursos_mysql_data_prod"
    echo "  - Documentos usuarios: mpd_concursos_storage_data_prod"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  deploy    Ejecutar deployment completo con SSL (por defecto)"
    echo "  validate  Solo validar configuración"
    echo "  backup    Solo hacer backup de la base de datos"
    echo "  logs      Mostrar logs de los servicios"
    echo "  status    Mostrar estado de los servicios"
    echo "  ssl       Renovar certificados SSL"
    echo "  help      Mostrar esta ayuda"
    echo ""
    echo "Configuración SSL:"
    echo "  El deployment configura automáticamente HTTPS con Let's Encrypt"
    echo "  Asegúrate de que el dominio en DOMAIN apunte a este servidor"
    echo "  Variables requeridas: DOMAIN, SSL_EMAIL en .env.production"
    echo ""
}

# Función para mostrar logs
show_logs() {
    log_info "Mostrando logs de los servicios..."
    docker compose -f docker-compose.production.yml logs -f --tail=50
}

# Función para mostrar estado
show_status() {
    log_info "Estado de los servicios:"
    docker compose -f docker-compose.production.yml ps
    echo ""
    log_info "Volúmenes críticos:"
    docker volume ls | grep mpd_concursos
    echo ""
    log_info "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Función para renovar SSL
renew_ssl() {
    log_info "Renovando certificados SSL..."
    docker compose -f docker-compose.production.yml exec certbot certbot renew --quiet
    docker compose -f docker-compose.production.yml exec nginx-proxy nginx -s reload
    log_success "Certificados SSL renovados"
}

# Función principal
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            load_env_file
            validate_env_vars
            check_dependencies
            verify_critical_volumes
            backup_database
            setup_ssl_initial
            deploy
            ;;
        "validate")
            load_env_file
            validate_env_vars
            check_dependencies
            verify_critical_volumes
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
        "ssl")
            load_env_file
            renew_ssl
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
