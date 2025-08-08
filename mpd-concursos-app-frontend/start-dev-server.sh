#!/bin/bash

# Script para iniciar el servidor de desarrollo con más memoria
# Soluciona el problema: "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory"

echo "🚀 Iniciando servidor de desarrollo con memoria aumentada..."
echo "📊 Memoria asignada: 4GB"
echo "🌐 URL: http://localhost:4200"
echo ""

# Aumentar memoria de Node.js a 4GB
export NODE_OPTIONS="--max-old-space-size=4096"

# Iniciar servidor de desarrollo
ng serve --host 0.0.0.0 --port 4200 --disable-host-check --proxy-config proxy.dev.conf.json