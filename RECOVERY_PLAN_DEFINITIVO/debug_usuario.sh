#!/bin/bash

# Script de debug para un usuario específico
DNI="21877460"
USERNAME="sILVI-54"
UUID_HEX="D2916D49BA4C467486C36891CEB37787"
TOTAL_DOCS_BD="8"

echo "=== DEBUG USUARIO $DNI ==="
echo "Username: $USERNAME"
echo "UUID HEX: $UUID_HEX"
echo "Docs en BD: $TOTAL_DOCS_BD"
echo

# Formatear UUID
if [ -n "$UUID_HEX" ] && [ "$UUID_HEX" != "NULL" ]; then
    FORMATTED_UUID=$(echo "$UUID_HEX" | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' | tr '[:upper:]' '[:lower:]')
    echo "UUID formateado: $FORMATTED_UUID"
else
    FORMATTED_UUID=""
    echo "UUID formateado: No disponible"
fi

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"

# Verificar documents/
USER_DOCS_DIR="$DOCKER_STORAGE/documents/$DNI"
echo "Verificando: $USER_DOCS_DIR"
if [ -d "$USER_DOCS_DIR" ]; then
    docs_fisicos=$(find "$USER_DOCS_DIR" -type f 2>/dev/null | wc -l)
    echo "Documents físicos: $docs_fisicos"
else
    docs_fisicos=0
    echo "Documents físicos: 0 (directorio no existe)"
fi

# Verificar CV documents
cv_fisicos=0
if [ -n "$FORMATTED_UUID" ]; then
    CV_DIR="$DOCKER_STORAGE/cv-documents/$FORMATTED_UUID"
    echo "Verificando CV: $CV_DIR"
    if [ -d "$CV_DIR" ]; then
        cv_fisicos=$(find "$CV_DIR" -type f 2>/dev/null | wc -l)
        echo "CV Documents físicos: $cv_fisicos"
    else
        echo "CV Documents físicos: 0 (directorio no existe)"
    fi
fi

# Verificar profile images
img_fisicas=0
if [ -n "$FORMATTED_UUID" ]; then
    IMG_DIR="$DOCKER_STORAGE/profile-images/$FORMATTED_UUID"
    echo "Verificando IMG: $IMG_DIR"
    if [ -d "$IMG_DIR" ]; then
        img_fisicas=$(find "$IMG_DIR" -type f 2>/dev/null | wc -l)
        echo "Profile Images físicas: $img_fisicas"
    else
        echo "Profile Images físicas: 0 (directorio no existe)"
    fi
fi

total_fisicos=$((docs_fisicos + cv_fisicos + img_fisicas))
echo
echo "=== RESUMEN ==="
echo "BD: $TOTAL_DOCS_BD"
echo "Físicos: $total_fisicos"
echo "Diferencia: $((TOTAL_DOCS_BD - total_fisicos))"

if [ "$TOTAL_DOCS_BD" -gt "$total_fisicos" ]; then
    echo "ESTADO: ❌ PROBLEMA - Faltan archivos"
elif [ "$TOTAL_DOCS_BD" -lt "$total_fisicos" ]; then
    echo "ESTADO: ⚠️ HUÉRFANOS - Archivos extra"
else
    echo "ESTADO: ✅ OK - Coinciden"
fi

echo "=== FIN DEBUG ==="