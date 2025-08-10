#!/bin/bash

# Script para limpiar backups antiguos del monitor automático
# Mantiene solo los últimos 7 días de backups

echo "🧹 Limpiando backups automáticos antiguos..."
echo "================================================"

BACKUP_DIR="/opt/mpd-monitor/backups"
DAYS_TO_KEEP=7

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Directorio de backups no encontrado: $BACKUP_DIR"
    exit 1
fi

echo "📁 Directorio de backups: $BACKUP_DIR"
echo "📅 Manteniendo últimos $DAYS_TO_KEEP días"
echo ""

# Mostrar espacio actual
echo "💾 Espacio actual:"
du -sh "$BACKUP_DIR"
echo ""

# Contar archivos actuales
TOTAL_FILES=$(find "$BACKUP_DIR" -type f | wc -l)
echo "📄 Archivos actuales: $TOTAL_FILES"
echo ""

# Encontrar archivos más antiguos que N días
echo "🔍 Buscando archivos más antiguos que $DAYS_TO_KEEP días..."
OLD_FILES=$(find "$BACKUP_DIR" -type f -mtime +$DAYS_TO_KEEP)

if [ -z "$OLD_FILES" ]; then
    echo "✅ No hay archivos antiguos para eliminar"
    exit 0
fi

echo "📋 Archivos a eliminar:"
echo "$OLD_FILES" | while read file; do
    echo "  - $(basename "$file") ($(stat -c%y "$file" | cut -d' ' -f1))"
done

OLD_FILES_COUNT=$(echo "$OLD_FILES" | wc -l)
echo ""
echo "🗑️  Total archivos a eliminar: $OLD_FILES_COUNT"

# Calcular espacio a liberar
SPACE_TO_FREE=$(echo "$OLD_FILES" | xargs du -ch 2>/dev/null | tail -1 | cut -f1)
echo "💾 Espacio a liberar: $SPACE_TO_FREE"
echo ""

read -p "¿Continuar con la eliminación? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Eliminando archivos antiguos..."
    echo "$OLD_FILES" | xargs rm -f
    
    echo ""
    echo "✅ Limpieza completada"
    echo ""
    echo "💾 Espacio después de la limpieza:"
    du -sh "$BACKUP_DIR"
    
    REMAINING_FILES=$(find "$BACKUP_DIR" -type f | wc -l)
    echo "📄 Archivos restantes: $REMAINING_FILES"
else
    echo "❌ Operación cancelada"
fi