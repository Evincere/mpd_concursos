#!/bin/bash

echo "🔍 Monitor de Enlaces de Documentos - $(date)"
echo "============================================="

# Función para verificar y corregir enlaces
check_and_fix_links() {
    echo "🔍 Verificando enlace simbólico de documentos..."
    
    # Verificar si el contenedor backend está ejecutándose
    if ! docker compose -f docker-compose.prod.yml ps | grep -q "backend.*Up.*healthy"; then
        echo "⚠️  Backend no está ejecutándose correctamente"
        return 1
    fi
    
    # Verificar enlace simbólico
    result=$(docker compose -f docker-compose.prod.yml exec backend sh -c "
        if [ -L '/app/documents' ] && [ -d '/app/storage/documents' ]; then
            echo 'LINK_OK'
        elif [ -d '/app/storage/documents' ]; then
            echo 'LINK_MISSING'
        else
            echo 'STORAGE_MISSING'
        fi
    " 2>/dev/null)
    
    case "$result" in
        "LINK_OK")
            echo "✅ Enlace simbólico funcionando correctamente"
            return 0
            ;;
        "LINK_MISSING")
            echo "⚠️  Enlace simbólico faltante - Recreando..."
            docker compose -f docker-compose.prod.yml exec backend ln -sf /app/storage/documents /app/documents 2>/dev/null
            echo "✅ Enlace simbólico recreado"
            return 0
            ;;
        "STORAGE_MISSING")
            echo "❌ Error crítico: Directorio storage/documents no existe"
            return 1
            ;;
        *)
            echo "❌ Error: No se pudo verificar el estado del enlace"
            return 1
            ;;
    esac
}

# Ejecutar verificación
if check_and_fix_links; then
    echo "🎉 Sistema de documentos operativo"
    
    # Verificar archivo específico de Laura como prueba
    if docker compose -f docker-compose.prod.yml exec backend test -f "/app/documents/40071999/f310a46d-c975-482f-94cc-8010c92c953a_DNI__Dorso__1754422960313.pdf" 2>/dev/null; then
        echo "✅ Prueba: Archivo de Laura Alvarado accesible"
    else
        echo "⚠️  Archivo de prueba no accesible - puede requerir intervención"
    fi
else
    echo "❌ Error en sistema de documentos - se requiere intervención manual"
    exit 1
fi

echo "================================================"
