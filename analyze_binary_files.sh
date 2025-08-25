#!/bin/bash

echo "=== Análisis de archivos con nombres binarios ==="
echo

# Usar find para localizar archivos que no se pueden leer con caracteres normales
count=0
total_size=0

# Usar python para analizar estos archivos de manera segura
python3 << 'PYEOF'
import os
import glob
import subprocess
import sys

print("Analizando archivos problemáticos...")
print()

# Obtener lista de todos los archivos
try:
    result = subprocess.run(['ls', '-1'], capture_output=True, text=False)
    # Si ls devuelve datos binarios, lo manejamos como bytes
    if result.returncode == 0:
        output = result.stdout
        
        # Intentar decodificar línea por línea
        lines = output.split(b'\n')
        
        problematic_files = []
        normal_files = []
        
        for line in lines:
            if not line:  # línea vacía
                continue
                
            try:
                # Intentar decodificar como UTF-8
                filename = line.decode('utf-8', errors='strict')
                # Si contiene solo caracteres imprimibles ASCII, es normal
                if all(ord(c) >= 32 and ord(c) < 127 or c in '\t\n' for c in filename):
                    if '.' in filename or len(filename) > 3:  # probable archivo normal
                        normal_files.append(filename)
                    else:
                        problematic_files.append((line, filename))
                else:
                    problematic_files.append((line, filename))
            except UnicodeDecodeError:
                # Si no se puede decodificar, definitivamente es problemático
                problematic_files.append((line, "<no decodificable>"))
        
        print(f"Archivos normales encontrados: {len(normal_files)}")
        print(f"Archivos problemáticos encontrados: {len(problematic_files)}")
        print()
        
        if problematic_files:
            print("Analizando archivos problemáticos:")
            for i, (raw_bytes, decoded_name) in enumerate(problematic_files[:10]):  # Solo los primeros 10
                print(f"\n--- Archivo problemático {i+1} ---")
                print(f"Bytes raw (hex): {raw_bytes.hex()}")
                print(f"Tamaño raw: {len(raw_bytes)} bytes")
                
                # Intentar ver si el archivo existe y obtener su tamaño
                try:
                    # Usar los bytes raw para acceder al archivo
                    if os.path.exists(raw_bytes):
                        size = os.path.getsize(raw_bytes)
                        print(f"Tamaño del archivo: {size} bytes")
                        
                        # Si es pequeño, intentar leer contenido
                        if size < 1024 and size > 0:
                            try:
                                with open(raw_bytes, 'rb') as f:
                                    content = f.read()
                                print(f"Contenido (primeros 100 bytes hex): {content[:100].hex()}")
                                
                                # Intentar decodificar el contenido
                                try:
                                    text_content = content.decode('utf-8', errors='ignore')
                                    if text_content.strip():
                                        print(f"Contenido como texto: {text_content[:100]}")
                                except:
                                    pass
                            except Exception as e:
                                print(f"Error leyendo archivo: {e}")
                        elif size == 0:
                            print("Archivo vacío (0 bytes)")
                        else:
                            print(f"Archivo demasiado grande para analizar completamente")
                    else:
                        print("Archivo no accesible")
                except Exception as e:
                    print(f"Error analizando archivo: {e}")

except Exception as e:
    print(f"Error ejecutando ls: {e}")
    sys.exit(1)

PYEOF

