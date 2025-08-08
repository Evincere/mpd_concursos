#!/usr/bin/env python3
"""
Corrección para María Florencia Berra
DNI correcto confirmado: 31643994
Actualizar DNI de 31633994 a 31643994 (coincide con username actual)
"""

import mysql.connector
import bcrypt
import secrets
import string
from datetime import datetime

def generate_temp_password(length=10):
    """Generar contraseña temporal segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%&"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def hash_password(password):
    """Hash de contraseña usando bcrypt"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def correct_user_dni():
    """Corregir DNI de María Florencia Berra"""
    
    # Configuración de BD
    config = {
        'host': 'localhost',
        'port': 3307,
        'user': 'root',
        'password': 'root1234',
        'database': 'mpd_concursos'
    }
    
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # Verificar estado actual
        cursor.execute("""
            SELECT id, dni, username, first_name, last_name, email 
            FROM user_entity 
            WHERE dni = '31633994' AND username = '31643994'
        """)
        user = cursor.fetchone()
        
        if not user:
            print("ERROR: Usuario no encontrado con los criterios esperados")
            return False
            
        user_id, dni_actual, username, first_name, last_name, email = user
        
        print("=== ESTADO ACTUAL ===")
        print(f"Usuario: {first_name} {last_name}")
        print(f"Email: {email}")
        print(f"DNI actual: {dni_actual}")
        print(f"Username: {username}")
        print(f"DNI correcto reportado: 31643994")
        
        # Generar nueva contraseña temporal
        temp_password = generate_temp_password()
        hashed_password = hash_password(temp_password)
        
        print(f"\n=== CORRECCIÓN A APLICAR ===")
        print(f"Cambiar DNI: {dni_actual} → 31643994")
        print(f"Username permanece: {username} (ya correcto)")
        print(f"Nueva contraseña temporal: {temp_password}")
        
        # Ejecutar corrección
        cursor.execute("""
            UPDATE user_entity 
            SET dni = '31643994', password = %s 
            WHERE id = %s
        """, (hashed_password, user_id))
        
        # Registrar en audit_logs
        cursor.execute("""
            INSERT INTO audit_logs (event_type, username, description, timestamp, outcome) 
            VALUES ('USER_UPDATED', '31643994', 'Corrección DNI de 31633994 a 31643994 + reset contraseña', NOW(), 'SUCCESS')
        """)
        
        cursor.execute("""
            INSERT INTO audit_logs (event_type, username, description, timestamp, outcome) 
            VALUES ('PASSWORD_RESET_SUCCESS', '31643994', 'Contraseña temporal generada por corrección DNI', NOW(), 'SUCCESS')
        """)
        
        conn.commit()
        
        # Verificar corrección
        cursor.execute("""
            SELECT dni, username, first_name, last_name 
            FROM user_entity 
            WHERE id = %s
        """, (user_id,))
        updated_user = cursor.fetchone()
        
        print(f"\n=== CORRECCIÓN COMPLETADA ===")
        print(f"DNI corregido: {updated_user[0]}")
        print(f"Username: {updated_user[1]}")
        print(f"Usuario: {updated_user[2]} {updated_user[3]}")
        print(f"\n✅ CONTRASEÑA TEMPORAL: {temp_password}")
        print("⚠️  Comunicar esta contraseña a la usuaria de forma segura")
        print("⚠️  La usuaria debe cambiarla en su primer login")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"ERROR de BD: {e}")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    success = correct_user_dni()
    if success:
        print(f"\n🎯 RESOLUCIÓN EXITOSA")
        print(f"La usuaria ahora puede usar:")
        print(f"Username: 31643994")
        print(f"Contraseña: [temporal proporcionada arriba]")
    else:
        print(f"\n❌ ERROR EN LA RESOLUCIÓN")
