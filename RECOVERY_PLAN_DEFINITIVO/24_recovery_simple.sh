#!/bin/bash

# Script simple para recuperar usuarios uno por uno
echo "🔄 Iniciando recuperación simple..."

# Lista de usuarios críticos para recuperar primero
USUARIOS_CRITICOS=(
    "23520516|enriquehbravo"
    "23856207|Gzannier"
    "24207375|maijogarzon1975"
    "24467884|Megonzalez15"
    "24866484|julia.bru-2075"
)

contador=0
exitosos=0

for usuario in "${USUARIOS_CRITICOS[@]}"; do
    ((contador++))
    IFS='|' read -r dni nombre <<< "$usuario"
    
    echo "[$contador/5] 🔄 Recuperando $dni ($nombre)..."
    
    if ./17_recuperar_usuario_especifico.sh "$dni" "$nombre" > /dev/null 2>&1; then
        echo "   ✅ EXITOSO: $dni"
        ((exitosos++))
    else
        echo "   ❌ FALLIDO: $dni"
    fi
    
    sleep 1
done

echo
echo "📊 Resumen: $exitosos/$contador usuarios recuperados exitosamente"