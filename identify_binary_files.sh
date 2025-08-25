#!/bin/bash
echo "=== Identificando archivos con nombres binarios ==="
echo

# Contar archivos con bytes no imprimibles en sus nombres
count=0
for file in *; do
    if [[ "$file" =~ [^[:print:]] ]] || [[ "$file" =~ $'\x00' ]] || [[ "$file" =~ $'\x01' ]] || [[ "$file" =~ $'\x02' ]] || [[ "$file" =~ $'\x03' ]] || [[ "$file" =~ $'\x04' ]] || [[ "$file" =~ $'\x05' ]]; then
        echo "Archivo problemático encontrado:"
        echo -n "Nombre hexadecimal: "
        printf '%s' "$file" | xxd -p
        echo
        echo -n "Tamaño: "
        if [[ -e "$file" ]]; then
            ls -lh "$file" | awk '{print $5}'
        else
            echo "No accesible"
        fi
        echo "---"
        ((count++))
    fi
done

echo "Total de archivos con nombres problemáticos: $count"
