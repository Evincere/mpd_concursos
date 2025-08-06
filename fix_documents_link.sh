#!/bin/bash
echo "🔗 Script de corrección de enlaces de documentos"
echo "Creando enlace simbólico si no existe..."

docker compose -f docker-compose.prod.yml exec backend sh -c "
if [ ! -L '/app/documents' ]; then
    ln -sf /app/storage/documents /app/documents
    echo '✅ Enlace simbólico recreado'
else
    echo 'ℹ️  Enlace ya existe'
fi
"
