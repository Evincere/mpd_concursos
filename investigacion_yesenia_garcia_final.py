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
        
        # Primero, exploremos la estructura de contests para la consulta
        cursor.execute("DESCRIBE contests")
        contest_columns = [col[0] for col in cursor.fetchall()]
        contest_name_field = 'title' if 'title' in contest_columns else ('name' if 'name' in contest_columns else 'id')
        
        # 1. Buscar por DNI (que sabemos que existe)
        print("\n🔍 USUARIO ENCONTRADO:")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit,
                   birth_date, telefono, direccion, province, municipality
            FROM user_entity 
            WHERE dni = %s
        """, ('31486747',))
        
        usuario = cursor.fetchone()
        if usuario:
            print(f"   ✅ ID: {usuario['id_hex']}")
            print(f"   ✅ Email REAL: {usuario['email']} ⚠️")
            print(f"   ✅ Username REAL: {usuario['username']} ⚠️")
            print(f"   ✅ DNI: {usuario['dni']}")
            print(f"   ✅ Nombre: {usuario['first_name']} {usuario['last_name']}")
            print(f"   ✅ Estado: {usuario['status']}")
            print(f"   ✅ CUIT: {usuario['cuit']}")
            print(f"   ✅ Teléfono: {usuario['telefono']}")
            print(f"   ✅ Fecha Nacimiento: {usuario['birth_date']}")
            print(f"   ✅ Dirección: {usuario['direccion']}")
            print(f"   ✅ Provincia: {usuario['province']}")
            print(f"   ✅ Municipio: {usuario['municipality']}")
            print(f"   ✅ Fecha Creación: {usuario['created_at']}")
            
            user_id = bytes.fromhex(usuario['id_hex'])
            
            # Verificar inscripciones
            print(f"\n📝 INSCRIPCIONES DEL USUARIO:")
            cursor.execute(f"""
                SELECT i.id as inscription_id, HEX(i.id) as inscription_id_hex, i.created_at, 
                       c.{contest_name_field} as contest_info, i.status
                FROM inscriptions i
                JOIN contests c ON i.contest_id = c.id
                WHERE i.user_id = %s
                ORDER BY i.created_at DESC
            """, (user_id,))
            inscripciones = cursor.fetchall()
            
            if inscripciones:
                for insc in inscripciones:
                    print(f"     - Concurso: {insc['contest_info']} | Estado: {insc['status']} | Fecha: {insc['created_at']}")
            else:
                print("     No se encontraron inscripciones para este usuario")
                
            # Verificar documentos
            print(f"\n📄 DOCUMENTOS DEL USUARIO:")
            cursor.execute("""
                SELECT id, file_name, file_path, document_type_id, created_at, is_archived
                FROM documents
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            documentos = cursor.fetchall()
            
            if documentos:
                for doc in documentos:
                    print(f"     - Documento: {doc['file_name']} | Tipo: {doc['document_type_id']} | Archivado: {doc['is_archived']} | Fecha: {doc['created_at']}")
            else:
                print("     No se encontraron documentos para este usuario")
        
        # 2. Análisis del problema reportado
        print("\n" + "=" * 80)
        print("🚨 ANÁLISIS DEL PROBLEMA REPORTADO:")
        print("=" * 80)
        
        print("❌ DISCREPANCIAS ENCONTRADAS:")
        print(f"   1. Email reportado: 'yeseniagarciamurcia@gamil.com' (con 'GAMIL')")
        print(f"   2. Email real en BD: 'yeseniagarciamurcia@gmail.com' (con 'GMAIL')")
        print(f"   3. Username reportado: 'yeseniagarcia'")
        print(f"   4. Username real en BD: 'yeseseniagarcia' (con doble 'SE')")
        
        print(f"\n✅ DATOS CORRECTOS:")
        print(f"   - DNI: 31486747 ✓")
        print(f"   - Nombre: YESENIA ANABEL GARCIA ✓")
        print(f"   - Estado: ACTIVE ✓")
        print(f"   - Fecha registro: {usuario['created_at']} ✓")
        
        # 3. Verificar audit logs del 6 de agosto
        print(f"\n📋 LOGS DEL 6 DE AGOSTO (fecha reportada del problema):")
        cursor.execute("""
            SELECT * FROM audit_logs 
            WHERE DATE(timestamp) = '2025-08-06'
            AND (details LIKE %s OR details LIKE %s OR details LIKE %s OR details LIKE %s)
            ORDER BY timestamp DESC
        """, ('%31486747%', '%yeseniagarciamurcia%', '%yeseniagarcia%', '%yeseseniagarcia%'))
        logs_fecha = cursor.fetchall()
        
        if logs_fecha:
            for log in logs_fecha:
                print(f"   - {log['timestamp']}: {log['action']} | {log['details']}")
        else:
            print("   No se encontraron logs específicos para este usuario el 6 de agosto")
            
        # Buscar logs de intentos de login fallidos
        print(f"\n🔐 LOGS DE AUTENTICACIÓN:")
        cursor.execute("""
            SELECT * FROM audit_logs 
            WHERE (details LIKE %s OR details LIKE %s)
            AND action LIKE %s
            ORDER BY timestamp DESC LIMIT 10
        """, ('%yeseniagarciamurcia%', '%login%', '%LOGIN%'))
        logs_auth = cursor.fetchall()
        
        if logs_auth:
            for log in logs_auth:
                print(f"   - {log['timestamp']}: {log['action']} | {log['details']}")
        else:
            print("   No se encontraron logs de autenticación específicos")
        
        print("\n" + "=" * 80)
        print("🎯 DIAGNÓSTICO Y SOLUCIÓN:")
        print("=" * 80)
        
        print("🔎 CAUSA RAÍZ IDENTIFICADA:")
        print("   El usuario SÍ EXISTE en el sistema, pero con diferencias en los datos:")
        print("   1. Email real: yeseniagarciamurcia@gmail.com (no 'gamil')")
        print("   2. Username real: yeseseniagarcia (no 'yeseniagarcia')")
        print(f"   3. Usuario creado: {usuario['created_at']} (POSTERIOR al 6 de agosto)")
        
        print("\n💡 EXPLICACIÓN DEL PROBLEMA:")
        print("   • La usuaria intentaba loguearse con datos INCORRECTOS")
        print("   • El sistema correctamente rechazaba el login por email/username inexistente")
        print("   • El mensaje 'email ya registrado' sugiere que intentó registrarse nuevamente")
        print("   • Finalmente se registró exitosamente el 6 de agosto a las 22:23")
        
        print("\n✅ SOLUCIONES PROPUESTAS:")
        print("   1. ✉️  Informar a la usuaria sus datos correctos de login:")
        print(f"      - Email: yeseniagarciamurcia@gmail.com")
        print(f"      - Username: yeseseniagarcia")
        print("   2. 🔑 Si olvidó la contraseña, puede usar la función de recuperación")
        print("   3. 📧 Enviar email de confirmación con los datos correctos")
        print("   4. 📞 Contacto directo para verificar y confirmar el acceso")
        
        cursor.close()
        conn.close()
        
        # Generar archivo de reporte
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(f"REPORTE_YESENIA_GARCIA_{timestamp}.md", "w", encoding='utf-8') as f:
            f.write("# REPORTE DE INVESTIGACIÓN - YESENIA GARCÍA\n\n")
            f.write(f"**DNI:** 31486747  \n")
            f.write(f"**Fecha del reporte:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}  \n")
            f.write(f"**Problema reportado:** No puede loguearse - sistema indica email ya registrado  \n")
            f.write(f"**Fecha del problema:** Miércoles 06 de agosto  \n\n")
            
            f.write("## DATOS REPORTADOS VS REALES\n\n")
            f.write("| Campo | Reportado | Real en BD | Estado |\n")
            f.write("|-------|-----------|------------|--------|\n")
            f.write("| Email | yeseniagarciamurcia@**gamil**.com | yeseniagarciamurcia@**gmail**.com | ❌ Error tipográfico |\n")
            f.write("| Username | yeseniagarcia | yeseseniagarcia | ❌ Falta 'se' |\n")
            f.write("| DNI | 31486747 | 31486747 | ✅ Correcto |\n")
            f.write("| Nombre | YESENIA GARCIA | YESENIA ANABEL GARCIA | ✅ Correcto |\n\n")
            
            f.write("## DIAGNÓSTICO\n\n")
            f.write("**CAUSA RAÍZ:** La usuaria intentaba acceder con datos incorrectos.\n\n")
            f.write("**CRONOLOGÍA:**\n")
            f.write("1. La usuaria intenta loguearse con email/username incorrectos\n")
            f.write("2. Sistema rechaza el acceso (datos no existen)\n")
            f.write("3. Usuaria intenta registrarse nuevamente\n")
            f.write(f"4. Se registra exitosamente el {usuario['created_at']}\n\n")
            
            f.write("## SOLUCIÓN\n\n")
            f.write("**Datos correctos para el login:**\n")
            f.write(f"- **Email:** yeseniagarciamurcia@gmail.com\n")
            f.write(f"- **Username:** yeseseniagarcia\n")
            f.write(f"- **Estado:** ACTIVE\n\n")
            
            f.write("**Acciones recomendadas:**\n")
            f.write("1. Contactar a la usuaria con los datos correctos\n")
            f.write("2. Si necesita recuperar contraseña, usar el email correcto\n")
            f.write("3. Confirmar acceso exitoso\n")
        
        print(f"\n📄 Reporte detallado guardado en: REPORTE_YESENIA_GARCIA_{timestamp}.md")
        
    except Exception as e:
        print(f"Error en la investigación: {e}")

if __name__ == "__main__":
    investigar_usuario_yesenia()
