#!/usr/bin/env python3
import mysql.connector
import subprocess
import csv
from datetime import datetime

# Configuración de la base de datos
db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

def ejecutar_comando_docker(comando):
    """Ejecutar comando en el contenedor backend"""
    cmd = f"docker exec mpd-concursos-backend {comando}"
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return False, "", str(e)

def verificar_archivo_fisico(file_path):
    """Verificar si el archivo existe físicamente y tiene contenido"""
    if not file_path or file_path == '':
        return False, "Ruta vacía"
    
    # Construir la ruta completa en el contenedor
    ruta_completa = f"/app/storage/{file_path}"
    
    # Verificar si el archivo existe y obtener información
    existe, output, error = ejecutar_comando_docker(f'test -f "{ruta_completa}" && stat "{ruta_completa}" || echo "NOT_EXISTS"')
    
    if "NOT_EXISTS" in output:
        return False, "Archivo no existe"
    
    if not existe:
        return False, "Error al acceder al archivo"
    
    # Extraer el tamaño del output de stat
    try:
        for line in output.split('\n'):
            if 'Size:' in line:
                size_part = line.split('Size:')[1].strip().split()[0]
                file_size = int(size_part)
                if file_size == 0:
                    return False, "Archivo vacío (0 bytes)"
                elif file_size < 100:  # Archivos PDF típicamente son más grandes
                    return False, f"Archivo muy pequeño ({file_size} bytes)"
                else:
                    return True, f"OK ({file_size:,} bytes)"
        return False, "No se pudo determinar el tamaño"
    except (ValueError, IndexError):
        return False, "Error al parsear información del archivo"

def main():
    print("🔍 VERIFICACIÓN FINAL DE INTEGRIDAD - TODOS LOS DOCUMENTOS")
    print("=" * 65)
    
    # Conectar a la base de datos
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("✅ Conexión a base de datos establecida")
    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")
        return
    
    # Obtener TODOS los tipos de documentos (no solo obligatorios)
    cursor.execute("""
        SELECT HEX(id) as id, code, name 
        FROM document_types 
        WHERE is_active = 1
        ORDER BY name
    """)
    
    doc_types_todos = cursor.fetchall()
    
    print(f"📋 Tipos de documentos encontrados: {len(doc_types_todos)}")
    for doc_type in doc_types_todos:
        print(f"   - {doc_type[2]}")
    
    # Obtener usuarios con inscripciones
    cursor.execute("""
        SELECT DISTINCT 
            HEX(u.id) as user_id,
            u.first_name,
            u.last_name,
            u.dni,
            u.telefono,
            u.email
        FROM user_entity u
        JOIN inscriptions i ON u.id = i.user_id
        ORDER BY u.last_name, u.first_name
        LIMIT 20
    """)
    
    usuarios_inscritos = cursor.fetchall()
    print(f"👥 Usuarios inscritos a analizar (muestra): {len(usuarios_inscritos)}")
    print()
    
    # Estadísticas
    total_usuarios = len(usuarios_inscritos)
    usuarios_procesados = 0
    usuarios_con_documentos = 0
    usuarios_sin_documentos = 0
    total_documentos_verificados = 0
    documentos_ok = 0
    documentos_con_problemas = 0
    
    usuarios_detalle = []
    
    print("🔍 ANALIZANDO MUESTRA DE USUARIOS...")
    print("-" * 50)
    
    for usuario in usuarios_inscritos:
        user_id, first_name, last_name, dni, telefono, email = usuario
        usuarios_procesados += 1
        
        print(f"[{usuarios_procesados}/{total_usuarios}] {first_name} {last_name} (DNI: {dni})")
        
        # Obtener TODOS los documentos del usuario
        cursor.execute("""
            SELECT 
                HEX(d.id) as doc_id,
                d.file_name,
                d.file_path,
                dt.name as doc_type_name,
                d.status,
                d.processing_status,
                d.is_archived
            FROM documents d
            JOIN document_types dt ON d.document_type_id = dt.id
            WHERE HEX(d.user_id) = %s 
            AND d.is_archived = 0
            ORDER BY dt.name
        """, (user_id,))
        
        documentos_usuario = cursor.fetchall()
        total_documentos_verificados += len(documentos_usuario)
        
        if not documentos_usuario:
            print("    ❌ Sin documentos cargados")
            usuarios_sin_documentos += 1
            usuarios_detalle.append({
                'nombre': first_name,
                'apellido': last_name,
                'dni': dni,
                'telefono': telefono,
                'email': email,
                'total_docs': 0,
                'docs_ok': 0,
                'docs_problemas': 0,
                'estado': 'SIN_DOCUMENTOS'
            })
        else:
            docs_ok_usuario = 0
            docs_problema_usuario = 0
            
            for doc in documentos_usuario:
                doc_id, file_name, file_path, doc_type_name, status, processing_status, is_archived = doc
                
                archivo_ok, mensaje = verificar_archivo_fisico(file_path)
                
                if archivo_ok:
                    docs_ok_usuario += 1
                    documentos_ok += 1
                    print(f"    ✅ {doc_type_name}: {mensaje}")
                else:
                    docs_problema_usuario += 1
                    documentos_con_problemas += 1
                    print(f"    ❌ {doc_type_name}: {mensaje}")
            
            if docs_ok_usuario > 0:
                usuarios_con_documentos += 1
                estado = "CON_DOCUMENTOS_OK" if docs_problema_usuario == 0 else "MIXTO"
            else:
                usuarios_sin_documentos += 1
                estado = "TODOS_CON_PROBLEMAS"
            
            usuarios_detalle.append({
                'nombre': first_name,
                'apellido': last_name,
                'dni': dni,
                'telefono': telefono,
                'email': email,
                'total_docs': len(documentos_usuario),
                'docs_ok': docs_ok_usuario,
                'docs_problemas': docs_problema_usuario,
                'estado': estado
            })
        
        print()
    
    # Generar CSV con resumen de usuarios
    fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"resumen_documentos_usuarios_{fecha_hora}.csv"
    
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['nombre', 'apellido', 'dni', 'telefono', 'email', 'total_docs', 'docs_ok', 'docs_problemas', 'estado']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(usuarios_detalle)
    
    # Generar informe final
    informe_filename = f"informe_final_integridad_{fecha_hora}.txt"
    
    with open(informe_filename, 'w', encoding='utf-8') as f:
        f.write("🔍 INFORME FINAL DE INTEGRIDAD DE DOCUMENTACIÓN\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"📅 Fecha de análisis: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write(f"🎯 Análisis realizado: Verificación de TODOS los documentos\n\n")
        
        f.write("📊 ESTADÍSTICAS GENERALES (MUESTRA):\n")
        f.write("-" * 35 + "\n")
        f.write(f"👥 Total usuarios analizados: {total_usuarios}\n")
        f.write(f"✅ Usuarios con documentos íntegros: {usuarios_con_documentos} ({usuarios_con_documentos/total_usuarios*100:.1f}%)\n")
        f.write(f"❌ Usuarios sin documentos/problemas: {usuarios_sin_documentos} ({usuarios_sin_documentos/total_usuarios*100:.1f}%)\n")
        f.write(f"📄 Total documentos verificados: {total_documentos_verificados}\n")
        
        if total_documentos_verificados > 0:
            f.write(f"✅ Documentos íntegros: {documentos_ok} ({documentos_ok/total_documentos_verificados*100:.1f}%)\n")
            f.write(f"❌ Documentos con problemas: {documentos_con_problemas} ({documentos_con_problemas/total_documentos_verificados*100:.1f}%)\n")
        
        f.write(f"\n📁 ARCHIVOS GENERADOS:\n")
        f.write(f"📊 CSV con resumen: {csv_filename}\n")
        f.write(f"📄 Informe: {informe_filename}\n")
    
    # Mostrar resumen final
    print("🎯 RESUMEN FINAL")
    print("=" * 50)
    print(f"👥 Usuarios analizados: {total_usuarios}")
    print(f"✅ Usuarios con documentos OK: {usuarios_con_documentos} ({usuarios_con_documentos/total_usuarios*100:.1f}%)")
    print(f"❌ Usuarios con problemas: {usuarios_sin_documentos} ({usuarios_sin_documentos/total_usuarios*100:.1f}%)")
    print(f"📄 Total documentos verificados: {total_documentos_verificados}")
    
    if total_documentos_verificados > 0:
        print(f"✅ Documentos íntegros: {documentos_ok} ({documentos_ok/total_documentos_verificados*100:.1f}%)")
        print(f"❌ Documentos con problemas: {documentos_con_problemas} ({documentos_con_problemas/total_documentos_verificados*100:.1f}%)")
    
    print(f"\n📁 Archivos generados:")
    print(f"📊 {csv_filename}")
    print(f"📄 {informe_filename}")
    
    # Cerrar conexiones
    cursor.close()
    conn.close()
    print("\n✅ Verificación completada!")

if __name__ == "__main__":
    main()
