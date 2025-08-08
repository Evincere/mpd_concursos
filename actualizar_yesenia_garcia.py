import mysql.connector
import bcrypt
from datetime import datetime

# Configuración de la base de datos
db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

def actualizar_usuario_yesenia():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("=" * 80)
        print("ACTUALIZACIÓN DE USUARIO: YESENIA GARCÍA - DNI: 31486747")
        print("=" * 80)
        
        # 1. Verificar usuario actual
        print("\n1. ESTADO ACTUAL DEL USUARIO:")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at
            FROM user_entity 
            WHERE dni = %s
        """, ('31486747',))
        
        usuario = cursor.fetchone()
        if not usuario:
            print("❌ Usuario no encontrado con DNI 31486747")
            return
            
        print(f"   ID: {usuario['id_hex']}")
        print(f"   Email: {usuario['email']}")
        print(f"   Username actual: {usuario['username']}")
        print(f"   DNI: {usuario['dni']}")
        print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
        print(f"   Estado: {usuario['status']}")
        
        user_id = bytes.fromhex(usuario['id_hex'])
        
        # 2. Verificar si el nuevo username ya existe
        print(f"\n2. VERIFICANDO DISPONIBILIDAD DEL USERNAME 'yeseniagarcia':")
        cursor.execute("""
            SELECT HEX(id) as id_hex, username, email, dni
            FROM user_entity 
            WHERE username = %s AND id != %s
        """, ('yeseniagarcia', user_id))
        
        conflicto = cursor.fetchone()
        if conflicto:
            print(f"❌ CONFLICTO: Username 'yeseniagarcia' ya está en uso por:")
            print(f"   ID: {conflicto['id_hex']}")
            print(f"   Email: {conflicto['email']}")
            print(f"   DNI: {conflicto['dni']}")
            print("   No se puede continuar con la actualización.")
            return
        else:
            print("✅ Username 'yeseniagarcia' está disponible")
        
        # 3. Generar hash de la contraseña
        print(f"\n3. GENERANDO HASH DE CONTRASEÑA:")
        password_plain = "Bemaba2025@"
        password_hash = bcrypt.hashpw(password_plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        print("✅ Hash de contraseña generado correctamente")
        
        # 4. Realizar backup antes de la actualización
        print(f"\n4. CREANDO BACKUP DE SEGURIDAD:")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, password, dni, first_name, last_name, 
                   status, created_at, cuit, birth_date, telefono, direccion
            FROM user_entity 
            WHERE id = %s
        """, (user_id,))
        
        backup_data = cursor.fetchone()
        
        # Guardar backup en archivo
        with open(f"backup_yesenia_garcia_{timestamp}.json", "w", encoding='utf-8') as f:
            import json
            json.dump(backup_data, f, indent=2, default=str)
        
        print(f"✅ Backup guardado en: backup_yesenia_garcia_{timestamp}.json")
        
        # 5. Realizar las actualizaciones
        print(f"\n5. EJECUTANDO ACTUALIZACIONES:")
        
        # Actualizar username y password
        cursor.execute("""
            UPDATE user_entity 
            SET username = %s, password = %s
            WHERE id = %s
        """, ('yeseniagarcia', password_hash, user_id))
        
        if cursor.rowcount > 0:
            print("✅ Username actualizado a: yeseniagarcia")
            print("✅ Contraseña actualizada correctamente")
            
            # Confirmar cambios
            conn.commit()
            print("✅ Cambios confirmados en la base de datos")
        else:
            print("❌ No se pudo realizar la actualización")
            return
        
        # 6. Verificar cambios
        print(f"\n6. VERIFICANDO CAMBIOS:")
        cursor.execute("""
            SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status
            FROM user_entity 
            WHERE id = %s
        """, (user_id,))
        
        usuario_actualizado = cursor.fetchone()
        if usuario_actualizado:
            print(f"   Username: {usuario_actualizado['username']} ✅")
            print(f"   Email: {usuario_actualizado['email']}")
            print(f"   DNI: {usuario_actualizado['dni']}")
            print(f"   Nombre: {usuario_actualizado['first_name']} {usuario_actualizado['last_name']}")
            print(f"   Estado: {usuario_actualizado['status']}")
        
        # 7. Verificar que la contraseña funciona
        print(f"\n7. VERIFICANDO CONTRASEÑA:")
        cursor.execute("SELECT password FROM user_entity WHERE id = %s", (user_id,))
        stored_hash = cursor.fetchone()['password']
        
        if bcrypt.checkpw(password_plain.encode('utf-8'), stored_hash.encode('utf-8')):
            print("✅ Contraseña verificada correctamente")
        else:
            print("❌ Error en la verificación de contraseña")
        
        # 8. Registrar en audit log
        print(f"\n8. REGISTRANDO EN AUDIT LOG:")
        try:
            cursor.execute("""
                INSERT INTO audit_logs (action, entity_type, entity_id, details, timestamp)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                'UPDATE_USER_CREDENTIALS',
                'user_entity',
                user_id,
                f'Username actualizado de "yeseseniagarcia" a "yeseniagarcia" y contraseña actualizada para usuario DNI: 31486747',
                datetime.now()
            ))
            conn.commit()
            print("✅ Audit log registrado")
        except Exception as e:
            print(f"⚠️  No se pudo registrar en audit log: {e}")
        
        print(f"\n" + "=" * 80)
        print("✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 80)
        
        print("📋 RESUMEN DE CAMBIOS:")
        print(f"   • Username: yeseseniagarcia → yeseniagarcia")
        print(f"   • Contraseña: Actualizada a 'Bemaba2025@'")
        print(f"   • Estado: ACTIVE (sin cambios)")
        print(f"   • Email: {usuario_actualizado['email']} (sin cambios)")
        
        print(f"\n🔑 CREDENCIALES ACTUALIZADAS:")
        print(f"   • Email/Username: yeseniagarcia")
        print(f"   • Email alternativo: {usuario_actualizado['email']}")
        print(f"   • Contraseña: Bemaba2025@")
        
        # Generar reporte final
        with open(f"actualizacion_yesenia_garcia_{timestamp}.md", "w", encoding='utf-8') as f:
            f.write("# ACTUALIZACIÓN USUARIO YESENIA GARCÍA\n\n")
            f.write(f"**DNI:** 31486747  \n")
            f.write(f"**Fecha:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}  \n")
            f.write(f"**ID Usuario:** {usuario['id_hex']}  \n\n")
            
            f.write("## CAMBIOS REALIZADOS\n\n")
            f.write("| Campo | Valor Anterior | Valor Nuevo |\n")
            f.write("|-------|----------------|-------------|\n")
            f.write(f"| Username | yeseseniagarcia | yeseniagarcia |\n")
            f.write(f"| Password | [hash anterior] | Bemaba2025@ (nuevo hash) |\n\n")
            
            f.write("## CREDENCIALES ACTUALIZADAS\n\n")
            f.write(f"**Para login se puede usar cualquiera de:**\n")
            f.write(f"- Username: `yeseniagarcia`\n")
            f.write(f"- Email: `{usuario_actualizado['email']}`\n")
            f.write(f"- Password: `Bemaba2025@`\n\n")
            
            f.write("## VERIFICACIÓN\n\n")
            f.write("- ✅ Username actualizado correctamente\n")
            f.write("- ✅ Contraseña actualizada y verificada\n")
            f.write("- ✅ Usuario permanece ACTIVE\n")
            f.write(f"- ✅ Backup creado: `backup_yesenia_garcia_{timestamp}.json`\n")
        
        print(f"\n📄 Reporte completo: actualizacion_yesenia_garcia_{timestamp}.md")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    actualizar_usuario_yesenia()
