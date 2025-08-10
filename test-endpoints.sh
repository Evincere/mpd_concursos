#!/bin/bash

# Script para probar los nuevos endpoints de inscripción
# Requiere que el backend esté ejecutándose

BASE_URL="https://vps-4778464-x.dattaweb.com/api"
INSCRIPTION_ID="feea6805-876d-4db6-8801-877f77f6d13a"

echo "🧪 PROBANDO NUEVOS ENDPOINTS DE INSCRIPCIÓN"
echo "============================================="

# Función para hacer peticiones con autenticación
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
        curl -X $method \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
             -d "$data" \
             "$BASE_URL$endpoint" \
             -w "\n   Status: %{http_code}\n" \
             -s
    else
        curl -X $method \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
             "$BASE_URL$endpoint" \
             -w "\n   Status: %{http_code}\n" \
             -s
    fi
    
    echo ""
}

echo ""
echo "⚠️  NOTA: Reemplaza 'YOUR_JWT_TOKEN_HERE' con un token JWT válido"
echo ""

# Test 1: Obtener detalles de inscripción
make_request "GET" "/inscriptions/$INSCRIPTION_ID/details" "" "Obtener detalles específicos de inscripción"

# Test 2: Actualizar datos de inscripción
UPDATE_DATA='{
    "centroDeVida": "Av. Corrientes 1234, CABA",
    "circunscripciones": ["Primera", "Segunda"],
    "acceptedTerms": true
}'

make_request "PATCH" "/inscriptions/$INSCRIPTION_ID/data" "$UPDATE_DATA" "Actualizar datos de inscripción"

# Test 3: Verificar que los datos se actualizaron
make_request "GET" "/inscriptions/$INSCRIPTION_ID/details" "" "Verificar datos actualizados"

echo ""
echo "✅ PRUEBAS COMPLETADAS"
echo ""
echo "📋 INSTRUCCIONES PARA USO REAL:"
echo "1. Obtén un token JWT válido autenticándote en el sistema"
echo "2. Reemplaza 'YOUR_JWT_TOKEN_HERE' con el token real"
echo "3. Reemplaza '$INSCRIPTION_ID' con un ID de inscripción válido"
echo "4. Ejecuta el script: bash test-endpoints.sh"
echo ""
echo "🔗 ENDPOINTS IMPLEMENTADOS:"
echo "   GET  /api/inscriptions/{id}/details - Obtener detalles específicos"
echo "   PATCH /api/inscriptions/{id}/data   - Actualizar datos específicos"
echo ""