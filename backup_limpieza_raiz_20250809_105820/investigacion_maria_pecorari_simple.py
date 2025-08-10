#!/usr/bin/env python3
"""
Script simplificado para investigar el usuario María de los Milagros Pecorari Sosa
DNI: 39380028
"""

import mysql.connector
from datetime import datetime
import sys

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'database': 'mpd_concursos',
    'user': 'mpd_user',
    'password': 'mpd_password_secure'
}

def main():
    dni = "39380028"
    
    print("="*80)
    print(f"INVESTIGACIÓN USUARIO MARÍA DE LOS MILAGROS PECORARI SOSA")
    print(f"DNI: {dni}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Buscar usuario básico
        print("\n🔍 BUSCANDO USUARIO...")
        query_user = "SELECT HEX(id) as id, first_name, last_name, dni, email, status, created_at FROM user_entity WHERE dni = %s"
        cursor.execute(query_user, (dni,))
        usuario = cursor.fetchone()
        
        if not usuario:
            print(f"❌ NO SE ENCONTRÓ USUARIO CON DNI: {dni}")
            return
        
        print(f"✅ USUARIO ENCONTRADO:")
        print(f"   • ID: {usuario['id']}")
        print(f"   • Nombre: {usuario['first_name']} {usuario['last_name']}")
        print(f"   • Email: {usuario['email']}")
        print(f"   • Estado: {usuario['status']}")
        print(f"   • Registrado: {usuario['created_at']}")
        
        user_id_hex = usuario['id']
        
        # 2. Buscar inscripciones
        print(f"\n📝 INSCRIPCIONES:")
        query_inscripciones = """
        SELECT HEX(id) as id, contest_id, status, current_step, inscription_date, 
               documentos_completos, accepted_terms, confirmed_personal_data
        FROM inscriptions 
        WHERE HEX(user_id) = %s 
        ORDER BY inscription_date DESC
        """
        cursor.execute(query_inscripciones, (user_id_hex,))
        inscripciones = cursor.fetchall()
        
        if inscripciones:
            print(f"   📊 Total: {len(inscripciones)} inscripciones")
            for i, insc in enumerate(inscripciones, 1):
                print(f"\n   {i}. Inscripción ID: {insc['id']}")
                print(f"      • Concurso ID: {insc['contest_id']}")
                print(f"      • Estado: {insc['status']}")
                print(f"      • Paso actual: {insc['current_step']}")
                print(f"      • Fecha: {insc['inscription_date']}")
                print(f"      • Documentos completos: {'✅ SÍ' if insc['documentos_completos'] else '❌ NO'}")
                print(f"      • Términos aceptados: {'✅ SÍ' if insc['accepted_terms'] else '❌ NO'}")
                print(f"      • Datos confirmados: {'✅ SÍ' if insc['confirmed_personal_data'] else '❌ NO'}")
        else:
            print("   ❌ No se encontraron inscripciones")
        
        # 3. Buscar documentos
        print(f"\n📄 DOCUMENTOS:")
        query_docs = """
        SELECT HEX(d.id) as id, d.file_name, d.file_path, d.status, 
               d.processing_status, d.upload_date, d.validated_at,
               dt.name as tipo_documento
        FROM documents d
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        WHERE HEX(d.user_id) = %s 
        ORDER BY d.upload_date DESC
        """
        cursor.execute(query_docs, (user_id_hex,))
        documentos = cursor.fetchall()
        
        if documentos:
            print(f"   📊 Total: {len(documentos)} documentos")
            for i, doc in enumerate(documentos, 1):
                print(f"\n   {i}. Documento: {doc['file_name']}")
                print(f"      • Tipo: {doc['tipo_documento'] or 'No especificado'}")
                print(f"      • Estado: {doc['status']}")
                print(f"      • Estado procesamiento: {doc['processing_status']}")
                print(f"      • Subido: {doc['upload_date']}")
                print(f"      • Validado: {'✅ ' + str(doc['validated_at']) if doc['validated_at'] else '❌ NO'}")
                print(f"      • Ruta: {doc['file_path'] or 'Sin ruta'}")
        else:
            print("   ❌ No se encontraron documentos")
        
        # 4. Verificar archivos físicos si existen documentos
        if documentos:
            print(f"\n🔍 VERIFICACIÓN DE ARCHIVOS FÍSICOS:")
            import os
            storage_paths = [
                '/root/concursos/mpd_concursos/storage',
                '/var/lib/docker/volumes/mpd_concursos_storage/_data',
                './storage'
            ]
            
            archivos_encontrados = 0
            for doc in documentos:
                if doc['file_path']:
                    archivo_existe = False
                    for base_path in storage_paths:
                        full_path = os.path.join(base_path, doc['file_path'])
                        if os.path.exists(full_path):
                            archivo_existe = True
                            archivos_encontrados += 1
                            stat = os.stat(full_path)
                            print(f"   ✅ {doc['file_name']} - {stat.st_size} bytes")
                            break
                    
                    if not archivo_existe:
                        print(f"   ❌ {doc['file_name']} - ARCHIVO FALTANTE")
                else:
                    print(f"   ⚠️  {doc['file_name']} - SIN RUTA")
            
            print(f"\n   📊 Resumen archivos: {archivos_encontrados}/{len(documentos)} encontrados")
        
        # 5. Resumen final
        print(f"\n" + "="*80)
        print(f"📊 RESUMEN FINAL:")
        print(f"   • Usuario: {usuario['status']}")
        print(f"   • Inscripciones: {len(inscripciones)}")
        print(f"   • Documentos: {len(documentos)}")
        if documentos:
            docs_validados = sum(1 for doc in documentos if doc['validated_at'])
            docs_pendientes = sum(1 for doc in documentos if doc['status'] == 'PENDING')
            docs_aprobados = sum(1 for doc in documentos if doc['status'] == 'APPROVED')
            docs_rechazados = sum(1 for doc in documentos if doc['status'] == 'REJECTED')
            
            print(f"   • Documentos validados: {docs_validados}")
            print(f"   • Documentos pendientes: {docs_pendientes}")
            print(f"   • Documentos aprobados: {docs_aprobados}")
            print(f"   • Documentos rechazados: {docs_rechazados}")
        print("="*80)
        
        # Guardar reporte
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"investigacion_maria_pecorari_{timestamp}.md"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# Investigación María de los Milagros Pecorari Sosa\n\n")
            f.write(f"**DNI:** {dni}\n")
            f.write(f"**Fecha:** {datetime.now().isoformat()}\n\n")
            
            f.write("## Usuario\n")
            f.write(f"- **ID:** {usuario['id']}\n")
            f.write(f"- **Nombre:** {usuario['first_name']} {usuario['last_name']}\n")
            f.write(f"- **Email:** {usuario['email']}\n")
            f.write(f"- **Estado:** {usuario['status']}\n\n")
            
            f.write(f"## Inscripciones ({len(inscripciones)})\n")
            for insc in inscripciones:
                f.write(f"- Concurso {insc['contest_id']}: {insc['status']} ({insc['current_step']})\n")
            
            f.write(f"\n## Documentos ({len(documentos)})\n")
            for doc in documentos:
                f.write(f"- {doc['file_name']}: {doc['status']}\n")
        
        print(f"\n💾 Reporte guardado: {filename}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
