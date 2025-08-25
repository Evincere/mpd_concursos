#!/bin/bash

BASE_URL="http://localhost:8080/api"
echo "=== PRUEBA DE BÚSQUEDA DE DOCUMENTOS ==="
echo ""

# Función para test de DNI
test_dni_search() {
    local dni="$1"
    echo "🔍 Probando búsqueda por DNI: $dni"
    
    # Test 1: buscar por usuarioId (DNI directo)
    echo "  Test 1: usuarioId=$dni"
    curl -s "$BASE_URL/admin/documentos?usuarioId=$dni&size=5" | jq -r '.content | length // "error"' | head -1
    
    # Test 2: buscar por busqueda (texto)  
    echo "  Test 2: busqueda=$dni"
    curl -s "$BASE_URL/admin/documentos?busqueda=$dni&size=5" | jq -r '.content | length // "error"' | head -1
    
    echo ""
}

# Obtener UUID de usuario por DNI
get_user_uuid() {
    local dni="$1"
    echo "🔍 Obteniendo UUID para DNI: $dni"
    docker exec -i mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos -e "
    SELECT REPLACE(REPLACE(REPLACE(REPLACE(HEX(id), 
        SUBSTR(HEX(id), 1, 8), CONCAT(SUBSTR(HEX(id), 1, 8), '-')),
        SUBSTR(HEX(id), 13, 4), CONCAT(SUBSTR(HEX(id), 13, 4), '-')),
        SUBSTR(HEX(id), 17, 4), CONCAT(SUBSTR(HEX(id), 17, 4), '-')), 
        SUBSTR(HEX(id), 21, 4), CONCAT(SUBSTR(HEX(id), 21, 4), '-')) as uuid_formatted
    FROM user_entity WHERE dni = '$dni';
    " 2>/dev/null | tail -1
}

# Probar búsquedas
test_dni_search "26598410"
test_dni_search "34642267"

# Obtener UUIDs y probar con ellos
echo "=== OBTENIENDO UUIDs ==="
uuid_26598410=$(get_user_uuid "26598410")
uuid_34642267=$(get_user_uuid "34642267")

echo "UUID para 26598410: $uuid_26598410"
echo "UUID para 34642267: $uuid_34642267"

echo ""
echo "=== PROBANDO CON UUIDs ==="
if [ ! -z "$uuid_26598410" ] && [ "$uuid_26598410" != "uuid_formatted" ]; then
    echo "🔍 Test con UUID de 26598410:"
    curl -s "$BASE_URL/admin/documentos?usuarioId=$uuid_26598410&size=5" | jq -r '.content | length // "error"' | head -1
fi

if [ ! -z "$uuid_34642267" ] && [ "$uuid_34642267" != "uuid_formatted" ]; then
    echo "🔍 Test con UUID de 34642267:"
    curl -s "$BASE_URL/admin/documentos?usuarioId=$uuid_34642267&size=5" | jq -r '.content | length // "error"' | head -1
fi

