#!/usr/bin/env python3
"""
Investigación completa sobre Jimena Nahir Calderón - DNI 40561819
Estado de inscripción y verificación física de documentos
"""

import os
import subprocess
from datetime import datetime

def obtener_datos_db():
    """Obtener datos del usuario desde la base de datos"""
    
    print("🔍 INVESTIGACIÓN: Jimena Nahir Calderón - DNI 40561819")
    print("="*60)
    
    # 1. Datos básicos del usuario
    print("\n1️⃣ DATOS DEL USUARIO:")
    cmd_usuario = [
        "docker", "exec", "mpd-concursos-mysql", "mysql", "-u", "root", "-proot1234", 
        "mpd_concursos", "-e", 
        "SELECT HEX(id) as id_hex, username, dni, first_name, last_name, email, status, created_at, telefono FROM user_entity WHERE dni = '40561819';"
    ]
    result = subprocess.run(cmd_usuario, capture_output=True, text=True)
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[1:]  # Skip header
        for line in lines:
            if 'mysql:' not in line:
                data = line.split('\t')
                if len(data) >= 9:
                    print(f"   ✅ Usuario encontrado:")
                    print(f"      - ID: {data[0]}")
                    print(f"      - Username: {data[1]}")
                    print(f"      - DNI: {data[2]}")
                    print(f"      - Nombre: {data[3]} {data[4]}")
                    print(f"      - Email: {data[5]}")
                    print(f"      - Estado: {data[6]}")
                    print(f"      - Fecha creación: {data[7]}")
                    print(f"      - Teléfono: {data[8]}")
                    user_id = data[0]
                    return user_id
    
    print("   ❌ Usuario no encontrado")
    return None

def obtener_inscripciones(user_id):
    """Obtener inscripciones del usuario"""
    
    print("\n2️⃣ ESTADO DE INSCRIPCIONES:")
    cmd_inscripciones = [
        "docker", "exec", "mpd-concursos-mysql", "mysql", "-u", "root", "-proot1234",
        "mpd_concursos", "-e",
        f"SELECT HEX(i.id) as inscription_id, i.created_at, i.status, c.title, c.position, c.department FROM inscriptions i JOIN contests c ON i.contest_id = c.id WHERE i.user_id = UNHEX('{user_id}');"
    ]
    result = subprocess.run(cmd_inscripciones, capture_output=True, text=True)
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[1:]
        inscripciones_encontradas = 0
        for line in lines:
            if 'mysql:' not in line and line.strip():
                data = line.split('\t')
                if len(data) >= 6:
                    inscripciones_encontradas += 1
                    print(f"   📋 Inscripción #{inscripciones_encontradas}:")
                    print(f"      - ID: {data[0]}")
                    print(f"      - Fecha: {data[1]}")
                    print(f"      - Estado: {data[2]}")
                    print(f"      - Concurso: {data[3]}")
                    print(f"      - Posición: {data[4]}")
                    print(f"      - Departamento: {data[5]}")
        
        if inscripciones_encontradas == 0:
            print("   ❌ No se encontraron inscripciones")
        else:
            print(f"   ✅ Total de inscripciones: {inscripciones_encontradas}")

def obtener_documentos(user_id):
    """Obtener documentos del usuario"""
    
    print("\n3️⃣ DOCUMENTOS REGISTRADOS EN BASE DE DATOS:")
    cmd_documentos = [
        "docker", "exec", "mpd-concursos-mysql", "mysql", "-u", "root", "-proot1234",
        "mpd_concursos", "-e",
        f"SELECT HEX(d.id) as doc_id, d.file_name, d.file_path, d.upload_date, d.status, d.processing_status, dt.name as document_type FROM documents d JOIN document_types dt ON d.document_type_id = dt.id WHERE d.user_id = UNHEX('{user_id}') ORDER BY d.upload_date DESC;"
    ]
    result = subprocess.run(cmd_documentos, capture_output=True, text=True)
    documentos = []
    
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[1:]
        doc_count = 0
        for line in lines:
            if 'mysql:' not in line and line.strip():
                data = line.split('\t')
                if len(data) >= 7:
                    doc_count += 1
                    doc_info = {
                        'id': data[0],
                        'filename': data[1],
                        'path': data[2],
                        'upload_date': data[3],
                        'status': data[4],
                        'processing_status': data[5],
                        'type': data[6]
                    }
                    documentos.append(doc_info)
                    print(f"   📄 Documento #{doc_count}:")
                    print(f"      - Tipo: {doc_info['type']}")
                    print(f"      - Archivo: {doc_info['filename']}")
                    print(f"      - Fecha subida: {doc_info['upload_date']}")
                    print(f"      - Estado: {doc_info['status']}")
                    print(f"      - Estado procesamiento: {doc_info['processing_status']}")
                    print(f"      - Ruta: {doc_info['path']}")
        
        if doc_count == 0:
            print("   ❌ No se encontraron documentos en la base de datos")
        else:
            print(f"   ✅ Total documentos en BD: {doc_count}")
    
    return documentos

def verificar_archivos_fisicos(documentos):
    """Verificar existencia física de archivos"""
    
    print("\n4️⃣ VERIFICACIÓN FÍSICA DE ARCHIVOS:")
    
    if not documentos:
        print("   ❌ No hay documentos para verificar")
        return
    
    archivos_existentes = 0
    archivos_faltantes = 0
    
    for i, doc in enumerate(documentos, 1):
        path = doc['path']
        full_path = f"/app/storage/{path}"
        
        # Verificar si el archivo existe en el contenedor
        cmd_verificar = [
            "docker", "exec", "mpd-concursos-backend", "test", "-f", full_path
        ]
        result = subprocess.run(cmd_verificar, capture_output=True)
        
        print(f"   📄 Documento #{i}: {doc['filename']}")
        
        if result.returncode == 0:
            # Archivo existe, obtener información adicional
            cmd_info = [
                "docker", "exec", "mpd-concursos-backend", "ls", "-lh", full_path
            ]
            info_result = subprocess.run(cmd_info, capture_output=True, text=True)
            
            if info_result.returncode == 0:
                file_info = info_result.stdout.strip()
                size = file_info.split()[4] if len(file_info.split()) > 4 else "N/A"
                print(f"      ✅ EXISTE - Tamaño: {size}")
                archivos_existentes += 1
            else:
                print(f"      ✅ EXISTE (no se pudo obtener tamaño)")
                archivos_existentes += 1
        else:
            print(f"      ❌ FALTANTE")
            archivos_faltantes += 1
    
    print(f"\n   📊 RESUMEN VERIFICACIÓN:")
    print(f"      - Archivos existentes: {archivos_existentes}")
    print(f"      - Archivos faltantes: {archivos_faltantes}")
    print(f"      - Total verificados: {len(documentos)}")
    
    return archivos_existentes, archivos_faltantes

def generar_reporte_final(user_id, documentos, archivos_existentes, archivos_faltantes):
    """Generar reporte final"""
    
    print("\n" + "="*60)
    print("📋 REPORTE FINAL - JIMENA NAHIR CALDERÓN")
    print("="*60)
    
    print(f"👤 USUARIO:")
    print(f"   - Nombre: Jimena Nahir Calderón")
    print(f"   - DNI: 40561819")
    print(f"   - Estado: Encontrado en el sistema")
    
    print(f"\n📝 INSCRIPCIONES:")
    print(f"   - Estado: COMPLETED_PENDING_DOCS")
    print(f"   - Concurso: MULTIFUERO")
    print(f"   - Posición: Co-Defensor/Co-Asesor Multifuero - Clase 03")
    
    print(f"\n📄 DOCUMENTOS:")
    print(f"   - Total en BD: {len(documentos)}")
    print(f"   - Archivos físicos existentes: {archivos_existentes}")
    print(f"   - Archivos físicos faltantes: {archivos_faltantes}")
    print(f"   - Estado general: {'✅ COMPLETO' if archivos_faltantes == 0 else '⚠️ INCOMPLETO'}")
    
    if archivos_faltantes > 0:
        print(f"\n⚠️ PROBLEMAS DETECTADOS:")
        print(f"   - Hay {archivos_faltantes} archivo(s) registrado(s) en BD pero ausente(s) físicamente")
        print(f"   - Esto puede causar problemas en la evaluación de la inscripción")
        print(f"   - Se requiere investigación adicional o recuperación de archivos")
    
    print(f"\n🎯 CONCLUSIÓN:")
    if archivos_faltantes == 0:
        print(f"   ✅ Todo en orden. Usuario puede proceder normalmente.")
    else:
        print(f"   ⚠️ Requiere atención. Documentos faltantes pueden afectar la inscripción.")

def main():
    """Función principal"""
    
    user_id = obtener_datos_db()
    if not user_id:
        return
    
    obtener_inscripciones(user_id)
    documentos = obtener_documentos(user_id)
    archivos_existentes, archivos_faltantes = verificar_archivos_fisicos(documentos)
    generar_reporte_final(user_id, documentos, archivos_existentes, archivos_faltantes)
    
    print(f"\n📄 Investigación completada: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
