#!/bin/bash
# Script de inicialización del backend
echo "🔗 Inicializando enlaces simbólicos para documentos..."

# Verificar si el enlace ya existe
if [ ! -e "/app/documents" ]; then
    ln -s /app/storage/documents /app/documents
    echo "✅ Enlace simbólico creado: /app/documents -> /app/storage/documents"
else
    echo "ℹ️  El enlace /app/documents ya existe"
fi

# Verificar que el enlace funciona
if [ -d "/app/documents" ]; then
    echo "✅ Verificación: /app/documents es accesible"
    ls /app/documents | head -3
else
    echo "❌ Error: /app/documents no es accesible"
fi

# Continuar con el comando original
echo "🚀 Iniciando aplicación backend..."
exec "$@"
