#!/usr/bin/env python3
"""
Script de auditoría de integridad de documentos - Versión corregida
Verifica que todos los documentos en la BD existan físicamente en el sistema de archivos
"""

import os
import sys
import subprocess
import json
from datetime import datetime

def get_documents_from_db():
    """Obtiene todos los documentos no archivados de la base de datos"""
    query = """
    SELECT 
        LOWER(HEX(d.id)) as document_id,
        LOWER(HEX(d.user_id)) as user_id,
        ue.email,
        d.file_path,
        d.content_type,
        d.status,
        d.processing_status,
        d.upload_date,
        d.is_archived
    FROM documents d
    LEFT JOIN user_entity ue ON d.user_id = ue.id
    WHERE d.is_archived = 0 
        AND d.file_path IS NOT NULL 
        AND d.file_path != ''
    ORDER BY d.upload_date DESC;
    """
    
    # Ejecutar consulta
    cmd = [
        "docker", "compose", "exec", "-T", "mysql", 
        "mysql", "-u", "root", "-proot1234", "mpd_concursos",
        "-e", query, "--batch", "--raw"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, errors='replace', cwd="/root/concursos/mpd_concursos")
    if result.returncode != 0:
        print(f"ERROR ejecutando consulta: {result.stderr}")
        return []
    
    lines = result.stdout.strip().split('\n')[1:]  # Skip header
    documents = []
    
    for line in lines:
        if line.strip():
            parts = line.split('\t')
            if len(parts) >= 9:
                documents.append({
                    'document_id': parts[0] if parts[0] != 'NULL' else None,
                    'user_id': parts[1] if parts[1] != 'NULL' else None,
                    'email': parts[2] if parts[2] != 'NULL' else None,
                    'file_path': parts[3] if parts[3] != 'NULL' else None,
                    'content_type': parts[4] if parts[4] != 'NULL' else None,
                    'status': parts[5] if parts[5] != 'NULL' else None,
                    'processing_status': parts[6] if parts[6] != 'NULL' else None,
                    'upload_date': parts[7] if parts[7] != 'NULL' else None,
                    'is_archived': parts[8] if parts[8] != 'NULL' else None
                })
    
    return documents

def check_file_exists_in_container(file_path):
    """Verifica si un archivo existe en el contenedor backend"""
    if not file_path:
        return False
    
    # Normalizar el path
    full_path = f"/app/storage/{file_path}" if not file_path.startswith('/') else file_path
    
    cmd = [
        "docker", "compose", "exec", "-T", "backend",
        "test", "-f", full_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, cwd="/root/concursos/mpd_concursos")
    return result.returncode == 0

def audit_documents():
    """Realiza la auditoría completa de documentos"""
    print("🔍 AUDITORÍA DE INTEGRIDAD DE DOCUMENTOS")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Obtener documentos de la BD
    print("📋 Obteniendo documentos de la base de datos...")
    documents = get_documents_from_db()
    
    if not documents:
        print("❌ No se pudieron obtener documentos de la base de datos")
        return
    
    print(f"✅ Se encontraron {len(documents)} documentos no archivados")
    print()
    
    # Contadores
    total_docs = len(documents)
    files_found = 0
    files_missing = 0
    files_error = 0
    
    # Listas para reportes
    missing_files = []
    error_files = []
    
    print("🔍 Verificando existencia física de archivos...")
    print()
    
    for i, doc in enumerate(documents, 1):
        doc_id = doc['document_id'][:8] if doc['document_id'] else 'UNKNOWN'
        email = doc['email'] or 'NO_EMAIL'
        file_path = doc['file_path']
        
        # Mostrar progreso cada 100 documentos
        if i % 100 == 0 or i == total_docs:
            print(f"📊 Progreso: {i}/{total_docs} ({(i/total_docs)*100:.1f}%)")
        
        if not file_path:
            files_error += 1
            error_files.append({
                'document_id': doc_id,
                'email': email,
                'error': 'file_path is NULL or empty'
            })
            continue
        
        # Verificar existencia del archivo
        file_exists = check_file_exists_in_container(file_path)
        
        if file_exists:
            files_found += 1
        else:
            files_missing += 1
            missing_files.append({
                'document_id': doc_id,
                'email': email,
                'file_path': file_path,
                'upload_date': doc['upload_date']
            })
    
    # Reporte final
    print()
    print("📊 REPORTE FINAL DE AUDITORÍA")
    print("=" * 60)
    print(f"📁 Total de documentos auditados: {total_docs}")
    print(f"✅ Archivos encontrados: {files_found}")
    print(f"❌ Archivos faltantes: {files_missing}")
    print(f"⚠️  Errores (paths vacíos): {files_error}")
    print()
    
    if total_docs > 0:
        integrity_pct = (files_found/total_docs)*100
        print(f"📈 Porcentaje de integridad: {integrity_pct:.2f}%")
        
        if integrity_pct >= 95:
            print("🟢 ESTADO: EXCELENTE - Integridad muy alta")
        elif integrity_pct >= 85:
            print("🟡 ESTADO: BUENO - Integridad aceptable")
        elif integrity_pct >= 70:
            print("🟠 ESTADO: REGULAR - Requiere atención")
        else:
            print("🔴 ESTADO: CRÍTICO - Integridad comprometida")
    print()
    
    # Detalles de archivos faltantes
    if missing_files:
        print("❌ ARCHIVOS FALTANTES (primeros 15):")
        print("-" * 40)
        for i, file in enumerate(missing_files[:15], 1):
            print(f"{i:2d}. 📧 {file['email']}")
            print(f"    📄 ID: {file['document_id']}")
            print(f"    📂 Path: {file['file_path']}")
            print(f"    📅 Upload: {file['upload_date']}")
            print()
        
        if len(missing_files) > 15:
            print(f"... y {len(missing_files) - 15} archivos faltantes más")
        print()
    
    # Errores
    if error_files:
        print("⚠️  DOCUMENTOS CON ERRORES:")
        print("-" * 40)
        for i, file in enumerate(error_files[:10], 1):
            print(f"{i:2d}. 📧 {file['email']} - ID: {file['document_id']} - Error: {file['error']}")
        if len(error_files) > 10:
            print(f"... y {len(error_files) - 10} errores más")
        print()
    
    # Guardar reporte detallado
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_filename = f"document_integrity_report_{timestamp}.json"
    
    report = {
        'audit_date': datetime.now().isoformat(),
        'summary': {
            'total_documents': total_docs,
            'files_found': files_found,
            'files_missing': files_missing,
            'files_error': files_error,
            'integrity_percentage': round((files_found/total_docs)*100, 2) if total_docs > 0 else 0
        },
        'missing_files': missing_files,
        'error_files': error_files
    }
    
    with open(report_filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"💾 Reporte detallado guardado en: {report_filename}")
    
    return report

if __name__ == "__main__":
    try:
        audit_documents()
    except Exception as e:
        print(f"❌ Error durante la auditoría: {e}")
        sys.exit(1)
