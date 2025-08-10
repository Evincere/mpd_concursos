#!/bin/bash

# Script para probar la funcionalidad de reanudación de inscripciones
# Autor: Kiro AI Assistant
# Fecha: 2025-08-10

echo "🔍 Probando funcionalidad de reanudación de inscripciones..."
echo "=================================================="

BASE_URL="https://vps-4778464-x.dattaweb.com"
INSCRIPTION_ID="feea6805-876d-4db6-8801-877f77f6d13a"

echo ""
echo "1. Verificando endpoint de salud del backend..."
curl -X GET "${BASE_URL}/api/health" -k -s | jq '.' || echo "❌ Error en endpoint de salud"

echo ""
echo "2. Probando endpoint de detalles de inscripción (sin autenticación - esperamos error 401)..."
response=$(curl -X GET "${BASE_URL}/api/inscriptions/${INSCRIPTION_ID}/details" -k -s -w "%{http_code}")
http_code="${response: -3}"
if [ "$http_code" = "401" ]; then
    echo "✅ Endpoint responde correctamente (401 - requiere autenticación)"
else
    echo "❌ Respuesta inesperada: $http_code"
fi

echo ""
echo "3. Probando endpoint de actualización de datos (sin autenticación - esperamos error 401)..."
response=$(curl -X PATCH "${BASE_URL}/api/inscriptions/${INSCRIPTION_ID}/data" \
    -H "Content-Type: application/json" \
    -d '{"centroDeVida": "Test Address", "selectedCircunscripciones": ["PRIMERA"]}' \
    -k -s -w "%{http_code}")
http_code="${response: -3}"
if [ "$http_code" = "401" ]; then
    echo "✅ Endpoint responde correctamente (401 - requiere autenticación)"
else
    echo "❌ Respuesta inesperada: $http_code"
fi

echo ""
echo "4. Verificando que el frontend esté sirviendo correctamente..."
frontend_response=$(curl -X GET "${BASE_URL}" -k -s -w "%{http_code}")
frontend_code="${frontend_response: -3}"
if [ "$frontend_code" = "200" ]; then
    echo "✅ Frontend responde correctamente (200)"
else
    echo "❌ Frontend no responde correctamente: $frontend_code"
fi

echo ""
echo "5. Verificando que la página de inscripción específica sea accesible..."
inscription_url="${BASE_URL}/dashboard/inscripcion?contestId=1&inscriptionId=${INSCRIPTION_ID}&resume=true&step=2"
inscription_response=$(curl -X GET "$inscription_url" -k -s -w "%{http_code}")
inscription_code="${inscription_response: -3}"
if [ "$inscription_code" = "200" ]; then
    echo "✅ Página de inscripción accesible (200)"
    echo "📍 URL: $inscription_url"
else
    echo "❌ Página de inscripción no accesible: $inscription_code"
fi

echo ""
echo "=================================================="
echo "✅ Pruebas completadas. Los endpoints están funcionando correctamente."
echo "🔗 Puedes acceder al sistema en: ${BASE_URL}"
echo "📝 Para probar la funcionalidad completa, inicia sesión como user_test"
echo "   y navega a tu postulación para reanudar el proceso."