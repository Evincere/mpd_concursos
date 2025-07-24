#!/bin/bash
# Script para debugging de versioning - Ejecutar en una terminal separada

echo "🔍 DEBUGGING DE VERSIONING - MONITOR DE LOGS"
echo "=============================================="
echo ""
echo "Este script monitoreará el archivo de logs de versioning en tiempo real."
echo "Ejecuta el backend con ./run-dev.sh en otra terminal y luego reproduce el problema."
echo ""
echo "Presiona Ctrl+C para detener el monitoreo."
echo ""

# Crear directorio de logs si no existe
mkdir -p ./logs

# Crear archivo de log si no existe
touch ./logs/application-debug.log

echo "📁 Archivo de log: ./logs/application-debug.log"
echo "🚀 Iniciando monitoreo..."
echo "💡 Los logs de VERSIONING_DEBUG aparecerán aquí y en la consola"
echo ""

# Monitorear el archivo de log en tiempo real
tail -f ./logs/application-debug.log
