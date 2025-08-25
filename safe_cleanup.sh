#!/bin/bash

echo "=== Script de Limpieza Segura de Archivos con Nombres Binarios ==="
echo

# Crear un commit de respaldo antes de limpiar
echo "1. Creando commit de respaldo de archivos legítimos..."
git add . --ignore-errors 2>/dev/null
git commit -m "Backup before cleaning binary-named files - $(date)" 2>/dev/null || echo "Nada nuevo que commitear"

echo -e "\n2. Identificando archivos con nombres binarios..."

# Usar git clean para mostrar qué se eliminaría
echo "Archivos que se eliminarían:"
git clean -n | grep -E '(Would remove|Eliminaría)' | head -20

echo -e "\n3. ¿Proceder con la limpieza? Los archivos con nombres binarios son todos vacíos o corruptos."
read -p "Confirmar eliminación (s/N): " confirm

if [[ "$confirm" =~ ^[Ss]$ ]]; then
    echo -e "\n4. Eliminando archivos con nombres binarios de forma segura..."
    
    # Usar git clean con force para eliminar archivos no rastreados
    # pero solo los que tengan caracteres problemáticos
    
    # Primero, eliminar archivos vacíos con nombres binarios
    python3 << 'PYEOF'
import os
import subprocess

# Ejecutar ls y capturar archivos problemáticos
result = subprocess.run(['ls', '-1'], capture_output=True, text=False)
lines = result.stdout.split(b'\n')

deleted_count = 0
for line in lines:
    if not line:
        continue
    
    try:
        # Intentar decodificar
        filename = line.decode('utf-8', errors='strict')
        # Si contiene caracteres no-ASCII problemáticos o no es decodificable
        has_problematic = any(ord(c) < 32 or ord(c) > 126 for c in filename if c not in '\t\n')
        
        if has_problematic:
            try:
                # Verificar si el archivo existe y está vacío
                if os.path.exists(line) and os.path.getsize(line) == 0:
                    os.remove(line)
                    print(f"Eliminado archivo vacío con nombre binario (tamaño: {len(line)} bytes de nombre)")
                    deleted_count += 1
                elif os.path.exists(line):
                    size = os.path.getsize(line)
                    print(f"ADVERTENCIA: Archivo con nombre binario no vacío encontrado (tamaño: {size} bytes) - NO eliminado por seguridad")
            except Exception as e:
                print(f"Error procesando archivo: {e}")
    
    except UnicodeDecodeError:
        # Archivo completamente binario en el nombre
        try:
            if os.path.exists(line) and os.path.getsize(line) == 0:
                os.remove(line)
                print(f"Eliminado archivo vacío con nombre completamente binario")
                deleted_count += 1
        except Exception as e:
            print(f"Error eliminando archivo con nombre binario: {e}")

print(f"\nTotal de archivos eliminados: {deleted_count}")
PYEOF

    echo -e "\n5. Verificando el resultado..."
    echo "Estado después de la limpieza:"
    ls | head -10
    
    echo -e "\nArchivos problemáticos restantes:"
    git status --porcelain | grep '^??' | grep '".*"' | wc -l
    
else
    echo "Operación cancelada por el usuario."
fi

