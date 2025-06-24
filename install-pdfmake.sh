#!/bin/bash

# Script para instalar dependencias de pdfmake en el frontend
echo "Instalando dependencias de pdfmake..."

cd mpd-concursos-app-frontend

# Instalar pdfmake y sus tipos
pnpm add pdfmake@^0.2.12
pnpm add -D @types/pdfmake@^0.2.9

echo "Dependencias de pdfmake instaladas correctamente."
echo "Ahora puedes proceder con la construcción de las imágenes Docker."
