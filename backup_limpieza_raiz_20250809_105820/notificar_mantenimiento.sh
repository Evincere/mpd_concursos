#!/bin/bash
# Script para notificar a usuarios activos sobre mantenimiento programado

set -e

echo "🔔 SCRIPT DE NOTIFICACIÓN PRE-DEPLOYMENT"
echo "======================================="

# Configuración
BACKEND_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="SemperPass_78"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Función para verificar si el backend está disponible
check_backend() {
    log_info "Verificando disponibilidad del backend..."
    
    if curl -s -f "$BACKEND_URL/actuator/health" > /dev/null 2>&1; then
        log_success "Backend disponible"
        return 0
    else
        log_error "Backend no disponible en $BACKEND_URL"
        return 1
    fi
}

# Función para obtener usuarios activos de los logs
get_active_users() {
    log_info "Identificando usuarios activos (últimos 10 minutos)..."
    
    ACTIVE_USERS=$(docker logs mpd-concursos-backend --since="10m" 2>/dev/null | \
        grep -E "DEBUG UserMapper.*entity\.getId|Login exitoso" | \
        grep -o "'[a-f0-9-]*'" | \
        sort | uniq | wc -l)
    
    log_info "Usuarios activos detectados: $ACTIVE_USERS"
    echo $ACTIVE_USERS
}

# Función para obtener token de admin
get_admin_token() {
    log_info "Obteniendo token de administrador..."
    
    # Obtener token del admin real
    TOKEN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" \
      | jq -r '.token' 2>/dev/null || echo "null")
    
    if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ] && [ -n "$TOKEN" ]; then
        log_success "Token de admin obtenido correctamente"
        echo "$TOKEN"
    else
        log_error "No se pudo obtener token de admin. Verificar credenciales."
        return 1
    fi
}

# Función para enviar notificación masiva
send_maintenance_notification() {
    local token=$1
    local minutes_warning=${2:-2}
    local estimated_duration=${3:-3}
    
    log_info "Enviando notificación de mantenimiento..."
    
    # Crear mensaje personalizado
    local subject="⚠️ Mantenimiento Programado del Sistema"
    local content="Estimado usuario,

En $minutes_warning minutos realizaremos un mantenimiento del sistema que durará aproximadamente $estimated_duration minutos.

Durante este período:
• El sistema no estará disponible temporalmente
• Por favor, guarde su trabajo actual
• Las sesiones activas se cerrarán automáticamente

Motivo: Actualización crítica para mejorar la funcionalidad de fechas y modal de bienvenida.

Horario estimado: $(date -d "+${minutes_warning} minutes" "+%H:%M") - $(date -d "+$((minutes_warning + estimated_duration)) minutes" "+%H:%M")

Disculpe las molestias ocasionadas.

Equipo Técnico MPD Concursos"

    # Escapar el contenido para JSON
    local escaped_content=$(echo "$content" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    
    # Preparar payload JSON
    local payload=$(cat <<EOF
{
  "recipientRoles": ["ROLE_USER"],
  "subject": "$subject",
  "content": "$escaped_content",
  "type": "SYSTEM",
  "acknowledgementLevel": "NONE",
  "metadata": {
    "maintenanceType": "critical_updates",
    "estimatedDuration": "${estimated_duration} minutes",
    "priority": "HIGH",
    "warningMinutes": $minutes_warning,
    "autoClose": false,
    "deploymentDate": "$(date -Iseconds)"
  }
}
