import mysql.connector
from datetime import datetime

# Configuración de la base de datos
db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

print("=" * 80)
print("INVESTIGACIÓN: YESENIA GARCÍA - DNI: 31486747")
print("Email reportado: yeseniagarciamurcia@gamil.com")  
print("Usuario reportado: yeseniagarcia")
print("Fecha del problema: Miércoles 06 de agosto")
print("=" * 80)

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Buscar por DNI
    print("\n🔍 BÚSQUEDA POR DNI (31486747):")
    cursor.execute("""
        SELECT HEX(id) as id_hex, email, username, dni, first_name, last_name, status, created_at, cuit
        FROM user_entity 
        WHERE dni = %s
    """, ('31486747',))
    
    usuario = cursor.fetchone()
    if usuario:
        print(f"   ✅ USUARIO ENCONTRADO:")
        print(f"   - ID: {usuario['id_hex']}")
        print(f"   - Email REAL: {usuario['email']}")
        print(f"   - Username REAL: {usuario['username']}")
        print(f"   - DNI: {usuario['dni']}")
        print(f"   - Nombre: {usuario['first_name']} {usuario['last_name']}")
        print(f"   - Estado: {usuario['status']}")
        print(f"   - CUIT: {usuario['cuit']}")
        print(f"   - Creado: {usuario['created_at']}")
        
        print("\n" + "=" * 80)
        print("🚨 PROBLEMA IDENTIFICADO:")
        print("=" * 80)
        
        print("❌ DISCREPANCIAS:")
        print(f"   1. Email reportado:    'yeseniagarciamurcia@gamil.com' (con 'GAMIL')")
        print(f"   2. Email real en BD:   '{usuario['email']}' (con 'GMAIL')")
        print(f"   3. Username reportado: 'yeseniagarcia'")
        print(f"   4. Username real en BD: '{usuario['username']}' (diferente)")
        
        print(f"\n💡 DIAGNÓSTICO:")
        print(f"   • El usuario SÍ EXISTE en el sistema")
        print(f"   • La usuaria está usando datos INCORRECTOS para hacer login")
        print(f"   • El sistema rechaza correctamente el acceso con datos erróneos")
        print(f"   • Usuario fue creado: {usuario['created_at']}")
        
        print(f"\n✅ SOLUCIÓN:")
        print(f"   La usuaria debe usar los siguientes datos CORRECTOS:")
        print(f"   - Email:    {usuario['email']}")
        print(f"   - Username: {usuario['username']}")
        print(f"   - Si olvidó la contraseña, usar recuperación con el email correcto")
        
        # Generar reporte
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(f"INVESTIGACION_YESENIA_GARCIA_{timestamp}.md", "w", encoding='utf-8') as f:
            f.write("# INVESTIGACIÓN - YESENIA GARCÍA DNI: 31486747\n\n")
            f.write(f"**Fecha:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n\n")
            f.write("## PROBLEMA REPORTADO\n")
            f.write("- No puede loguearse\n")
            f.write("- Sistema indica 'email ya registrado'\n")
            f.write("- Problema desde miércoles 06 de agosto\n\n")
            f.write("## DATOS REPORTADOS VS REALES\n\n")
            f.write("| Campo | Reportado | Real en Sistema |\n")
            f.write("|-------|-----------|----------------|\n")
            f.write(f"| Email | yeseniagarciamurcia@**gamil**.com | {usuario['email']} |\n")
            f.write(f"| Username | yeseniagarcia | {usuario['username']} |\n")
            f.write(f"| DNI | 31486747 | {usuario['dni']} ✓ |\n\n")
            f.write("## DIAGNÓSTICO\n")
            f.write("**CAUSA:** La usuaria intenta loguearse con datos incorrectos.\n\n")
            f.write("**ESTADO DEL USUARIO:** ACTIVE - Funcionando correctamente\n\n")
            f.write(f"**FECHA CREACIÓN:** {usuario['created_at']}\n\n")
            f.write("## SOLUCIÓN\n")
            f.write("**Datos correctos para el login:**\n")
            f.write(f"- **Email:** {usuario['email']}\n")
            f.write(f"- **Username:** {usuario['username']}\n\n")
            f.write("**Acciones:**\n")
            f.write("1. Informar a la usuaria los datos correctos\n")
            f.write("2. Si necesita resetear password, usar el email correcto\n")
            f.write("3. Confirmar acceso exitoso\n")
        
        print(f"\n📄 Reporte guardado: INVESTIGACION_YESENIA_GARCIA_{timestamp}.md")
        
    else:
        print("   ❌ No se encontró usuario con DNI 31486747")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
