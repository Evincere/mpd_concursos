#!/usr/bin/env python3
import bcrypt
import secrets
import string

def generate_temp_password(length=12):
    """Genera una contraseña temporal segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def hash_password(password):
    """Genera hash bcrypt de la contraseña"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# Generar contraseña temporal
temp_password = "TempMPD2025!"
print(f"Contraseña temporal: {temp_password}")

# Generar hash bcrypt
hashed_password = hash_password(temp_password)
print(f"Hash bcrypt: {hashed_password}")

# Verificar que el hash funciona
if bcrypt.checkpw(temp_password.encode('utf-8'), hashed_password.encode('utf-8')):
    print("✅ Verificación de hash exitosa")
else:
    print("❌ Error en verificación de hash")
