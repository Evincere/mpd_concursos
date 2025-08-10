#!/usr/bin/env python3
"""
Script de resolución para el caso de María Florencia Berra
DNI reportado: 31634994
DNI en BD: 31633994  
Username en BD: 31643994
"""

import mysql.connector
import bcrypt
import secrets
import string

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

def resolve_user_issue():
    """Resolver el problema de María Florencia Berra"""
    
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
        
        # Verificar usuario actual
        cursor.execute("""
            SELECT id, dni, username, first_name, last_name, email, password 
            FROM user_entity 
            WHERE dni = '31633994'
        """)
        user = cursor.fetchone()
        
        if not user:
            print("ERROR: Usuario no encontrado")
            return
            
        user_id, dni, username, first_name, last_name, email, current_password = user
        
        print(f"Usuario encontrado:")
        print(f"ID: {user_id}")
        print(f"Nombre: {first_name} {last_name}")
        print(f"DNI actual: {dni}")
        print(f"Username actual: {username}")
        print(f"Email: {email}")
        
        # OPCIÓN 1: Actualizar DNI para que coincida con username
        print("\n=== OPCIÓN 1: Actualizar DNI ===")
        print(f"Cambiar DNI de {dni} a {username}")
        
        # OPCIÓN 2: Actualizar username para que coincida con DNI  
        print("\n=== OPCIÓN 2: Actualizar Username ===")
        print(f"Cambiar Username de {username} a {dni}")
        
        # OPCIÓN 3: Usar DNI reportado por usuario
        print("\n=== OPCIÓN 3: Usar DNI reportado ===")
        print(f"Cambiar DNI de {dni} a 31634994")
        print(f"Cambiar Username de {username} a 31634994")
        
        # Generar nueva contraseña temporal
        temp_password = generate_temp_password()
        hashed_password = hash_password(temp_password)
        
        print(f"\n=== CONTRASEÑA TEMPORAL ===")
        print(f"Nueva contraseña temporal: {temp_password}")
        print("(Se debe comunicar a la usuaria de forma segura)")
        
        # Para este ejemplo, no ejecutamos las actualizaciones
        # Se debe confirmar con la usuaria cuál es su DNI correcto
        
        print(f"\n=== SQL PARA RESOLVER ===")
        print("-- OPCIÓN 1: Actualizar DNI")
        print(f"UPDATE user_entity SET dni = '{username}', password = '{hashed_password}' WHERE id = '{user_id}';")
        
        print("\n-- OPCIÓN 2: Actualizar Username")  
        print(f"UPDATE user_entity SET username = '{dni}', password = '{hashed_password}' WHERE id = '{user_id}';")
        
        print("\n-- OPCIÓN 3: Usar DNI reportado")
        print(f"UPDATE user_entity SET dni = '31634994', username = '31634994', password = '{hashed_password}' WHERE id = '{user_id}';")
        
        print(f"\n=== REGISTRO DE AUDITORÍA ===")
        print(f"INSERT INTO audit_logs (event_type, username, description, timestamp, outcome) VALUES")
        print(f"('PASSWORD_RESET_SUCCESS', '{username}', 'Reset de contraseña por discrepancia DNI/Username', NOW(), 'SUCCESS');")
        
    except mysql.connector.Error as e:
        print(f"Error de BD: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    resolve_user_issue()
