#!/bin/bash

echo "🔍 ANÁLISIS DETALLADO DE USUARIOS CON GUIÓN FINAL"
echo "=================================================="

usuarios_con_guion=(
    "d.palet-"
    "Miriam2626.-"
    "Flor2103.-"
    "mg7.-"
    "cele83.julio22-"
    "delia50.-"
    "Silvina88.-"
    "Alejandragiana.78-"
    "Jgarcia1983.-"
)

for usuario in "${usuarios_con_guion[@]}"; do
    echo ""
    echo "👤 ANALIZANDO: $usuario"
    echo "----------------------------------------"
    
    # Buscar logins exitosos
    echo "✅ Logins exitosos:"
    docker exec mpd-concursos-mysql mysql -u root -proot1234 mpd_concursos -e "SELECT timestamp, event_type, outcome FROM audit_logs WHERE username = '$usuario' AND event_type = 'LOGIN_SUCCESS' ORDER BY timestamp DESC LIMIT 3;" 2>/dev/null | grep -v "Warning" | tail -n +2
    
    # Buscar logins fallidos
    echo "❌ Logins fallidos:"
    docker exec mpd-concursos-mysql mysql -u root -proot1234 mpd_concursos -e "SELECT timestamp, event_type, outcome FROM audit_logs WHERE username = '$usuario' AND event_type = 'LOGIN_FAILURE' ORDER BY timestamp DESC LIMIT 3;" 2>/dev/null | grep -v "Warning" | tail -n +2
    
    # Contar total de actividad
    total_exitosos=$(docker exec mpd-concursos-mysql mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) FROM audit_logs WHERE username = '$usuario' AND event_type = 'LOGIN_SUCCESS';" 2>/dev/null | grep -v "Warning" | tail -n +2)
    total_fallidos=$(docker exec mpd-concursos-mysql mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) FROM audit_logs WHERE username = '$usuario' AND event_type = 'LOGIN_FAILURE';" 2>/dev/null | grep -v "Warning" | tail -n +2)
    
    echo "📊 Resumen: $total_exitosos exitosos, $total_fallidos fallidos"
done
