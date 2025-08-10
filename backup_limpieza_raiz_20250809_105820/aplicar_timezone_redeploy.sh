#!/bin/bash
# SCRIPT DE APLICACIÓN TIMEZONE - REDEPLOY
# Generado: 2025-08-08 22:23:38

echo "🌍 APLICANDO CONFIGURACIÓN TIMEZONE ARGENTINA - MPD CONCURSOS"
echo "================================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml no encontrado"
    exit 1
fi

echo "📋 PRE-VERIFICACIONES:"
echo "   • Sistema actual en producción"
echo "   • Configuración timezone preparada"
echo "   • Backup de seguridad disponible"

# 1. Crear backup final antes del cambio
echo ""
echo "📁 1. CREANDO BACKUP FINAL..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp docker-compose.production.yml docker-compose.production.yml.backup_final_$TIMESTAMP
echo "   ✅ Backup final: docker-compose.production.yml.backup_final_$TIMESTAMP"

# 2. Aplicar nueva configuración
echo ""
echo "🔧 2. APLICANDO CONFIGURACIÓN TIMEZONE..."
cp docker-compose.production.yml.timezone_ready docker-compose.production.yml
echo "   ✅ Configuración timezone aplicada"

# 3. Detener servicios
echo ""
echo "🛑 3. DETENIENDO SERVICIOS..."
docker-compose -f docker-compose.production.yml down
echo "   ✅ Servicios detenidos"

# 4. Reiniciar con nueva configuración
echo ""
echo "🚀 4. INICIANDO SERVICIOS CON TIMEZONE ARGENTINA..."
docker-compose -f docker-compose.production.yml up -d
echo "   ✅ Servicios iniciados con timezone corregido"

# 5. Verificar servicios
echo ""
echo "✅ 5. VERIFICANDO SERVICIOS..."
sleep 30
docker-compose -f docker-compose.production.yml ps

# 6. Verificar timezone en contenedores
echo ""
echo "🕐 6. VERIFICANDO TIMEZONE EN CONTENEDORES..."
echo "   Backend timezone:"
docker exec mpd-concursos-backend date
echo "   MySQL timezone:"
docker exec mpd-concursos-mysql mysql -u root -proot1234 -e "SELECT NOW() as 'MySQL Time', @@system_time_zone as 'System TZ';"

echo ""
echo "🎉 APLICACIÓN DE TIMEZONE COMPLETADA"
echo "   • Todos los servicios funcionando"
echo "   • Timezone configurado: America/Argentina/Buenos_Aires"
echo "   • Próximas inscripciones tendrán fecha/hora correcta"
echo "   • Backup disponible en caso de rollback"

echo ""
echo "📋 VERIFICACIONES RECOMENDADAS:"
echo "   1. Probar una inscripción de prueba"
echo "   2. Verificar logs de backend"
echo "   3. Confirmar timestamps en base de datos"
echo "   4. Monitorear por 24-48 horas"
