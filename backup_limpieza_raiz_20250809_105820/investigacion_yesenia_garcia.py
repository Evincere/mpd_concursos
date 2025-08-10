import mysql.connector
import json
from datetime import datetime

# Configuración de la base de datos
db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

def investigar_usuario_yesenia():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("=" * 80)
        print("INVESTIGACIÓN: YESENIA GARCÍA - DNI: 31486747")
        print("Email reportado: yeseniagarciamurcia@gamil.com")  # Nota: dice 'gamil' en lugar de 'gmail'
        print("Usuario reportado: yeseniagarcia")
        print("Fecha del problema: Miércoles 06 de agosto")
        print("=" * 80)
        
        # 1. Buscar por email exacto
        print("\n1. BÚSQUEDA POR EMAIL EXACTO:")
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at, updated_at
            FROM users 
            WHERE email = %s
        """, ('yeseniagarciamurcia@gamil.com',))
        
        resultados_email = cursor.fetchall()
        if resultados_email:
            for usuario in resultados_email:
                print(f"   ID: {usuario['id']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['nombre']} {usuario['apellido']}")
                print(f"   Habilitado: {usuario['enabled']}")
                print(f"   Creado: {usuario['created_at']}")
                print(f"   Actualizado: {usuario['updated_at']}")
        else:
            print("   No se encontró usuario con este email exacto")
        
        # 2. Buscar por DNI
        print("\n2. BÚSQUEDA POR DNI (31486747):")
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at, updated_at
            FROM users 
            WHERE dni = %s
        """, ('31486747',))
        
        resultados_dni = cursor.fetchall()
        if resultados_dni:
            for usuario in resultados_dni:
                print(f"   ID: {usuario['id']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['nombre']} {usuario['apellido']}")
                print(f"   Habilitado: {usuario['enabled']}")
                print(f"   Creado: {usuario['created_at']}")
                print(f"   Actualizado: {usuario['updated_at']}")
        else:
            print("   No se encontró usuario con este DNI")
            
        # 3. Buscar por username
        print("\n3. BÚSQUEDA POR USERNAME (yeseniagarcia):")
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at, updated_at
            FROM users 
            WHERE username = %s
        """, ('yeseniagarcia',))
        
        resultados_username = cursor.fetchall()
        if resultados_username:
            for usuario in resultados_username:
                print(f"   ID: {usuario['id']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['nombre']} {usuario['apellido']}")
                print(f"   Habilitado: {usuario['enabled']}")
                print(f"   Creado: {usuario['created_at']}")
                print(f"   Actualizado: {usuario['updated_at']}")
        else:
            print("   No se encontró usuario con este username")
            
        # 4. Buscar emails similares (posible error tipográfico)
        print("\n4. BÚSQUEDA DE EMAILS SIMILARES (gmail vs gamil):")
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at, updated_at
            FROM users 
            WHERE email LIKE %s OR email LIKE %s
        """, ('%yeseniagarciamurcia%gmail%', '%yeseniagarcia%'))
        
        resultados_similares = cursor.fetchall()
        if resultados_similares:
            for usuario in resultados_similares:
                print(f"   ID: {usuario['id']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['nombre']} {usuario['apellido']}")
                print(f"   Habilitado: {usuario['enabled']}")
                print(f"   Creado: {usuario['created_at']}")
                print(f"   Actualizado: {usuario['updated_at']}")
        else:
            print("   No se encontraron emails similares")
            
        # 5. Buscar por nombre y apellido
        print("\n5. BÚSQUEDA POR NOMBRE 'YESENIA GARCIA':")
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at, updated_at
            FROM users 
            WHERE UPPER(nombre) LIKE %s AND UPPER(apellido) LIKE %s
        """, ('%YESENIA%', '%GARCIA%'))
        
        resultados_nombre = cursor.fetchall()
        if resultados_nombre:
            for usuario in resultados_nombre:
                print(f"   ID: {usuario['id']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['nombre']} {usuario['apellido']}")
                print(f"   Habilitado: {usuario['enabled']}")
                print(f"   Creado: {usuario['created_at']}")
                print(f"   Actualizado: {usuario['updated_at']}")
        else:
            print("   No se encontraron usuarios con el nombre Yesenia Garcia")
            
        # 6. Verificar registros duplicados o conflictivos
        print("\n6. ANÁLISIS DE POSIBLES DUPLICADOS:")
        
        # Buscar todos los emails que contengan 'yesenia'
        cursor.execute("""
            SELECT id, email, username, dni, nombre, apellido, enabled, created_at
            FROM users 
            WHERE LOWER(email) LIKE %s OR LOWER(username) LIKE %s OR LOWER(nombre) LIKE %s
            ORDER BY created_at DESC
        """, ('%yesenia%', '%yesenia%', '%yesenia%'))
        
        todos_yesenia = cursor.fetchall()
        if todos_yesenia:
            print(f"   Se encontraron {len(todos_yesenia)} registros relacionados con 'Yesenia':")
            for i, usuario in enumerate(todos_yesenia, 1):
                print(f"   {i}. ID: {usuario['id']} | Email: {usuario['email']} | DNI: {usuario['dni']} | Creado: {usuario['created_at']}")
        
        # 7. Verificar intentos de login recientes
        print("\n7. VERIFICACIÓN DE LOGS DE AUTENTICACIÓN (si existen):")
        try:
            cursor.execute("SHOW TABLES LIKE 'login_attempts'")
            if cursor.fetchone():
                cursor.execute("""
                    SELECT * FROM login_attempts 
                    WHERE email = %s OR email LIKE %s
                    ORDER BY attempt_time DESC LIMIT 10
                """, ('yeseniagarciamurcia@gamil.com', '%yesenia%'))
                login_attempts = cursor.fetchall()
                if login_attempts:
                    for attempt in login_attempts:
                        print(f"   - {attempt}")
                else:
                    print("   No se encontraron intentos de login para este email")
            else:
                print("   Tabla de intentos de login no existe")
        except Exception as e:
            print(f"   Error al verificar logs de login: {e}")
            
        # 8. Verificar tabla de audit logs si existe
        print("\n8. VERIFICACIÓN DE AUDIT LOGS:")
        try:
            cursor.execute("SHOW TABLES LIKE 'audit_log'")
            if cursor.fetchone():
                cursor.execute("""
                    SELECT * FROM audit_log 
                    WHERE entity_id IN (SELECT id FROM users WHERE dni = %s OR email = %s)
                    ORDER BY created_at DESC LIMIT 5
                """, ('31486747', 'yeseniagarciamurcia@gamil.com'))
                audit_logs = cursor.fetchall()
                if audit_logs:
                    for log in audit_logs:
                        print(f"   - {log}")
                else:
                    print("   No se encontraron audit logs para este usuario")
            else:
                print("   Tabla de audit logs no existe")
        except Exception as e:
            print(f"   Error al verificar audit logs: {e}")
            
        print("\n" + "=" * 80)
        print("RESUMEN DE HALLAZGOS:")
        print("=" * 80)
        
        total_encontrados = len(resultados_email) + len(resultados_dni) + len(resultados_username) + len(resultados_similares) + len(resultados_nombre)
        
        if total_encontrados == 0:
            print("❌ No se encontró ningún usuario que coincida con los datos proporcionados")
            print("   - Email: yeseniagarciamurcia@gamil.com (verifique si es 'gmail' en lugar de 'gamil')")
            print("   - DNI: 31486747")
            print("   - Username: yeseniagarcia")
            print("\nPOSIBLES CAUSAS:")
            print("1. Error tipográfico en el email ('gamil' vs 'gmail')")
            print("2. El usuario nunca se registró exitosamente")
            print("3. El usuario fue eliminado del sistema")
            print("4. Los datos proporcionados no son correctos")
        else:
            print(f"✅ Se encontraron {total_encontrados} coincidencia(s)")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error en la investigación: {e}")

if __name__ == "__main__":
    investigar_usuario_yesenia()
