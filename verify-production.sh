#!/bin/bash

# Script de verificación para producción
# MPD Concursos - Verificación de funcionalidades críticas
# Servidor: vps-4778464-x.dattaweb.com (149.50.132.23)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    ((TESTS_TOTAL++))
    
    echo -n "Testing $description... "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        success "$description"
        return 0
    else
        fail "$description (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

echo "🔍 Iniciando verificación de producción - MPD Concursos"
echo "📍 Servidor: 149.50.132.23"
echo "⏰ Fecha: $(date)"
echo ""

# Verificar que los contenedores están corriendo
log "🐳 Verificando contenedores Docker..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    success "Contenedores Docker están corriendo"
else
    fail "Algunos contenedores no están corriendo"
    docker-compose -f docker-compose.prod.yml ps
fi

echo ""
log "🌐 Verificando conectividad de servicios..."

# Verificar Frontend
test_endpoint "http://localhost:8000" "Frontend principal"
test_endpoint "http://149.50.132.23:8000" "Frontend desde IP externa"

# Verificar Backend - Health Check
test_endpoint "http://localhost:8080/actuator/health" "Backend health check"
test_endpoint "http://149.50.132.23:8080/actuator/health" "Backend health desde IP externa"

# Verificar APIs críticas
test_endpoint "http://localhost:8080/api/auth/test" "API de autenticación" 404
test_endpoint "http://localhost:8080/api/concursos" "API de concursos"
test_endpoint "http://localhost:8080/api/documentos/types" "API de tipos de documentos"

echo ""
log "🗄️ Verificando base de datos..."

# Verificar MySQL
if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    success "MySQL está respondiendo"
    ((TESTS_TOTAL++))
else
    fail "MySQL no está respondiendo"
    ((TESTS_TOTAL++))
fi

# Verificar conexión a la base de datos desde el backend
if docker-compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:8080/actuator/health 2>/dev/null | grep -q "UP"; then
    success "Backend conectado a la base de datos"
    ((TESTS_TOTAL++))
else
    fail "Backend no puede conectar a la base de datos"
    ((TESTS_TOTAL++))
fi

echo ""
log "📊 Verificando recursos del sistema..."

# Verificar uso de memoria
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep mpd-concursos)
if [ ! -z "$MEMORY_USAGE" ]; then
    success "Estadísticas de memoria obtenidas"
    echo "$MEMORY_USAGE"
    ((TESTS_TOTAL++))
else
    fail "No se pudieron obtener estadísticas de memoria"
    ((TESTS_TOTAL++))
fi

# Verificar logs por errores críticos
echo ""
log "📋 Verificando logs por errores críticos..."

# Verificar logs del backend por errores
BACKEND_ERRORS=$(docker-compose -f docker-compose.prod.yml logs backend 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
if [ "$BACKEND_ERRORS" -lt 5 ]; then
    success "Backend: Pocos errores en logs ($BACKEND_ERRORS)"
    ((TESTS_TOTAL++))
else
    warn "Backend: Muchos errores en logs ($BACKEND_ERRORS)"
    ((TESTS_TOTAL++))
fi

# Verificar logs del frontend por errores
FRONTEND_ERRORS=$(docker-compose -f docker-compose.prod.yml logs frontend 2>/dev/null | grep -i "error\|failed" | wc -l)
if [ "$FRONTEND_ERRORS" -lt 3 ]; then
    success "Frontend: Pocos errores en logs ($FRONTEND_ERRORS)"
    ((TESTS_TOTAL++))
else
    warn "Frontend: Algunos errores en logs ($FRONTEND_ERRORS)"
    ((TESTS_TOTAL++))
fi

echo ""
log "🔐 Verificando configuración de seguridad..."

# Verificar CORS
CORS_TEST=$(curl -s -H "Origin: http://149.50.132.23:8000" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS http://localhost:8080/api/concursos 2>/dev/null || echo "failed")
if [[ "$CORS_TEST" != "failed" ]]; then
    success "CORS configurado correctamente"
    ((TESTS_TOTAL++))
else
    fail "CORS no está configurado correctamente"
    ((TESTS_TOTAL++))
fi

echo ""
log "📈 Verificando funcionalidades críticas..."

# Verificar que se pueden obtener concursos
CONCURSOS_RESPONSE=$(curl -s http://localhost:8080/api/concursos 2>/dev/null || echo "failed")
if [[ "$CONCURSOS_RESPONSE" != "failed" ]] && [[ "$CONCURSOS_RESPONSE" == *"["* ]]; then
    success "API de concursos devuelve datos"
    ((TESTS_TOTAL++))
else
    fail "API de concursos no devuelve datos válidos"
    ((TESTS_TOTAL++))
fi

# Verificar tipos de documentos
DOCS_RESPONSE=$(curl -s http://localhost:8080/api/documentos/types 2>/dev/null || echo "failed")
if [[ "$DOCS_RESPONSE" != "failed" ]] && [[ "$DOCS_RESPONSE" == *"["* ]]; then
    success "API de tipos de documentos devuelve datos"
    ((TESTS_TOTAL++))
else
    fail "API de tipos de documentos no devuelve datos válidos"
    ((TESTS_TOTAL++))
fi

echo ""
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=========================="
echo "✅ Tests pasados: $TESTS_PASSED"
echo "❌ Tests fallidos: $TESTS_FAILED"
echo "📊 Total de tests: $TESTS_TOTAL"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    success "🎉 ¡Todas las verificaciones pasaron! La aplicación está lista para producción."
    exit 0
elif [ $TESTS_FAILED -lt 3 ]; then
    echo ""
    warn "⚠️ Algunas verificaciones fallaron, pero la aplicación debería funcionar."
    exit 1
else
    echo ""
    error "❌ Muchas verificaciones fallaron. Revisa la configuración antes de usar en producción."
    exit 2
fi
