#!/bin/bash

BASE_URL="http://localhost:8080/api"
echo "=== PRUEBA COMPLETA DE FIX DE BÚSQUEDA POR DNI ==="
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Función para testear el endpoint
test_endpoint() {
    local dni="$1"
    local description="$2"
    echo "🔍 Probando: $description"
    echo "   DNI: $dni"
    
    # Hacer la petición al endpoint
    local response=$(curl -s "$BASE_URL/admin/documentos?usuarioId=$dni&size=10" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
        # Analizar respuesta usando jq si está disponible, sino análisis básico
        if command -v jq &> /dev/null; then
            local doc_count=$(echo "$response" | jq -r '.content | length // "error"' 2>/dev/null)
            local total_elements=$(echo "$response" | jq -r '.totalElements // "unknown"' 2>/dev/null)
            echo "   📄 Documentos devueltos: $doc_count"
            echo "   📊 Total elementos: $total_elements"
            
            if [[ "$doc_count" =~ ^[0-9]+$ ]] && [[ "$doc_count" -gt 0 ]]; then
                echo "   ✅ SUCCESS: Documentos encontrados!"
                # Mostrar algunos ejemplos
                echo "   📋 Primeros documentos:"
                echo "$response" | jq -r '.content[0:3][] | "      - " + .originalName + " (" + .documentType + ")"' 2>/dev/null
            else
                echo "   ❌ FAIL: Sin documentos o error en respuesta"
                echo "   🔍 Respuesta (primeros 200 chars): $(echo "$response" | head -c 200)..."
            fi
        else
            # Sin jq, análisis básico
            if echo "$response" | grep -q '"content"' && echo "$response" | grep -q '"totalElements"'; then
                echo "   ✅ SUCCESS: Respuesta JSON válida recibida"
                echo "   🔍 Respuesta (primeros 300 chars): $(echo "$response" | head -c 300)..."
            else
                echo "   ❌ FAIL: Respuesta inválida o error"
                echo "   🔍 Respuesta: $response"
            fi
        fi
    else
        echo "   ❌ FAIL: Error de conexión al endpoint"
    fi
    echo ""
}

# Esperar que el backend esté completamente operativo
echo "⏳ Esperando que el backend esté completamente operativo..."
for i in {1..10}; do
    if curl -s "$BASE_URL/admin/documentos/health" >/dev/null 2>&1; then
        echo "✅ Backend operativo!"
        break
    fi
    echo "   Intento $i/10..."
    sleep 3
done

echo ""

# Probar ambos casos
test_endpoint "26598410" "Usuario que FUNCIONABA antes (DNI: 26598410 - Sergio Mauricio Pereyra)"
test_endpoint "34642267" "Usuario que NO FUNCIONABA antes (DNI: 34642267 - Francisco Samuel Bernues)"

# Probar caso UUID para verificar compatibilidad hacia atrás
echo "🔍 Probando compatibilidad hacia atrás con UUID:"
UUID_26598410="74245cb9-3d02-4bde-9552-8a9cbc1ab253"
UUID_34642267="49fa44f0-066b-4f61-a7f1-105d8403d0cc"

test_endpoint "$UUID_26598410" "UUID del usuario 26598410 (compatibilidad hacia atrás)"
test_endpoint "$UUID_34642267" "UUID del usuario 34642267 (compatibilidad hacia atrás)"

# Probar caso inválido
echo "🔍 Probando manejo de entrada inválida:"
test_endpoint "ABC123XYZ" "Entrada inválida (ni UUID ni DNI numérico)"

echo "=== FIN DE PRUEBAS ==="
echo ""
echo "🏥 Si todos los tests muestran SUCCESS o respuestas válidas, el fix funciona correctamente!"
