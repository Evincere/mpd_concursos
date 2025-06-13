#!/bin/bash

# Script para crear usuarios usando los endpoints de la API
# Requiere que el backend esté ejecutándose en http://localhost:8080

API_BASE="http://localhost:8080/api"
AUTH_ENDPOINT="$API_BASE/auth"
ROLES_ENDPOINT="$API_BASE/v1/roles"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si el backend está disponible
check_backend() {
    log_info "Verificando disponibilidad del backend..."

    # Probar con un simple GET que debería devolver algo
    local response=$(curl -s -w "%{http_code}" "$AUTH_ENDPOINT/login" -X GET 2>/dev/null)
    local http_code="${response: -3}"

    # Si obtenemos cualquier respuesta HTTP (incluso 405 Method Not Allowed), el backend está funcionando
    if [[ "$http_code" =~ ^[0-9]{3}$ ]] && [ "$http_code" != "000" ]; then
        log_success "Backend disponible en $API_BASE (HTTP $http_code)"
        return 0
    else
        log_error "Backend no disponible en $API_BASE"
        log_error "Asegúrate de que el backend esté ejecutándose en http://localhost:8080"
        log_warning "Continuando de todas formas..."
        return 0  # Continuar de todas formas
    fi
}

# Función para registrar un usuario
register_user() {
    local username="$1"
    local password="$2"
    local email="$3"
    local firstName="$4"
    local lastName="$5"
    local dni="$6"
    local cuit="$7"
    
    log_info "Registrando usuario: $username"
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_ENDPOINT/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"password\": \"$password\",
            \"confirmPassword\": \"$password\",
            \"email\": \"$email\",
            \"firstName\": \"$firstName\",
            \"lastName\": \"$lastName\",
            \"dni\": \"$dni\"
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "204" ] || [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "Usuario $username registrado exitosamente"
        return 0
    else
        log_error "Error registrando usuario $username (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "Respuesta: $body"
        fi
        return 1
    fi
}

# Función para hacer login y obtener token
login_user() {
    local username="$1"
    local password="$2"
    
    log_info "Haciendo login con usuario: $username"
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_ENDPOINT/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"password\": \"$password\"
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        # Extraer token del JSON response
        local token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            log_success "Login exitoso para $username"
            echo "$token"
            return 0
        else
            log_error "Token no encontrado en la respuesta"
            return 1
        fi
    else
        log_error "Error en login para $username (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "Respuesta: $body"
        fi
        return 1
    fi
}

# Función para asignar rol a usuario
assign_role() {
    local username="$1"
    local role="$2"
    local admin_token="$3"
    
    log_info "Asignando rol $role a usuario: $username"
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$ROLES_ENDPOINT/assign" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $admin_token" \
        -d "{
            \"username\": \"$username\",
            \"role\": \"$role\"
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Rol $role asignado a $username exitosamente"
        return 0
    else
        log_error "Error asignando rol $role a $username (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "Respuesta: $body"
        fi
        return 1
    fi
}

# Función principal
main() {
    echo "========================================="
    echo "  CREACIÓN DE USUARIOS VIA API"
    echo "  MPD Concursos System"
    echo "========================================="
    echo
    
    # Verificar backend
    if ! check_backend; then
        exit 1
    fi
    
    echo
    log_info "Iniciando creación de usuarios..."
    echo
    
    # 1. Registrar usuario administrador
    log_info "=== CREANDO USUARIO ADMINISTRADOR ==="
    if register_user "admin" "admin123" "admin@mpd.gov.ar" "Admin" "MPD" "12345678" "20123456789"; then

        # Login como admin para obtener token
        admin_token=$(login_user "admin" "admin123")
        if [ $? -eq 0 ] && [ -n "$admin_token" ]; then
            # Asignar rol ADMIN
            assign_role "admin" "ROLE_ADMIN" "$admin_token"
        else
            log_error "No se pudo obtener token de admin para asignar roles"
        fi
    fi

    echo

    # 2. Registrar usuario común
    log_info "=== CREANDO USUARIO COMÚN ==="
    register_user "user_test" "user123" "user_test@example.com" "Usuario" "Test" "87654321" "20876543210"
    
    echo
    echo "========================================="
    log_info "PROCESO COMPLETADO"
    echo "========================================="
    echo
    echo "CREDENCIALES CREADAS:"
    echo "---------------------"
    echo "👑 ADMINISTRADOR:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo "   Email: admin@mpd.gov.ar"
    echo
    echo "👤 USUARIO COMÚN:"
    echo "   Username: user_test"
    echo "   Password: user123"
    echo "   Email: user_test@example.com"
    echo
    echo "🌐 ACCESO:"
    echo "   Frontend: http://localhost:4200"
    echo "   Admin Panel: http://localhost:4200/admin"
    echo
}

# Ejecutar función principal
main "$@"
