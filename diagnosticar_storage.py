#!/usr/bin/env python3
import mysql.connector
import subprocess
import os
from pathlib import Path

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

def run_docker_command(cmd):
    """Ejecuta un comando en el contenedor del backend"""
    try:
        result = subprocess.run(
            f"docker exec mpd-concursos-backend {cmd}",
            shell=True, capture_output=True, text=True
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def check_document_storage():
    """Diagnostica el problema del almacenamiento de documentos"""
    
    print("="*80)
    print("DIAGNÓSTICO DEL SISTEMA DE ALMACENAMIENTO DE DOCUMENTOS")
    print("="*80)
    
    # 1. Verificar estructura de directorios en el backend
    print("\n📁 ESTRUCTURA DE DIRECTORIOS EN BACKEND:")
    stdout, stderr, code = run_docker_command("find /app -type d -name '*storage*' -o -name '*document*' -o -name '*upload*'")
    if stdout:
        for line in stdout.split('\n'):
            print(f"  • {line}")
    
    # 2. Verificar documentos en base de datos
    print("\n📊 ANÁLISIS DE DOCUMENTOS EN BASE DE DATOS:")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
            FROM documents
        """)
        stats = cursor.fetchone()
        print(f"  • Total documentos: {stats['total']}")
        print(f"  • Pendientes: {stats['pending']}")
        print(f"  • Aprobados: {stats['approved']}")
        print(f"  • Rechazados: {stats['rejected']}")
        
        # 3. Verificar rutas de archivos problemáticos
        print("\n🔍 VERIFICACIÓN DE ARCHIVOS FÍSICOS:")
        cursor.execute("""
            SELECT file_path, file_name, HEX(user_id) as user_id, status
            FROM documents 
            WHERE status IN ('PENDING', 'APPROVED')
            ORDER BY upload_date DESC
            LIMIT 10
        """)
        
        docs = cursor.fetchall()
        missing_files = []
        existing_files = []
        
        for doc in docs:
            file_path = doc['file_path']
            
            # Verificar si existe con la ruta relativa
            stdout, stderr, code = run_docker_command(f"test -f /app/{file_path} && echo 'EXISTS' || echo 'MISSING'")
            
            if stdout == 'EXISTS':
                existing_files.append(file_path)
                print(f"  ✅ {file_path}")
            else:
                # Verificar si existe con ruta absoluta
                stdout2, stderr2, code2 = run_docker_command(f"test -f /{file_path} && echo 'EXISTS' || echo 'MISSING'")
                
                if stdout2 == 'EXISTS':
                    existing_files.append(file_path)
                    print(f"  ✅ /{file_path} (ruta absoluta)")
                else:
                    # Buscar el archivo en todo el contenedor
                    filename = os.path.basename(file_path)
                    stdout3, stderr3, code3 = run_docker_command(f"find /app -name '*{filename}*' 2>/dev/null")
                    
                    if stdout3:
                        print(f"  🔧 ENCONTRADO EN: {stdout3}")
                        existing_files.append(file_path)
                    else:
                        missing_files.append(file_path)
                        print(f"  ❌ FALTA: {file_path}")
        
        print(f"\n📈 RESUMEN:")
        print(f"  • Archivos existentes: {len(existing_files)}")
        print(f"  • Archivos faltantes: {len(missing_files)}")
        
        # 4. Diagnosticar el caso específico de Sofia Camerucci
        print(f"\n👤 CASO ESPECÍFICO - SOFIA CAMERUCCI:")
        cursor.execute("""
            SELECT file_path, file_name, status, processing_status
            FROM documents d
            JOIN user_entity u ON d.user_id = u.id
            WHERE u.username = 'scamerucci'
        """)
        
        sofia_docs = cursor.fetchall()
        for doc in sofia_docs:
            print(f"  • Documento: {doc['file_name']}")
            print(f"    Ruta DB: {doc['file_path']}")
            print(f"    Estado: {doc['status']} / {doc['processing_status']}")
            
            # Verificar existencia
            stdout, stderr, code = run_docker_command(f"test -f /app/{doc['file_path']} && echo 'EXISTS' || echo 'MISSING'")
            print(f"    Archivo físico: {'✅ EXISTE' if stdout == 'EXISTS' else '❌ FALTA'}")
            
            # Mostrar información del archivo si existe
            if stdout == 'EXISTS':
                stdout, stderr, code = run_docker_command(f"ls -la '/app/{doc['file_path']}'")
                print(f"    Detalles: {stdout}")
        
        # 5. Verificar configuración del backend
        print(f"\n⚙️ CONFIGURACIÓN DEL BACKEND:")
        stdout, stderr, code = run_docker_command("env | grep -i storage")
        if stdout:
            print(f"  Variables de entorno:")
            for line in stdout.split('\n'):
                print(f"    {line}")
        
        # Verificar directorio de trabajo
        stdout, stderr, code = run_docker_command("pwd")
        print(f"  Directorio de trabajo: {stdout}")
        
        # Verificar permisos de directorios
        stdout, stderr, code = run_docker_command("ls -la /app/storage/")
        print(f"  Permisos de storage:")
        for line in stdout.split('\n')[:5]:  # Mostrar solo las primeras líneas
            print(f"    {line}")
        
    except mysql.connector.Error as e:
        print(f"Error de base de datos: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

def fix_storage_paths():
    """Intenta corregir los problemas de rutas de almacenamiento"""
    
    print("\n" + "="*80)
    print("CORRECCIÓN DE PROBLEMAS DE ALMACENAMIENTO")
    print("="*80)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Verificar documentos con rutas problemáticas
        cursor.execute("""
            SELECT HEX(id) as doc_id, file_path, file_name
            FROM documents
            WHERE status = 'PENDING'
        """)
        
        docs = cursor.fetchall()
        fixed_count = 0
        
        print(f"\n🔧 VERIFICANDO {len(docs)} DOCUMENTOS PENDIENTES:")
        
        for doc in docs:
            file_path = doc['file_path']
            doc_id_hex = doc['doc_id']
            doc_id_binary = bytes.fromhex(doc_id_hex)
            
            # Verificar si el archivo existe con la ruta actual
            stdout, stderr, code = run_docker_command(f"test -f /app/{file_path} && echo 'EXISTS' || echo 'MISSING'")
            
            if stdout == 'EXISTS':
                print(f"  ✅ {doc['file_name']} - Archivo encontrado")
                
                # Si el archivo existe, actualizar el estado a APPROVED
                cursor.execute("""
                    UPDATE documents 
                    SET status = 'APPROVED', 
                        validated_at = NOW(),
                        processing_status = 'UPLOAD_COMPLETE'
                    WHERE id = %s
                """, (doc_id_binary,))
                fixed_count += 1
                print(f"      → Estado actualizado a APPROVED")
            else:
                print(f"  ❌ {doc['file_name']} - Archivo no encontrado en {file_path}")
        
        if fixed_count > 0:
            conn.commit()
            print(f"\n✅ Se actualizaron {fixed_count} documentos correctamente")
        else:
            print(f"\n⚠️  No se encontraron documentos para corregir")
        
    except mysql.connector.Error as e:
        print(f"Error de base de datos: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_document_storage()
    fix_storage_paths()
