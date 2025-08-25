#!/bin/bash
STORAGE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
LISTA_FILE="LISTA_DOCUMENTOS_USUARIOS_APTOS_VALIDACION.csv"
ERRORES_FILE="DOCUMENTOS_FALTANTES.txt"

echo "🔍 VERIFICANDO INTEGRIDAD DE DOCUMENTOS..."
echo "Fecha: $(date)" > $ERRORES_FILE
echo "====================================" >> $ERRORES_FILE

existentes=0
faltantes=0

# Leer la lista (saltando header)
tail -n +2 $LISTA_FILE | while IFS=$'\t' read -r dni nombre tipo archivo ruta_completa fecha; do
    # Corregir ruta (quitar duplicación de "documents/")
    archivo_limpio=$(echo "$archivo" | sed 's|^documents/[^/]*/||')
    ruta_fisica="$STORAGE_PATH/documents/$dni/$archivo_limpio"
    
    if [[ -f "$ruta_fisica" ]]; then
        ((existentes++))
        if [[ $((existentes % 100)) -eq 0 ]]; then
            echo "✅ Verificados: $existentes archivos"
        fi
    else
        echo "❌ FALTANTE: $dni - $nombre - $tipo" >> $ERRORES_FILE
        echo "   Archivo: $archivo_limpio" >> $ERRORES_FILE
        echo "   Ruta esperada: $ruta_fisica" >> $ERRORES_FILE
        echo "" >> $ERRORES_FILE
        ((faltantes++))
    fi
done

echo "📊 RESULTADO FINAL:"
echo "✅ Archivos encontrados: $existentes"
echo "❌ Archivos faltantes: $faltantes"
echo "📄 Ver detalles de faltantes en: $ERRORES_FILE"
