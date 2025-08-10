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
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
            FROM user_entity 
            WHERE email = %s
        """, ('yeseniagarciamurcia@gamil.com',))
        
        resultados_email = cursor.fetchall()
        if resultados_email:
            for usuario in resultados_email:
                print(f"   ID: {usuario['id_hex']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
                print(f"   Estado: {usuario['status']}")
                print(f"   CUIT: {usuario['cuit']}")
                print(f"   Creado: {usuario['created_at']}")
        else:
            print("   No se encontró usuario con este email exacto")
        
        # 2. Buscar por DNI
        print("\n2. BÚSQUEDA POR DNI (31486747):")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
            FROM user_entity 
            WHERE dni = %s
        """, ('31486747',))
        
        resultados_dni = cursor.fetchall()
        if resultados_dni:
            for usuario in resultados_dni:
                print(f"   ID: {usuario['id_hex']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
                print(f"   Estado: {usuario['status']}")
                print(f"   CUIT: {usuario['cuit']}")
                print(f"   Creado: {usuario['created_at']}")
        else:
            print("   No se encontró usuario con este DNI")
            
        # 3. Buscar por username
        print("\n3. BÚSQUEDA POR USERNAME (yeseniagarcia):")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
            FROM user_entity 
            WHERE username = %s
        """, ('yeseniagarcia',))
        
        resultados_username = cursor.fetchall()
        if resultados_username:
            for usuario in resultados_username:
                print(f"   ID: {usuario['id_hex']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
                print(f"   Estado: {usuario['status']}")
                print(f"   CUIT: {usuario['cuit']}")
                print(f"   Creado: {usuario['created_at']}")
        else:
            print("   No se encontró usuario con este username")
            
        # 4. Buscar emails similares (posible error tipográfico)
        print("\n4. BÚSQUEDA DE EMAILS SIMILARES (gmail vs gamil):")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
            FROM user_entity 
            WHERE email LIKE %s OR email LIKE %s
        """, ('%yeseniagarciamurcia%gmail%', '%yeseniagarcia%'))
        
        resultados_similares = cursor.fetchall()
        if resultados_similares:
            for usuario in resultados_similares:
                print(f"   ID: {usuario['id_hex']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
                print(f"   Estado: {usuario['status']}")
                print(f"   CUIT: {usuario['cuit']}")
                print(f"   Creado: {usuario['created_at']}")
        else:
            print("   No se encontraron emails similares")
            
        # 5. Buscar por nombre y apellido
        print("\n5. BÚSQUEDA POR NOMBRE 'YESENIA GARCIA':")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
            FROM user_entity 
            WHERE UPPER(first_name) LIKE %s AND UPPER(last_name) LIKE %s
        """, ('%YESENIA%', '%GARCIA%'))
        
        resultados_nombre = cursor.fetchall()
        if resultados_nombre:
            for usuario in resultados_nombre:
                print(f"   ID: {usuario['id_hex']}")
                print(f"   Email: {usuario['email']}")
                print(f"   Username: {usuario['username']}")
                print(f"   DNI: {usuario['dni']}")
                print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
                print(f"   Estado: {usuario['status']}")
                print(f"   CUIT: {usuario['cuit']}")
                print(f"   Creado: {usuario['created_at']}")
        else:
            print("   No se encontraron usuarios con el nombre Yesenia Garcia")
            
        # 6. Verificar registros duplicados o conflictivos
        print("\n6. ANÁLISIS DE POSIBLES DUPLICADOS:")
        
        # Buscar todos los registros que contengan 'yesenia'
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at
            FROM user_entity 
            WHERE LOWER(email) LIKE %s OR LOWER(username) LIKE %s OR LOWER(first_name) LIKE %s
            ORDER BY created_at DESC
        """, ('%yesenia%', '%yesenia%', '%yesenia%'))
        
        todos_yesenia = cursor.fetchall()
        if todos_yesenia:
            print(f"   Se encontraron {len(todos_yesenia)} registros relacionados con 'Yesenia':")
            for i, usuario in enumerate(todos_yesenia, 1):
                print(f"   {i}. Email: {usuario['email']} | DNI: {usuario['dni']} | Estado: {usuario['status']} | Creado: {usuario['created_at']}")
        
        # 7. Verificar inscripciones relacionadas
        print("\n7. VERIFICACIÓN DE INSCRIPCIONES RELACIONADAS:")
        if resultados_dni or resultados_email or resultados_username:
            # Si encontramos algún usuario, verificar sus inscripciones
            user_ids = []
            if resultados_dni:
                user_ids.extend([bytes.fromhex(u['id_hex']) for u in resultados_dni])
            if resultados_email:
                user_ids.extend([bytes.fromhex(u['id_hex']) for u in resultados_email])
            if resultados_username:
                user_ids.extend([bytes.fromhex(u['id_hex']) for u in resultados_username])
                
            user_ids = list(set(user_ids))  # Eliminar duplicados
            
            for user_id in user_ids:
                cursor.execute("""
                    SELECT i.id, i.created_at, c.name as contest_name, i.status
                    FROM inscriptions i
                    JOIN contests c ON i.contest_id = c.id
                    WHERE i.user_id = %s
                    ORDER BY i.created_at DESC
                """, (user_id,))
                inscripciones = cursor.fetchall()
                if inscripciones:
                    print(f"   Inscripciones para user_id {user_id.hex().upper()}:")
                    for insc in inscripciones:
                        print(f"     - Concurso: {insc['contest_name']} | Estado: {insc['status']} | Fecha: {insc['created_at']}")
        
        # 8. Verificar audit logs relacionados
        print("\n8. VERIFICACIÓN DE AUDIT LOGS:")
        try:
            # Buscar en audit_logs por DNI o email
            cursor.execute("""
                SELECT * FROM audit_logs 
                WHERE (details LIKE %s OR details LIKE %s OR details LIKE %s)
                ORDER BY timestamp DESC LIMIT 10
            """, ('%31486747%', '%yeseniagarciamurcia%', '%yeseniagarcia%'))
            audit_logs = cursor.fetchall()
            if audit_logs:
                print("   Audit logs relacionados:")
                for log in audit_logs:
                    print(f"   - {log['timestamp']}: {log['action']} | {log['details']}")
            else:
                print("   No se encontraron audit logs relacionados")
        except Exception as e:
            print(f"   Error al verificar audit logs: {e}")
            
        print("\n" + "=" * 80)
        print("RESUMEN DE HALLAZGOS:")
        print("=" * 80)
        
        total_encontrados = len(resultados_email) + len(resultados_dni) + len(resultados_username) + len(resultados_similares) + len(resultados_nombre)
        
        if total_encontrados == 0:
            print("❌ No se encontró ningún usuario que coincida con los datos proporcionados")
            print("   - Email: yeseniagarciamurcia@gamil.com (⚠️  POSIBLE ERROR: 'gamil' en lugar de 'gmail')")
            print("   - DNI: 31486747")
            print("   - Username: yeseniagarcia")
            print("\n🔍 POSIBLES CAUSAS:")
            print("1. ❗ Error tipográfico en el email ('gamil' vs 'gmail')")
            print("2. 📝 El usuario nunca completó el proceso de registro")
            print("3. 🗑️  El usuario fue eliminado del sistema")
            print("4. ❓ Los datos proporcionados no son correctos")
            print("5. 🔄 Problema en el proceso de registro que quedó incompleto")
        else:
            print(f"✅ Se encontraron {total_encontrados} coincidencia(s)")
            
        # Recomendaciones específicas
        print("\n📋 ACCIONES RECOMENDADAS:")
        if total_encontrados == 0:
            print("1. Verificar si el email correcto es 'yeseniagarciamurcia@gmail.com' (con 'gmail')")
            print("2. Solicitar a la usuaria que verifique sus datos de registro")
            print("3. Revisar logs del sistema para el período del 6 de agosto")
            print("4. Verificar si hay registros parciales o fallidos en esas fechas")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error en la investigación: {e}")

if __name__ == "__main__":
    investigar_usuario_yesenia()
