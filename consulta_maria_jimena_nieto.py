#!/usr/bin/env python3
"""
Consulta completa del estado de María Jimena Nieto - DNI 28542331
"""

import mysql.connector
import json
from datetime import datetime

def conectar_db():
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        user='mpd_user',
        password='mpd_password',
        database='mpd_concursos'
    )

def consultar_usuario():
    conn = conectar_db()
    cursor = conn.cursor(dictionary=True)
    
    print("=" * 80)
    print("🔍 CONSULTA COMPLETA - MARÍA JIMENA NIETO")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🆔 DNI: 28542331")
    print()
    
    # 1. Información básica del usuario
    print("1️⃣ INFORMACIÓN BÁSICA DEL USUARIO")
    print("-" * 50)
    cursor.execute("""
        SELECT 
            id,
            username,
            email,
            first_name,
            last_name,
            dni,
            cuit,
            telefono,
            status,
            created_at
        FROM user_entity 
        WHERE dni = %s
    """, ('28542331',))
    
    usuario = cursor.fetchone()
    
    if usuario:
        print(f"✅ Usuario encontrado:")
        print(f"   • ID: {usuario['id']}")
        print(f"   • Username: {usuario['username']}")
        print(f"   • Email: {usuario['email']}")
        print(f"   • Nombre: {usuario['first_name']} {usuario['last_name']}")
        print(f"   • DNI: {usuario['dni']}")
        print(f"   • CUIT: {usuario['cuit']}")
        print(f"   • Teléfono: {usuario['telefono']}")
        print(f"   • Estado: {usuario['status']}")
        print(f"   • Creado: {usuario['created_at']}")
        
        user_id = usuario['id']
        
        # 2. Inscripciones a concursos
        print("\n2️⃣ INSCRIPCIONES A CONCURSOS")
        print("-" * 50)
        cursor.execute("""
            SELECT 
                i.id,
                c.name as contest_name,
                i.status,
                i.created_at,
                i.updated_at
            FROM inscriptions i
            JOIN contests c ON i.contest_id = c.id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
        """, (user_id,))
        
        inscripciones = cursor.fetchall()
        
        if inscripciones:
            print(f"✅ {len(inscripciones)} inscripción(es) encontrada(s):")
            for insc in inscripciones:
                print(f"   • Concurso: {insc['contest_name']}")
                print(f"     - ID Inscripción: {insc['id']}")
                print(f"     - Estado: {insc['status']}")
                print(f"     - Fecha inscripción: {insc['created_at']}")
                print(f"     - Última actualización: {insc['updated_at']}")
                print()
        else:
            print("❌ No se encontraron inscripciones")
        
        # 3. Documentos subidos
        print("3️⃣ DOCUMENTOS SUBIDOS")
        print("-" * 50)
        cursor.execute("""
            SELECT 
                d.id,
                dt.name as document_type,
                d.file_path,
                d.original_filename,
                d.status,
                d.created_at,
                d.updated_at
            FROM documents d
            JOIN document_types dt ON d.document_type_id = dt.id
            WHERE d.user_id = %s
            ORDER BY d.created_at DESC
        """, (user_id,))
        
        documentos = cursor.fetchall()
        
        if documentos:
            print(f"✅ {len(documentos)} documento(s) encontrado(s):")
            for doc in documentos:
                print(f"   • Tipo: {doc['document_type']}")
                print(f"     - ID: {doc['id']}")
                print(f"     - Archivo: {doc['original_filename']}")
                print(f"     - Ruta: {doc['file_path']}")
                print(f"     - Estado: {doc['status']}")
                print(f"     - Subido: {doc['created_at']}")
                print()
        else:
            print("❌ No se encontraron documentos")
        
        # 4. Verificar integridad de archivos
        print("4️⃣ VERIFICACIÓN DE INTEGRIDAD DE ARCHIVOS")
        print("-" * 50)
        import os
        archivos_faltantes = []
        archivos_ok = []
        
        for doc in documentos:
            if doc['file_path']:
                full_path = f"storage/{doc['file_path']}"
                if os.path.exists(full_path):
                    archivos_ok.append(doc['document_type'])
                else:
                    archivos_faltantes.append({
                        'tipo': doc['document_type'],
                        'ruta': full_path,
                        'archivo': doc['original_filename']
                    })
        
        if archivos_ok:
            print(f"✅ Archivos físicos OK ({len(archivos_ok)}):")
            for tipo in archivos_ok:
                print(f"   • {tipo}")
        
        if archivos_faltantes:
            print(f"\n❌ Archivos físicos FALTANTES ({len(archivos_faltantes)}):")
            for faltante in archivos_faltantes:
                print(f"   • {faltante['tipo']}")
                print(f"     - Archivo: {faltante['archivo']}")
                print(f"     - Ruta esperada: {faltante['ruta']}")
        
        # 5. Resumen del estado
        print("\n5️⃣ RESUMEN DEL ESTADO")
        print("-" * 50)
        print(f"👤 Usuario: {'ACTIVO' if usuario['status'] == 'ACTIVE' else 'INACTIVO'}")
        print(f"📝 Inscripciones: {len(inscripciones)}")
        print(f"📄 Documentos en BD: {len(documentos)}")
        print(f"✅ Archivos físicos OK: {len(archivos_ok)}")
        print(f"❌ Archivos físicos faltantes: {len(archivos_faltantes)}")
        
        if len(archivos_faltantes) == 0 and len(documentos) > 0:
            print("🟢 ESTADO: COMPLETO - Todos los documentos están OK")
        elif len(archivos_faltantes) > 0:
            print("🟡 ESTADO: PROBLEMAS - Hay archivos físicos faltantes")
        elif len(documentos) == 0:
            print("🔴 ESTADO: SIN DOCUMENTOS - No hay documentos subidos")
        
    else:
        print("❌ Usuario NO encontrado en la base de datos")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    consultar_usuario()