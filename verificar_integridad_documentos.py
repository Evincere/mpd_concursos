#!/usr/bin/env python3
import mysql.connector
import subprocess
import os
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
    
    # Verificar si el archivo existe
    existe, output, error = ejecutar_comando_docker(f'test -f "{ruta_completa}" && echo "EXISTS" || echo "NOT_EXISTS"')
    
    if "NOT_EXISTS" in output:
        return False, "Archivo no existe"
    
    # Verificar el tamaño del archivo
    existe, size_output, error = ejecutar_comando_docker(f'stat -f%z "{ruta_completa}" 2>/dev/null || stat -c%s "{ruta_completa}" 2>/dev/null')
    
    try:
        file_size = int(size_output.strip())
        if file_size == 0:
            return False, "Archivo vacío (0 bytes)"
        elif file_size < 100:  # Archivos PDF típicamente son más grandes
            return False, f"Archivo muy pequeño ({file_size} bytes)"
        else:
            return True, f"OK ({file_size} bytes)"
    except ValueError:
        return False, "No se pudo determinar el tamaño"

def main():
    print("🔍 INICIANDO VERIFICACIÓN DE INTEGRIDAD DE DOCUMENTACIÓN")
    print("=" * 60)
    
    # Conectar a la base de datos
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("✅ Conexión a base de datos establecida")
    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")
        return
    
    # Obtener tipos de documentos obligatorios
    cursor.execute("""
        SELECT HEX(id) as id, code, name 
        FROM document_types 
        WHERE required = 1 AND is_active = 1
    """)
    
    doc_types_obligatorios = cursor.fetchall()
    obligatorios_ids = [row[0] for row in doc_types_obligatorios]
    
    print(f"📋 Documentos obligatorios encontrados: {len(doc_types_obligatorios)}")
    for doc_type in doc_types_obligatorios:
        print(f"   - {doc_type[2]} ({doc_type[1]})")
    
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
    """)
    
    usuarios_inscritos = cursor.fetchall()
    print(f"👥 Usuarios inscritos a analizar: {len(usuarios_inscritos)}")
    print()
    
    # Lista para usuarios con problemas
    usuarios_con_problemas = []
    
    # Estadísticas
    total_usuarios = len(usuarios_inscritos)
    usuarios_procesados = 0
    usuarios_con_documentacion_completa = 0
    usuarios_con_documentacion_incompleta = 0
    total_documentos_verificados = 0
    documentos_faltantes = 0
    documentos_con_problemas_fisicos = 0
    
    print("🔍 INICIANDO ANÁLISIS USUARIO POR USUARIO...")
    print("-" * 60)
    
    for usuario in usuarios_inscritos:
        user_id, first_name, last_name, dni, telefono, email = usuario
        usuarios_procesados += 1
        
        print(f"[{usuarios_procesados}/{total_usuarios}] Analizando: {first_name} {last_name} (DNI: {dni})")
        
        usuario_tiene_problemas = False
        problemas_usuario = []
        
        # Verificar cada tipo de documento obligatorio
        for doc_type_id, doc_code, doc_name in doc_types_obligatorios:
            cursor.execute("""
                SELECT 
                    HEX(id) as doc_id,
                    file_name,
                    file_path,
                    status,
                    processing_status,
                    is_archived
                FROM documents 
                WHERE HEX(user_id) = %s 
                AND HEX(document_type_id) = %s 
                AND is_archived = 0
                ORDER BY upload_date DESC
                LIMIT 1
            """, (user_id, doc_type_id))
            
            documento = cursor.fetchone()
            total_documentos_verificados += 1
            
            if not documento:
                problema = f"❌ {doc_name}: DOCUMENTO FALTANTE"
                problemas_usuario.append(problema)
                usuario_tiene_problemas = True
                documentos_faltantes += 1
                print(f"    {problema}")
                continue
            
            doc_id, file_name, file_path, status, processing_status, is_archived = documento
            
            # Verificar integridad física
            archivo_ok, mensaje = verificar_archivo_fisico(file_path)
            
            if not archivo_ok:
                problema = f"❌ {doc_name}: PROBLEMA FÍSICO - {mensaje}"
                problemas_usuario.append(problema)
                usuario_tiene_problemas = True
                documentos_con_problemas_fisicos += 1
                print(f"    {problema}")
            else:
                print(f"    ✅ {doc_name}: {mensaje}")
        
        if usuario_tiene_problemas:
            usuarios_con_problemas.append({
                'nombre': first_name,
                'apellido': last_name,
                'dni': dni,
                'telefono': telefono,
                'email': email,
                'problemas': '; '.join(problemas_usuario)
            })
            usuarios_con_documentacion_incompleta += 1
        else:
            usuarios_con_documentacion_completa += 1
        
        print()
    
    # Generar CSV con usuarios con problemas
    fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"usuarios_con_problemas_documentacion_{fecha_hora}.csv"
    
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['nombre', 'apellido', 'dni', 'telefono', 'email', 'problemas']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(usuarios_con_problemas)
    
    # Generar informe detallado
    informe_filename = f"informe_integridad_documentacion_{fecha_hora}.txt"
    
    with open(informe_filename, 'w', encoding='utf-8') as f:
        f.write("🔍 INFORME DE INTEGRIDAD DE DOCUMENTACIÓN MPD CONCURSOS\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"📅 Fecha de análisis: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write(f"🎯 Análisis realizado: Verificación de documentos obligatorios\n\n")
        
        f.write("📊 ESTADÍSTICAS GENERALES:\n")
        f.write("-" * 30 + "\n")
        f.write(f"👥 Total usuarios inscritos analizados: {total_usuarios}\n")
        f.write(f"✅ Usuarios con documentación completa: {usuarios_con_documentacion_completa} ({usuarios_con_documentacion_completa/total_usuarios*100:.1f}%)\n")
        f.write(f"❌ Usuarios con documentación incompleta: {usuarios_con_documentacion_incompleta} ({usuarios_con_documentacion_incompleta/total_usuarios*100:.1f}%)\n")
        f.write(f"📄 Total documentos verificados: {total_documentos_verificados}\n")
        f.write(f"📋 Documentos faltantes: {documentos_faltantes}\n")
        f.write(f"🗂️ Documentos con problemas físicos: {documentos_con_problemas_fisicos}\n\n")
        
        f.write("📋 TIPOS DE DOCUMENTOS OBLIGATORIOS:\n")
        f.write("-" * 40 + "\n")
        for doc_type in doc_types_obligatorios:
            f.write(f"   - {doc_type[2]} ({doc_type[1]})\n")
        
        f.write(f"\n📁 ARCHIVOS GENERADOS:\n")
        f.write("-" * 20 + "\n")
        f.write(f"📊 CSV con usuarios con problemas: {csv_filename}\n")
        f.write(f"📄 Informe detallado: {informe_filename}\n")
    
    # Mostrar resumen final
    print("🎯 RESUMEN FINAL DE VERIFICACIÓN")
    print("=" * 60)
    print(f"👥 Total usuarios inscritos analizados: {total_usuarios}")
    print(f"✅ Usuarios con documentación completa: {usuarios_con_documentacion_completa} ({usuarios_con_documentacion_completa/total_usuarios*100:.1f}%)")
    print(f"❌ Usuarios con documentación incompleta: {usuarios_con_documentacion_incompleta} ({usuarios_con_documentacion_incompleta/total_usuarios*100:.1f}%)")
    print(f"📄 Total documentos verificados: {total_documentos_verificados}")
    print(f"📋 Documentos faltantes: {documentos_faltantes}")
    print(f"🗂️ Documentos con problemas físicos: {documentos_con_problemas_fisicos}")
    print()
    print("📁 ARCHIVOS GENERADOS:")
    print(f"📊 CSV: {csv_filename}")
    print(f"📄 Informe: {informe_filename}")
    
    # Cerrar conexiones
    cursor.close()
    conn.close()
    print("\n✅ Verificación completada exitosamente!")

if __name__ == "__main__":
    main()
