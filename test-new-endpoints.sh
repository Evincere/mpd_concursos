#!/bin/bash

# Script para probar los nuevos endpoints de inscripción
BASE_URL="https://vps-4778464-x.dattaweb.com/api"
INSCRIPTION_ID="feea6805-876d-4db6-8801-877f77f6d13a"

echo "🧪 PROBANDO NUEVOS ENDPOINTS DE INSCRIPCIÓN"
echo "============================================="

# Función para hacer login y obtener token
get_token() {
    echo "🔐 Obteniendo token de autenticación..."
    
    # Datos de login del usuario de prueba
    LOGIN_DATA='{
        "username": "user_test",
        "password": "password123"
    }'
    
    # Hacer login
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$BASE_URL/auth/login")
    
    # Extraer token del response
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "✅ Token obtenido exitosamente"
        echo "   Token: ${TOKEN:0:50}..."
        return 0
    else
        echo "❌ Error al obtener token"
        echo "   Response: $RESPONSE"
        return 1
    fi
}

# Función para hacer peticiones autenticadas
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    echo "📡 $description"
    echo "   Método: $method"
    echo "   Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        echo "   Datos: $data"
        RESPONSE=$(curl -s -X $method \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TOKEN" \
             -d "$data" \
             "$BASE_URL$endpoint" \
             -w "\n   Status: %{http_code}")
    else
        RESPONSE=$(curl -s -X $method \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TOKEN" \
             "$BASE_URL$endpoint" \
             -w "\n   Status: %{http_code}")
    fi
    
    echo "   Response: $RESPONSE"
    echo ""
}

# Obtener token
if get_token; then
    echo ""
    echo "🔍 PROBANDO ENDPOINTS..."
    
    # Test 1: Obtener detalles de inscripción
    make_request "GET" "/inscriptions/$INSCRIPTION_ID/details" "" "Obtener detalles específicos de inscripción"
    
    # Test 2: Actualizar datos de inscripción
    UPDATE_DATA='{
        "centroDeVida": "Av. Corrientes 1234, CABA - Actualizado desde API",
        "circunscripciones": ["Primera", "Segunda"],
        "acceptedTerms": true
    }'
    
    make_request "PATCH" "/inscriptions/$INSCRIPTION_ID/data" "$UPDATE_DATA" "Actualizar datos de inscripción"
    
    # Test 3: Verificar que los datos se actualizaron
    make_request "GET" "/inscriptions/$INSCRIPTION_ID/details" "" "Verificar datos actualizados"
    
    echo "✅ PRUEBAS COMPLETADAS"
else
    echo "❌ No se pudo obtener token de autenticación"
    echo "   Verifica que el usuario 'user_test' exista y tenga la contraseña correcta"
fi

echo ""
echo "🔗 ENDPOINTS IMPLEMENTADOS:"
echo "   GET  /api/inscriptions/{id}/details - Obtener detalles específicos"
echo "   PATCH /api/inscriptions/{id}/data   - Actualizar datos específicos"
echo ""