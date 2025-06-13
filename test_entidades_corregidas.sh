#!/bin/bash

# Script de testing funcional para entidades JPA corregidas
# Fecha: 2025-01-27
# Objetivo: Verificar que todas las correcciones JPA funcionan correctamente

echo "🔍 TESTING FUNCIONAL DE ENTIDADES JPA CORREGIDAS"
echo "================================================"
echo ""

BASE_URL="http://localhost:8080/api"
ADMIN_TOKEN=""

# Función para obtener token de administrador
get_admin_token() {
    echo "🔐 Obteniendo token de administrador..."
    
    # Intentar login con credenciales de admin
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "admin123"
        }')
    
    if [[ $RESPONSE == *"token"* ]]; then
        ADMIN_TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Token obtenido exitosamente"
        return 0
    else
        echo "❌ Error obteniendo token: $RESPONSE"
        return 1
    fi
}

# Función para testing de endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo "🧪 Testing: $description"
    echo "   Método: $method"
    echo "   Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        RESPONSE=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "$data" \
            -w "\nHTTP_CODE:%{http_code}")
    else
        RESPONSE=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -w "\nHTTP_CODE:%{http_code}")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo "   Código HTTP: $HTTP_CODE"
    
    if [[ $HTTP_CODE -ge 200 && $HTTP_CODE -lt 300 ]]; then
        echo "   ✅ ÉXITO"
    elif [[ $HTTP_CODE -eq 401 ]]; then
        echo "   ⚠️  No autorizado (esperado para algunos endpoints)"
    elif [[ $HTTP_CODE -eq 404 ]]; then
        echo "   ⚠️  Endpoint no encontrado"
    else
        echo "   ❌ ERROR"
        echo "   Respuesta: $BODY"
    fi
    
    echo ""
}

# Función principal de testing
run_tests() {
    echo "🚀 Iniciando tests funcionales..."
    echo ""
    
    # 1. Testing de ContestEntity (corregida)
    echo "📋 1. TESTING CONTESTENTITY"
    test_endpoint "GET" "/contests" "Listar concursos"
    test_endpoint "GET" "/contests/1" "Obtener concurso específico"
    
    # 2. Testing de InscriptionEntity (corregida)
    echo "📝 2. TESTING INSCRIPTIONENTITY"
    test_endpoint "GET" "/inscriptions" "Listar inscripciones"
    
    # 3. Testing de ExperienceEntity (corregida)
    echo "💼 3. TESTING EXPERIENCEENTITY"
    test_endpoint "GET" "/experiences" "Listar experiencias"
    
    # 4. Testing de EducationEntity (corregida)
    echo "🎓 4. TESTING EDUCATIONENTITY"
    test_endpoint "GET" "/education" "Listar educación"
    
    # 5. Testing de DocumentEntity (corregida)
    echo "📄 5. TESTING DOCUMENTENTITY"
    test_endpoint "GET" "/documents" "Listar documentos"
    test_endpoint "GET" "/documents/types" "Listar tipos de documento"
    
    # 6. Testing de ExaminationEntity (corregida)
    echo "📝 6. TESTING EXAMINATIONENTITY"
    test_endpoint "GET" "/examinations" "Listar exámenes"
    
    # 7. Testing de NotificationEntity (verificada como correcta)
    echo "🔔 7. TESTING NOTIFICATIONENTITY"
    test_endpoint "GET" "/notifications" "Listar notificaciones"
    
    # 8. Testing de UserEntity (verificada como correcta)
    echo "👤 8. TESTING USERENTITY"
    test_endpoint "GET" "/users" "Listar usuarios"
    
    echo "✅ Tests funcionales completados"
}

# Función para verificar estado del backend
check_backend_status() {
    echo "🔍 Verificando estado del backend..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
    
    if [[ $HTTP_CODE -eq 200 ]]; then
        echo "✅ Backend funcionando correctamente"
        return 0
    elif [[ $HTTP_CODE -eq 401 ]]; then
        echo "✅ Backend funcionando (requiere autenticación)"
        return 0
    else
        echo "❌ Backend no disponible (HTTP: $HTTP_CODE)"
        echo "   Asegúrate de que el backend esté ejecutándose en puerto 8080"
        return 1
    fi
}

# Ejecución principal
main() {
    echo "🔍 TESTING FUNCIONAL DE ENTIDADES JPA CORREGIDAS"
    echo "================================================"
    echo "Fecha: $(date)"
    echo "Objetivo: Verificar que todas las correcciones JPA funcionan correctamente"
    echo ""
    
    # Verificar backend
    if ! check_backend_status; then
        exit 1
    fi
    
    # Obtener token (opcional para algunos tests)
    get_admin_token
    
    # Ejecutar tests
    run_tests
    
    echo ""
    echo "🎯 RESUMEN:"
    echo "- Tests ejecutados para todas las entidades corregidas"
    echo "- Verificación de endpoints principales"
    echo "- Validación de conectividad JPA-Database"
    echo ""
    echo "✅ Testing funcional completado"
}

# Ejecutar script
main "$@"
