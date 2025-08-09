#!/bin/bash
"""
SOLUCIÓN GENERAL - CONFIGURACIÓN TIMEZONE
Script para corregir la zona horaria de todo el sistema MPD Concursos
"""

echo "🌍 SOLUCIÓN GENERAL - CONFIGURACIÓN TIMEZONE ARGENTINA"
echo "================================================================="

echo "📋 ANÁLISIS ACTUAL DEL SISTEMA:"
echo "• Host: $(timedatectl | grep "Time zone")"
echo "• Contenedores: UTC (problema detectado)"
echo "• Frontend: Usuarios en ART"
echo "• Backend: UTC (causante del desfase)"

echo ""
echo "🔧 PASOS PARA LA CORRECCIÓN:"
echo ""

echo "1. 📁 BACKUP DE CONFIGURACIÓN ACTUAL"
echo "   cp docker-compose.production.yml docker-compose.production.yml.backup.$(date +%Y%m%d_%H%M%S)"

echo ""
echo "2. 🛠️ MODIFICACIONES EN DOCKER-COMPOSE:"
echo ""
echo "   Para el servicio BACKEND:"
echo "   ========================="
echo "   environment:"
echo "     - TZ=America/Argentina/Buenos_Aires"
echo "     - JAVA_OPTS=-Dspring.jpa.properties.hibernate.jdbc.time_zone=America/Argentina/Buenos_Aires -Duser.timezone=America/Argentina/Buenos_Aires"
echo "     - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mpd_concursos?serverTimezone=America/Argentina/Buenos_Aires&useSSL=false&allowPublicKeyRetrieval=true"

echo ""
echo "   Para el servicio MYSQL:"
echo "   ======================"
echo "   environment:"
echo "     - TZ=America/Argentina/Buenos_Aires"
echo "     - MYSQL_ROOT_PASSWORD=root1234"
echo "     - MYSQL_DATABASE=mpd_concursos"
echo "   command: --default-time-zone='-03:00' --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci"

echo ""
echo "3. 🔄 APLICACIÓN DE CAMBIOS (REQUIERE DOWNTIME):"
echo "   docker-compose -f docker-compose.production.yml down"
echo "   docker-compose -f docker-compose.production.yml up -d"

echo ""
echo "4. ✅ VERIFICACIÓN POST-IMPLEMENTACIÓN:"
echo "   docker exec mpd_concursos-backend-1 date"
echo "   docker exec mpd_concursos-mysql-1 mysql -u root -proot1234 -e \"SELECT NOW();\""

echo ""
echo "⚠️ CONSIDERACIONES IMPORTANTES:"
echo "• Planificar durante ventana de mantenimiento"
echo "• Notificar a usuarios del downtime temporal"
echo "• Verificar todas las inscripciones post-cambio"
echo "• Auditar timestamps existentes si es necesario"

echo ""
echo "🎯 BENEFICIOS ESPERADOS:"
echo "• Timestamps correctos en zona horaria Argentina"
echo "• Fechas de inscripción exactas para usuarios"
echo "• Eliminación de confusión horaria"
echo "• Cumplimiento de expectativas de usuarios locales"

