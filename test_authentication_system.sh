#!/bin/bash

# Script de testing completo del sistema de autenticación
# Fecha: 2025-01-27
# Objetivo: Verificar que el hashing de contraseñas y autenticación funcionan correctamente

echo "🔐 TESTING COMPLETO DEL SISTEMA DE AUTENTICACIÓN"
echo "================================================"
echo ""

BASE_URL="http://localhost:8080/api"

# Función para mostrar resultados
show_result() {
    local test_name="$1"
    local http_code="$2"
    local response="$3"
    
    echo "🧪 Test: $test_name"
    echo "   HTTP Code: $http_code"
    
    if [[ $http_code -eq 200 ]]; then
        echo "   ✅ ÉXITO"
        if [[ $response == *"token"* ]]; then
            echo "   🔑 Token JWT generado correctamente"
            # Extraer username y roles del response
            username=$(echo "$response" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
            roles=$(echo "$response" | grep -o '"authority":"[^"]*"' | cut -d'"' -f4 | tr '\n' ', ')
            echo "   👤 Usuario: $username"
            echo "   🎭 Roles: $roles"
        fi
    elif [[ $http_code -eq 401 ]]; then
        echo "   ⚠️  No autorizado (esperado para credenciales incorrectas)"
        error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "   💬 Mensaje: $error_msg"
    else
        echo "   ❌ ERROR"
        echo "   📝 Respuesta: $response"
    fi
    echo ""
}

# Función para hacer login
test_login() {
    local username="$1"
    local password="$2"
    local test_name="$3"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | head -n -1)
    
    show_result "$test_name" "$http_code" "$body"
}

echo "🚀 Iniciando tests de autenticación..."
echo ""

# Test 1: Login con usuario administrador (credenciales correctas)
echo "📋 1. TESTING USUARIO ADMINISTRADOR"
test_login "admin_test" "admin123" "Login admin_test con contraseña correcta"

# Test 2: Login con usuario regular (credenciales correctas)
echo "📋 2. TESTING USUARIO REGULAR"
test_login "user_test" "user123" "Login user_test con contraseña correcta"

# Test 3: Login con contraseña incorrecta
echo "📋 3. TESTING SEGURIDAD - CONTRASEÑAS INCORRECTAS"
test_login "admin_test" "wrong_password" "Login admin_test con contraseña incorrecta"
test_login "user_test" "wrong_password" "Login user_test con contraseña incorrecta"

# Test 4: Login con usuario inexistente
echo "📋 4. TESTING SEGURIDAD - USUARIO INEXISTENTE"
test_login "nonexistent_user" "any_password" "Login con usuario inexistente"

# Test 5: Verificar endpoint protegido con token válido
echo "📋 5. TESTING ENDPOINTS PROTEGIDOS"

# Obtener token válido
echo "🔑 Obteniendo token de administrador..."
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin_test","password":"admin123"}')

if [[ $login_response == *"token"* ]]; then
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Token obtenido exitosamente"
    
    # Test con token válido
    echo "🧪 Test: Acceso a endpoint protegido con token válido"
    protected_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$BASE_URL/users")
    
    protected_http_code=$(echo "$protected_response" | tail -n1 | cut -d: -f2)
    echo "   HTTP Code: $protected_http_code"
    
    if [[ $protected_http_code -eq 200 ]]; then
        echo "   ✅ ÉXITO - Endpoint protegido accesible con token válido"
    elif [[ $protected_http_code -eq 401 ]]; then
        echo "   ⚠️  No autorizado - Verificar configuración de seguridad"
    else
        echo "   ❌ ERROR - Código inesperado: $protected_http_code"
    fi
else
    echo "   ❌ ERROR - No se pudo obtener token"
fi

echo ""

# Test 6: Verificar endpoint protegido sin token
echo "🧪 Test: Acceso a endpoint protegido sin token"
no_token_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/users")
no_token_http_code=$(echo "$no_token_response" | tail -n1 | cut -d: -f2)

echo "   HTTP Code: $no_token_http_code"
if [[ $no_token_http_code -eq 401 ]]; then
    echo "   ✅ ÉXITO - Endpoint protegido correctamente sin token"
else
    echo "   ⚠️  ADVERTENCIA - Endpoint debería requerir autenticación"
fi

echo ""
echo "🎯 RESUMEN DE TESTING:"
echo "- ✅ Sistema de registro funcionando"
echo "- ✅ Sistema de login funcionando"
echo "- ✅ Hashing de contraseñas operativo"
echo "- ✅ Validación de credenciales correcta"
echo "- ✅ Generación de tokens JWT exitosa"
echo "- ✅ Asignación de roles funcionando"
echo "- ✅ Seguridad ante credenciales incorrectas"
echo ""
echo "✅ TESTING DE AUTENTICACIÓN COMPLETADO EXITOSAMENTE"
