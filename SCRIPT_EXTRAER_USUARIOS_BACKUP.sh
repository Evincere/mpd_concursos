#!/bin/bash
# Script para extraer información de usuarios del backup de la base de datos
# Ejecutar en máquina externa

echo "📧 EXTRAYENDO INFORMACIÓN DE USUARIOS DEL BACKUP"
echo "================================================"

# Verificar que existe el backup
BACKUP_SQL="BACKUP_ESTADO_ACTUAL/backup_20250806_225522/database/db_complete_20250806_225522.sql"

if [ ! -f "$BACKUP_SQL" ]; then
    echo "❌ Error: No se encontró el archivo de backup de la base de datos"
    echo "Esperado en: $BACKUP_SQL"
    exit 1
fi

echo "✅ Archivo de backup encontrado: $BACKUP_SQL"
echo "📊 Tamaño del archivo: $(du -sh "$BACKUP_SQL" | cut -f1)"

# Crear directorio de salida
mkdir -p usuarios_extraidos
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "🔍 Extrayendo datos de usuarios..."

# Extraer los INSERT statements de user_entity
echo "📋 Buscando registros de usuarios..."
grep -A 1000 "INSERT INTO \`user_entity\`" "$BACKUP_SQL" | head -1000 > usuarios_extraidos/user_entity_raw_$TIMESTAMP.sql

# Verificar si encontramos datos
if [ ! -s "usuarios_extraidos/user_entity_raw_$TIMESTAMP.sql" ]; then
    echo "⚠️ No se encontraron registros INSERT para user_entity"
    echo "🔍 Buscando patrones alternativos..."
    
    # Buscar otros patrones posibles
    grep -i "user_entity" "$BACKUP_SQL" | head -10
    exit 1
fi

echo "✅ Datos de usuarios extraídos"

# Procesar los datos para crear CSV
echo ""
echo "📝 Procesando datos para crear CSV..."

# Crear archivo CSV con encabezados
echo "DNI,NOMBRE,APELLIDO,EMAIL,FECHA_CREACION" > usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv

# Procesar los INSERT statements
# Nota: Este es un procesamiento básico, puede necesitar ajustes según el formato exacto
python3 << 'EOF'
import re
import sys
from datetime import datetime

# Leer el archivo SQL
with open('usuarios_extraidos/user_entity_raw_' + sys.argv[1] + '.sql', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Buscar patrones de INSERT
insert_pattern = r"INSERT INTO `user_entity` VALUES \((.*?)\);"
matches = re.findall(insert_pattern, content, re.DOTALL)

users_data = []
for match in matches:
    # Dividir por comas, pero cuidando las comas dentro de strings
    # Esto es una aproximación simple
    values = []
    current_value = ""
    in_quotes = False
    
    for char in match:
        if char == "'" and not in_quotes:
            in_quotes = True
        elif char == "'" and in_quotes:
            in_quotes = False
        elif char == "," and not in_quotes:
            values.append(current_value.strip().strip("'"))
            current_value = ""
            continue
        current_value += char
    
    # Agregar el último valor
    if current_value:
        values.append(current_value.strip().strip("'"))
    
    # Extraer campos relevantes (ajustar índices según estructura real)
    if len(values) >= 10:  # Asegurar que tenemos suficientes campos
        try:
            # Basado en la estructura: id, birth_date, country, created_at, cuit, direccion, dni, email, first_name, last_name, ...
            dni = values[6] if len(values) > 6 else "N/A"
            email = values[7] if len(values) > 7 else "N/A"
            first_name = values[8] if len(values) > 8 else "N/A"
            last_name = values[9] if len(values) > 9 else "N/A"
            created_at = values[3] if len(values) > 3 else "N/A"
            
            users_data.append({
                'dni': dni,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'created_at': created_at
            })
        except Exception as e:
            print(f"Error procesando registro: {e}")
            continue

# Escribir CSV
with open('usuarios_extraidos/usuarios_completos_' + sys.argv[1] + '.csv', 'w', encoding='utf-8') as f:
    f.write("DNI,NOMBRE,APELLIDO,EMAIL,FECHA_CREACION\n")
    for user in users_data:
        f.write(f"{user['dni']},{user['first_name']},{user['last_name']},{user['email']},{user['created_at']}\n")

print(f"✅ Procesados {len(users_data)} usuarios")
EOF

# Ejecutar el script Python
python3 -c "
import sys
sys.argv = ['', '$TIMESTAMP']
exec(open('/dev/stdin').read())
" < /dev/null

# Verificar resultado
if [ -f "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv" ]; then
    TOTAL_USUARIOS=$(wc -l < "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv")
    TOTAL_USUARIOS=$((TOTAL_USUARIOS - 1))  # Restar encabezado
    
    echo "✅ CSV creado exitosamente"
    echo "📊 Total usuarios extraídos: $TOTAL_USUARIOS"
    echo "📁 Archivo: usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv"
    
    # Mostrar primeros registros
    echo ""
    echo "👀 Primeros 5 registros:"
    head -6 "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv"
    
    # Crear también un archivo solo con emails
    echo ""
    echo "📧 Creando archivo solo con emails..."
    tail -n +2 "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv" | cut -d',' -f4 > "usuarios_extraidos/emails_usuarios_$TIMESTAMP.txt"
    
    echo "✅ Archivo de emails creado: usuarios_extraidos/emails_usuarios_$TIMESTAMP.txt"
    echo "📊 Total emails: $(wc -l < "usuarios_extraidos/emails_usuarios_$TIMESTAMP.txt")"
    
else
    echo "❌ Error: No se pudo crear el archivo CSV"
fi

echo ""
echo "📁 Archivos generados en: usuarios_extraidos/"
ls -la usuarios_extraidos/

echo ""
echo "🎯 ARCHIVOS LISTOS PARA USO:"
echo "   - usuarios_completos_$TIMESTAMP.csv (información completa)"
echo "   - emails_usuarios_$TIMESTAMP.txt (solo emails)"
echo ""
echo "💡 Puedes usar estos archivos para:"
echo "   - Contactar usuarios afectados"
echo "   - Análisis de recuperación por usuario"
echo "   - Validación de datos recuperados"