#!/bin/bash

# Script mejorado para buscar usuarios - incluye username
# Uso: ./search_user_improved.sh [término_de_búsqueda]

SEARCH_TERM="$1"

if [ -z "$SEARCH_TERM" ]; then
    echo "❌ Error: Debe proporcionar un término de búsqueda"
    echo "Uso: $0 [término_de_búsqueda]"
    echo "Ejemplo: $0 semper"
    echo "Ejemplo: $0 sergio"
    echo "Ejemplo: $0 spereyra.jus@gmail.com"
    exit 1
fi

echo "🔍 BÚSQUEDA COMPLETA DE USUARIO"
echo "==============================="
echo "Término: '$SEARCH_TERM'"
echo ""

DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS=$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2)

echo "🎯 Buscando en todos los campos relevantes..."

# Búsqueda completa incluyendo username
docker exec -it mpd-concursos-mysql-prod mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    HEX(u.id) as user_id,
    u.username,
    u.email, 
    u.first_name,
    u.last_name,
    u.dni,
    u.status
FROM user_entity u 
WHERE 
    LOWER(u.username) LIKE LOWER('%$SEARCH_TERM%') OR
    LOWER(u.email) LIKE LOWER('%$SEARCH_TERM%') OR
    LOWER(u.first_name) LIKE LOWER('%$SEARCH_TERM%') OR
    LOWER(u.last_name) LIKE LOWER('%$SEARCH_TERM%') OR
    u.dni LIKE '%$SEARCH_TERM%'
ORDER BY u.username;" 2>/dev/null

echo ""
echo "💡 CAMPOS DE BÚSQUEDA INCLUIDOS:"
echo "   • username (nombre de usuario/nick)"
echo "   • email"
echo "   • first_name (nombre)"
echo "   • last_name (apellido)" 
echo "   • dni"

