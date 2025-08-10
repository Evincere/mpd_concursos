#!/bin/bash
# Script para restaurar el estado actual después de las extracciones

TIMESTAMP="$1"
if [ -z "$TIMESTAMP" ]; then
    echo "❌ Error: Debe proporcionar el timestamp del backup"
    echo "Uso: $0 TIMESTAMP"
    echo "Ejemplo: $0 20250806_183045"
    exit 1
fi

BACKUP_DIR="/root/backups"

echo "🔄 [$(date)] RESTAURANDO ESTADO ACTUAL"

# Verificar que los backups existen
if [ ! -f "$BACKUP_DIR/current_state_$TIMESTAMP.tar.gz" ]; then
    echo "❌ Error: Backup de storage no encontrado"
    echo "Archivo esperado: $BACKUP_DIR/current_state_$TIMESTAMP.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/current_db_$TIMESTAMP.sql" ]; then
    echo "❌ Error: Backup de BD no encontrado"
    echo "Archivo esperado: $BACKUP_DIR/current_db_$TIMESTAMP.sql"
    exit 1
fi

echo "💾 Restaurando volúmenes Docker..."
docker run --rm \
    -v mpd_concursos_storage_data_prod:/data \
    -v "$BACKUP_DIR":/backup \
    alpine tar xzf "/backup/current_state_$TIMESTAMP.tar.gz" -C /data

echo "🗄️ Restaurando base de datos..."
docker exec -i mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos < "$BACKUP_DIR/current_db_$TIMESTAMP.sql"

echo "🔄 Reiniciando contenedores..."
docker restart mpd-concursos-backend-prod mpd-concursos-frontend-prod

echo "⏳ Esperando a que los servicios se inicien..."
sleep 30

# Verificar estado
echo "✅ Verificando restauración..."
CURRENT_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l)
EXPECTED_DOCS=$(cat "$BACKUP_DIR/current_docs_count_$TIMESTAMP.txt")

echo "📊 Documentos actuales: $CURRENT_DOCS"
echo "📊 Documentos esperados: $EXPECTED_DOCS"

if [ "$CURRENT_DOCS" -eq "$EXPECTED_DOCS" ]; then
    echo "✅ Restauración exitosa"
else
    echo "⚠️ Posible discrepancia en documentos"
fi

echo ""
echo "🎯 PRÓXIMO PASO:"
echo "Ejecutar: integrate_recovered_documents.sh"
