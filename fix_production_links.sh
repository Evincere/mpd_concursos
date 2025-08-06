#!/bin/bash
echo "🔧 Corrección permanente de enlaces de documentos en producción"

# Corregir enlace principal de document-storage
docker compose -f docker-compose.prod.yml exec backend sh -c "
if [ ! -L '/app/document-storage' ] || [ \$(readlink /app/document-storage) != '/app/storage' ]; then
    rm -rf /app/document-storage
    ln -sf /app/storage /app/document-storage
    echo '✅ document-storage -> /app/storage'
else
    echo 'ℹ️  Enlace document-storage ya correcto'
fi
"

# Corregir enlace secundario de documents si es necesario
docker compose -f docker-compose.prod.yml exec backend sh -c "
if [ ! -L '/app/documents' ] || [ \$(readlink /app/documents) != '/app/storage/documents' ]; then
    rm -rf /app/documents
    ln -sf /app/storage/documents /app/documents
    echo '✅ documents -> /app/storage/documents'
else
    echo 'ℹ️  Enlace documents ya correcto'
fi
"

echo "✅ Todos los enlaces corregidos"
