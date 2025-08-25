#!/usr/bin/env python3
"""
Script para detectar documentos faltantes en inscripciones COMPLETED_WITH_DOCS
"""
import subprocess
import os
import sys
from datetime import datetime

def run_mysql_query(query):
    """Ejecuta una consulta MySQL y retorna los resultados"""
    cmd = [
        'docker', 'exec', '-i', 'mpd-concursos-mysql',
        'mysql', '-u', 'root', '-proot1234', '-D', 'mpd_concursos',
        '-e', query
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, stderr=subprocess.DEVNULL)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:  # Skip header
                return [line.split('\t') for line in lines[1:] if line.strip()]
        return []
    except Exception as e:
        print(f"Error ejecutando consulta: {e}")
        return []

def check_file_exists(file_path):
    """Verifica si un archivo existe en el sistema de storage"""
    full_path = f"/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/{file_path}"
    return os.path.exists(full_path)

def main():
    print("=== DETECCIÓN DE DOCUMENTOS FALTANTES - INSCRIPCIONES COMPLETED_WITH_DOCS ===")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Consulta para obtener todos los documentos de inscripciones COMPLETED_WITH_DOCS
    query = """
    SELECT 
        d.file_path,
        u.dni,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        dt.name as document_type,
        d.status as document_status,
        d.upload_date
    FROM inscriptions i
    JOIN user_entity u ON i.user_id = u.id
    JOIN documents d ON d.user_id = u.id
    JOIN document_types dt ON d.document_type_id = dt.id
    WHERE i.status = 'COMPLETED_WITH_DOCS'
        AND d.is_archived = 0
        AND d.file_path IS NOT NULL
        AND d.file_path != ''
    ORDER BY u.dni, d.upload_date;
    """
    
    print("🔍 Obteniendo documentos de inscripciones COMPLETED_WITH_DOCS...")
    documents = run_mysql_query(query)
    
    if not documents:
        print("❌ No se pudieron obtener los documentos de la base de datos")
        return
        
    print(f"📊 Total documentos encontrados: {len(documents)}")
    print()
    
    missing_files = []
    existing_files = []
    
    print("🔍 Verificando existencia física de archivos...")
    
    for i, doc in enumerate(documents, 1):
        if len(doc) >= 6:
            file_path, dni, full_name, document_type, document_status, upload_date = doc[:6]
            
            if check_file_exists(file_path):
                existing_files.append({
                    'file_path': file_path,
                    'dni': dni,
                    'full_name': full_name,
                    'document_type': document_type,
                    'document_status': document_status,
                    'upload_date': upload_date
                })
                status = "✅"
            else:
                missing_files.append({
                    'file_path': file_path,
                    'dni': dni,
                    'full_name': full_name,
                    'document_type': document_type,
                    'document_status': document_status,
                    'upload_date': upload_date
                })
                status = "❌"
            
            # Mostrar progreso cada 50 archivos
            if i % 50 == 0:
                print(f"  Procesados: {i}/{len(documents)} archivos...")
        
        # Para evitar output muy largo, solo mostrar algunos ejemplos
        if i <= 10:
            print(f"  {status} {file_path} ({dni} - {document_type})")
    
    print()
    print("=== RESUMEN FINAL ===")
    print(f"📊 Total documentos procesados: {len(documents)}")
    print(f"✅ Documentos existentes: {len(existing_files)}")
    print(f"❌ Documentos faltantes: {len(missing_files)}")
    print(f"📈 Porcentaje de consistencia: {(len(existing_files)/len(documents)*100):.1f}%")
    print()
    
    if missing_files:
        print("=== ARCHIVOS FALTANTES ===")
        
        # Guardar lista completa en archivo
        with open('missing_files_COMPLETED_WITH_DOCS.txt', 'w') as f:
            f.write("# Archivos faltantes en inscripciones COMPLETED_WITH_DOCS\n")
            f.write(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# Total faltantes: {len(missing_files)}\n\n")
            
            for doc in missing_files:
                f.write(f"{doc['file_path']}\n")
        
        # Mostrar estadísticas por estado de documento
        status_count = {}
        for doc in missing_files:
            status = doc['document_status']
            status_count[status] = status_count.get(status, 0) + 1
        
        print("📋 Documentos faltantes por estado:")
        for status, count in status_count.items():
            print(f"  {status}: {count} documentos")
        
        print()
        print("📋 Primeros 10 documentos faltantes:")
        for i, doc in enumerate(missing_files[:10], 1):
            print(f"  {i}. DNI {doc['dni']} - {doc['document_type']} ({doc['document_status']})")
            print(f"     Archivo: {doc['file_path']}")
            print(f"     Usuario: {doc['full_name']}")
            print()
        
        if len(missing_files) > 10:
            print(f"  ... y {len(missing_files) - 10} documentos más")
        
        print(f"💾 Lista completa guardada en: missing_files_COMPLETED_WITH_DOCS.txt")
    else:
        print("🎉 ¡Todos los documentos existen físicamente!")

if __name__ == "__main__":
    main()
