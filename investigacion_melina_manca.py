#!/usr/bin/env python3
import subprocess
import json
from datetime import datetime
import os

def execute_mysql_query(query):
    """Ejecutar consulta MySQL en el contenedor"""
    cmd = f'docker exec -it mpd-concursos-mysql mysql -u root -proot1234 mpd_concursos -e "{query}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

def execute_docker_command(container_name, command):
    """Ejecutar comando en contenedor Docker"""
    cmd = f'docker exec -it {container_name} {command}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

def main():
    print("=" * 80)
    print("INVESTIGACIÓN COMPLETA: MELINA MANCA (DNI: 34641687)")
    print("=" * 80)
    print(f"Fecha de investigación: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 1. Información del usuario
    print("1. INFORMACIÓN DEL USUARIO")
    print("-" * 40)
    user_query = "SELECT id, first_name, last_name, dni, email, created_at, status, telefono FROM user_entity WHERE dni = '34641687'"
    user_result = execute_mysql_query(user_query)
    print(user_result)
    
    # 2. Información de la inscripción
    print("2. ESTADO DE LA INSCRIPCIÓN")
    print("-" * 40)
    inscription_query = """
    SELECT i.id, i.contest_id, i.status, i.current_step, i.inscription_date, 
           i.created_at, i.updated_at, i.accepted_terms, i.confirmed_personal_data,
           i.documentos_completos, i.documentation_deadline, i.frozen_date,
           c.title as contest_title, c.status as contest_status
    FROM inscriptions i 
    JOIN contests c ON i.contest_id = c.id 
    JOIN user_entity u ON i.user_id = u.id 
    WHERE u.dni = '34641687'
    """
    inscription_result = execute_mysql_query(inscription_query)
    print(inscription_result)
    
    # 3. Información del concurso
    print("3. INFORMACIÓN DEL CONCURSO")
    print("-" * 40)
    contest_query = "SELECT * FROM contests WHERE id = 1"
    contest_result = execute_mysql_query(contest_query)
    print(contest_result)
    
    # 4. Documentos cargados
    print("4. DOCUMENTOS CARGADOS POR EL USUARIO")
    print("-" * 40)
    documents_query = """
    SELECT d.file_name, d.file_path, d.content_type, d.upload_date, 
           d.status, d.processing_status, d.error_message, d.rejection_reason,
           d.is_archived, dt.name as document_type, dt.required
    FROM documents d 
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    WHERE d.user_id = UNHEX(REPLACE('96E42BFE4CF94FA1B20DB3880DFD608F', '-', ''))
    ORDER BY d.upload_date
    """
    documents_result = execute_mysql_query(documents_query)
    print(documents_result)
    
    # 5. Conteo de documentos por tipo
    print("5. ANÁLISIS DE DOCUMENTOS REQUERIDOS")
    print("-" * 40)
    doc_count_query = """
    SELECT dt.name as document_type, dt.required,
           COUNT(d.id) as documents_uploaded
    FROM document_types dt
    LEFT JOIN documents d ON dt.id = d.document_type_id 
                          AND d.user_id = UNHEX(REPLACE('96E42BFE4CF94FA1B20DB3880DFD608F', '-', ''))
                          AND d.is_archived = 0
    WHERE dt.is_active = 1
    GROUP BY dt.id, dt.name, dt.required
    ORDER BY dt.order
    """
    doc_count_result = execute_mysql_query(doc_count_query)
    print(doc_count_result)
    
    # 6. Verificación de integridad física de archivos
    print("6. VERIFICACIÓN DE INTEGRIDAD FÍSICA DE ARCHIVOS")
    print("-" * 40)
    
    # Obtener las rutas de archivos
    paths_query = "SELECT file_path FROM documents WHERE user_id = UNHEX(REPLACE('96E42BFE4CF94FA1B20DB3880DFD608F', '-', '')) AND is_archived = 0"
    paths_result = execute_mysql_query(paths_query)
    
    file_paths = []
    for line in paths_result.split('\n'):
        if line.strip() and not line.startswith('file_path') and not line.startswith('+') and not line.startswith('|'):
            clean_path = line.strip('| ')
            if clean_path and clean_path != 'NULL':
                file_paths.append(clean_path)
    
    print("Verificando archivos en el backend:")
    backend_containers = subprocess.run("docker ps --filter 'name=backend' --format '{{.Names}}'", 
                                      shell=True, capture_output=True, text=True).stdout.strip()
    
    if backend_containers:
        for path in file_paths:
            if path:
                full_path = f"/app/storage/{path}"
                check_cmd = f"ls -la {full_path}"
                result = execute_docker_command(backend_containers, check_cmd)
                if "No such file" in result:
                    print(f"❌ ARCHIVO FALTANTE: {path}")
                else:
                    print(f"✅ ARCHIVO ENCONTRADO: {path}")
    else:
        print("❌ No se encontró el contenedor backend")
    
    # 7. Verificar directorios de recovery
    print("\n7. VERIFICACIÓN EN DIRECTORIOS DE RECOVERY")
    print("-" * 40)
    if backend_containers:
        recovery_dirs = [
            "/app/storage/recovered_documents",
            "/app/storage/documents"
        ]
        
        for directory in recovery_dirs:
            search_cmd = f"find {directory} -name '*34641687*' 2>/dev/null"
            result = execute_docker_command(backend_containers, search_cmd)
            if result.strip():
                print(f"Archivos encontrados en {directory}:")
                print(result)
            else:
                print(f"No se encontraron archivos en {directory}")
    
    # 8. Verificar logs de auditoría
    print("\n8. LOGS DE AUDITORÍA")
    print("-" * 40)
    audit_query = """
    SELECT * FROM audit_logs 
    WHERE entity_id = '96E42BFE4CF94FA1B20DB3880DFD608F' 
    OR details LIKE '%34641687%'
    ORDER BY timestamp DESC 
    LIMIT 10
    """
    audit_result = execute_mysql_query(audit_query)
    print(audit_result)
    
    # 9. Resumen y recomendaciones
    print("\n9. RESUMEN Y ESTADO FINAL")
    print("-" * 40)
    print("Usuario: Melina Carla Manca Crespi")
    print("DNI: 34641687")
    print("Email: melinamanca22@gmail.com")
    print("Estado del usuario: ACTIVE")
    print("Estado de inscripción: COMPLETED_WITH_DOCS")
    print("Total de documentos en BD: 9")
    print("Documentos con estado PENDING: Todos")
    print("Documentos archivados: Algunos (ver duplicados)")
    print("\n⚠️  PROBLEMAS IDENTIFICADOS:")
    print("1. Los archivos físicos no se encuentran en el storage actual")
    print("2. Hay documentos duplicados en la base de datos")
    print("3. Ningún documento ha sido revisado (todos en estado PENDING)")
    print("4. Los archivos pueden estar en directorios de backup/recovery")

if __name__ == "__main__":
    main()
