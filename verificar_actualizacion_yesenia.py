import mysql.connector
import bcrypt

# Configuración de la base de datos
db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    print("=" * 80)
    print("VERIFICACIÓN FINAL - YESENIA GARCÍA")
    print("=" * 80)
    
    # Verificar por DNI
    cursor.execute("""
        SELECT HEX(id) as id_hex, email, username, password, dni, first_name, last_name, status
        FROM user_entity 
        WHERE dni = %s
    """, ('31486747',))
    
    usuario = cursor.fetchone()
    if usuario:
        print(f"✅ USUARIO ENCONTRADO:")
        print(f"   ID: {usuario['id_hex']}")
        print(f"   Email: {usuario['email']}")
        print(f"   Username: {usuario['username']}")
        print(f"   DNI: {usuario['dni']}")
        print(f"   Nombre: {usuario['first_name']} {usuario['last_name']}")
        print(f"   Estado: {usuario['status']}")
        
        # Verificar contraseña
        print(f"\n🔑 VERIFICACIÓN DE CONTRASEÑA:")
        password_to_test = "Bemaba2025@"
        stored_hash = usuario['password']
        
        if bcrypt.checkpw(password_to_test.encode('utf-8'), stored_hash.encode('utf-8')):
            print(f"   ✅ Contraseña '{password_to_test}' es correcta")
        else:
            print(f"   ❌ Contraseña '{password_to_test}' no coincide")
        
        print(f"\n📋 CREDENCIALES FINALES PARA LA USUARIA:")
        print(f"   • Username: {usuario['username']}")
        print(f"   • Email: {usuario['email']}")
        print(f"   • Password: {password_to_test}")
        print(f"   • Estado: {usuario['status']}")
        
        # Verificar que no hay conflictos
        print(f"\n🔍 VERIFICAR NO HAY DUPLICADOS:")
        cursor.execute("""
            SELECT COUNT(*) as count FROM user_entity WHERE username = %s
        """, (usuario['username'],))
        count = cursor.fetchone()['count']
        print(f"   Usuarios con username '{usuario['username']}': {count}")
        
        if count == 1:
            print("   ✅ Username único, sin conflictos")
        else:
            print("   ⚠️  Posible conflicto de username")
        
    else:
        print("❌ Usuario no encontrado")
    
    cursor.close()
    conn.close()
    
    print(f"\n" + "=" * 80)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 80)
    
except Exception as e:
    print(f"Error: {e}")
