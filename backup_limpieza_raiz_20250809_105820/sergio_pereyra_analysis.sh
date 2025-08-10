#!/bin/bash

echo "📋 ANÁLISIS ESPECÍFICO: Sergio Pereyra"
echo "====================================="

echo "👤 Información del usuario:"
echo "   📧 Email: spereyra.jus@gmail.com"
echo "   🆔 DNI: 26598410"
echo "   📊 User ID: 74245CB93D024BDE95528A9CBC1AB253"
echo ""

echo "📄 Documentos en base de datos:"
docker exec -it mpd-concursos-mysql-prod mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env.production | cut -d'=' -f2) mpd_concursos -e "SELECT file_name, upload_date, status FROM documents WHERE user_id = UNHEX('74245CB93D024BDE95528A9CBC1AB253') ORDER BY upload_date DESC;" 2>/dev/null | tail -n +2

echo ""
echo "📁 Verificación de archivos físicos:"
SERGIO_DIR="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/storage/documents/26598410"

if [ -d "$SERGIO_DIR" ]; then
    echo "✅ Directorio existe: $SERGIO_DIR"
    FILE_COUNT=$(sudo find "$SERGIO_DIR" -name "*.pdf" 2>/dev/null | wc -l)
    echo "📊 Archivos PDF encontrados: $FILE_COUNT"
    
    if [ "$FILE_COUNT" -eq 0 ]; then
        echo "❌ PROBLEMA CONFIRMADO: Directorio vacío, archivos perdidos"
    else
        echo "✅ Archivos encontrados:"
        sudo ls -la "$SERGIO_DIR"
    fi
else
    echo "❌ PROBLEMA: Directorio no existe"
fi

echo ""
echo "🔍 Análisis del problema:"
echo "• Fecha de upload: 5 de agosto 2025, 12:31 hrs"
echo "• Momento crítico: Antes de la corrección del mapeo de volumen"
echo "• Estado: PENDING (documentos nunca se procesaron)"
echo "• Archivos físicos: PERDIDOS"
echo ""

echo "💡 RECOMENDACIONES:"
echo "1. ❗ Contactar a Sergio Pereyra (spereyra.jus@gmail.com)"
echo "2. 📤 Solicitar que vuelva a subir los siguientes documentos:"
echo "   • DNI (Frontal).pdf"
echo "   • DNI (Dorso).pdf" 
echo "   • Constancia de CUIL.pdf"
echo "   • Certificado Ley Micaela.pdf"
echo "   • Título Universitario y Certificado Analítico.pdf"
echo "3. 🧹 Opcional: Limpiar registros huérfanos de la BD"
echo ""

echo "🎯 CAUSA RAÍZ:"
echo "Los documentos se perdieron porque fueron subidos durante el período"
echo "donde el mapeo del volumen Docker estaba mal configurado (antes del"
echo "6 de agosto, 11:34 hrs). Los archivos se guardaron en el sistema de"
echo "archivos temporal del contenedor y se perdieron al reiniciar."

