#!/bin/bash
# Script mejorado para extraer información de usuarios del backup de la base de datos
# Ejecutar en máquina externa

echo "📧 EXTRAYENDO INFORMACIÓN DE USUARIOS DEL BACKUP (VERSIÓN MEJORADA)"
echo "=================================================================="

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
echo "🔍 Analizando estructura del backup..."

# Buscar todos los patrones relacionados con user_entity
echo "📋 Buscando patrones de user_entity..."
grep -n -i "user_entity" "$BACKUP_SQL" > usuarios_extraidos/user_entity_patterns_$TIMESTAMP.txt

echo "✅ Patrones encontrados:"
cat usuarios_extraidos/user_entity_patterns_$TIMESTAMP.txt

echo ""
echo "🔍 Buscando datos específicos..."

# Buscar INSERT statements con diferentes patrones
echo "📋 Buscando INSERT statements..."
grep -A 50 -B 5 "INSERT INTO.*user_entity" "$BACKUP_SQL" > usuarios_extraidos/user_entity_inserts_$TIMESTAMP.txt

# Si no encuentra INSERT, buscar otros patrones
if [ ! -s "usuarios_extraidos/user_entity_inserts_$TIMESTAMP.txt" ]; then
    echo "⚠️ No se encontraron INSERT statements estándar"
    echo "🔍 Buscando patrones alternativos..."
    
    # Buscar LOCK TABLES y datos
    grep -A 100 "LOCK TABLES.*user_entity" "$BACKUP_SQL" > usuarios_extraidos/user_entity_lock_$TIMESTAMP.txt
    
    # Buscar cualquier línea que contenga emails (patrón común)
    grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" "$BACKUP_SQL" > usuarios_extraidos/emails_found_$TIMESTAMP.txt
    
    echo "📧 Emails encontrados en el backup:"
    head -10 usuarios_extraidos/emails_found_$TIMESTAMP.txt
fi

echo ""
echo "📝 Creando script Python mejorado para procesar datos..."

# Crear script Python más robusto
cat > usuarios_extraidos/extract_users.py << 'PYTHON_SCRIPT'
import re
import sys
import os

def extract_users_from_sql(sql_file):
    print("🔍 Leyendo archivo SQL...")
    
    try:
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}")
        return []
    
    users = []
    
    # Método 1: Buscar INSERT INTO user_entity VALUES
    print("📋 Método 1: Buscando INSERT statements...")
    insert_pattern = r"INSERT INTO `?user_entity`? VALUES\s*\((.*?)\);"
    matches = re.findall(insert_pattern, content, re.IGNORECASE | re.DOTALL)
    
    print(f"   Encontrados {len(matches)} INSERT statements")
    
    for match in matches:
        try:
            # Procesar cada INSERT
            user_data = parse_insert_values(match)
            if user_data:
                users.append(user_data)
        except Exception as e:
            print(f"   Error procesando INSERT: {e}")
    
    # Método 2: Buscar patrones de email directamente
    if not users:
        print("📧 Método 2: Buscando emails directamente...")
        email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
        emails = re.findall(email_pattern, content)
        
        print(f"   Encontrados {len(emails)} emails")
        
        # Para cada email, tratar de encontrar el contexto
        for email in set(emails):  # Eliminar duplicados
            try:
                # Buscar líneas que contengan este email
                lines_with_email = [line for line in content.split('\n') if email in line]
                for line in lines_with_email:
                    user_data = parse_line_with_email(line, email)
                    if user_data:
                        users.append(user_data)
                        break  # Solo tomar el primer match válido por email
            except Exception as e:
                print(f"   Error procesando email {email}: {e}")
    
    # Método 3: Buscar en secciones LOCK TABLES
    if not users:
        print("🔒 Método 3: Buscando en secciones LOCK TABLES...")
        lock_pattern = r"LOCK TABLES `?user_entity`? WRITE;(.*?)UNLOCK TABLES;"
        lock_matches = re.findall(lock_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for lock_content in lock_matches:
            # Buscar datos en esta sección
            lines = lock_content.split('\n')
            for line in lines:
                if '@' in line and not line.strip().startswith('--'):
                    user_data = parse_data_line(line)
                    if user_data:
                        users.append(user_data)
    
    return users

def parse_insert_values(values_str):
    """Parsear valores de un INSERT statement"""
    try:
        # Dividir por comas, respetando strings entre comillas
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        
        i = 0
        while i < len(values_str):
            char = values_str[i]
            
            if char in ["'", '"'] and not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char and in_quotes:
                in_quotes = False
                quote_char = None
            elif char == ',' and not in_quotes:
                values.append(current_value.strip().strip("'\""))
                current_value = ""
                i += 1
                continue
            
            current_value += char
            i += 1
        
        # Agregar último valor
        if current_value:
            values.append(current_value.strip().strip("'\""))
        
        # Intentar extraer campos (ajustar según estructura real)
        if len(values) >= 8:
            return {
                'dni': values[6] if len(values) > 6 else "N/A",
                'email': values[7] if len(values) > 7 else "N/A", 
                'first_name': values[8] if len(values) > 8 else "N/A",
                'last_name': values[9] if len(values) > 9 else "N/A",
                'created_at': values[3] if len(values) > 3 else "N/A"
            }
    except Exception as e:
        print(f"   Error parseando valores: {e}")
    
    return None

def parse_line_with_email(line, email):
    """Parsear una línea que contiene un email"""
    try:
        # Buscar patrones comunes alrededor del email
        # Esto es una heurística básica
        parts = line.split(',')
        
        email_index = -1
        for i, part in enumerate(parts):
            if email in part:
                email_index = i
                break
        
        if email_index >= 0 and len(parts) >= email_index + 3:
            return {
                'dni': parts[email_index - 1].strip().strip("'\"") if email_index > 0 else "N/A",
                'email': email,
                'first_name': parts[email_index + 1].strip().strip("'\"") if email_index + 1 < len(parts) else "N/A",
                'last_name': parts[email_index + 2].strip().strip("'\"") if email_index + 2 < len(parts) else "N/A",
                'created_at': "N/A"
            }
    except Exception as e:
        print(f"   Error parseando línea: {e}")
    
    return None

def parse_data_line(line):
    """Parsear una línea de datos general"""
    try:
        if '@' in line and ',' in line:
            # Buscar email en la línea
            email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', line)
            if email_match:
                email = email_match.group(1)
                return parse_line_with_email(line, email)
    except Exception as e:
        print(f"   Error parseando línea de datos: {e}")
    
    return None

# Ejecutar extracción
if __name__ == "__main__":
    sql_file = sys.argv[1] if len(sys.argv) > 1 else "BACKUP_ESTADO_ACTUAL/backup_20250806_225522/database/db_complete_20250806_225522.sql"
    timestamp = sys.argv[2] if len(sys.argv) > 2 else "default"
    
    users = extract_users_from_sql(sql_file)
    
    print(f"\n✅ Extracción completada: {len(users)} usuarios encontrados")
    
    if users:
        # Crear CSV
        csv_file = f"usuarios_extraidos/usuarios_completos_{timestamp}.csv"
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write("DNI,NOMBRE,APELLIDO,EMAIL,FECHA_CREACION\n")
            for user in users:
                f.write(f"{user['dni']},{user['first_name']},{user['last_name']},{user['email']},{user['created_at']}\n")
        
        # Crear archivo de emails
        emails_file = f"usuarios_extraidos/emails_usuarios_{timestamp}.txt"
        with open(emails_file, 'w', encoding='utf-8') as f:
            for user in users:
                if user['email'] != "N/A":
                    f.write(f"{user['email']}\n")
        
        print(f"📁 Archivos creados:")
        print(f"   - {csv_file}")
        print(f"   - {emails_file}")
        
        # Mostrar muestra
        print(f"\n👀 Muestra de usuarios:")
        for i, user in enumerate(users[:5]):
            print(f"   {i+1}. {user['first_name']} {user['last_name']} - {user['email']} (DNI: {user['dni']})")
    else:
        print("❌ No se pudieron extraer usuarios")
        print("🔍 Revisa los archivos de análisis generados para más información")

PYTHON_SCRIPT

echo "🐍 Ejecutando script Python mejorado..."
python usuarios_extraidos/extract_users.py "$BACKUP_SQL" "$TIMESTAMP"

echo ""
echo "📁 Archivos generados:"
ls -la usuarios_extraidos/

echo ""
echo "🎯 RESUMEN:"
if [ -f "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv" ]; then
    TOTAL_USUARIOS=$(wc -l < "usuarios_extraidos/usuarios_completos_$TIMESTAMP.csv")
    TOTAL_USUARIOS=$((TOTAL_USUARIOS - 1))  # Restar encabezado
    echo "✅ Usuarios extraídos: $TOTAL_USUARIOS"
    
    if [ $TOTAL_USUARIOS -gt 0 ]; then
        echo "📧 Primeros emails encontrados:"
        head -5 "usuarios_extraidos/emails_usuarios_$TIMESTAMP.txt"
    fi
else
    echo "⚠️ No se pudo crear el archivo de usuarios"
    echo "🔍 Revisa los archivos de análisis para diagnosticar el problema"
fi

echo ""
echo "💡 Si no se encontraron usuarios, revisa:"
echo "   - usuarios_extraidos/user_entity_patterns_$TIMESTAMP.txt"
echo "   - usuarios_extraidos/emails_found_$TIMESTAMP.txt"
echo "   - usuarios_extraidos/user_entity_inserts_$TIMESTAMP.txt"