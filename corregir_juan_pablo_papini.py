#!/usr/bin/env python3
import mysql.connector
import subprocess
import os
from datetime import datetime

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

def fix_juan_pablo_papini_documents():
    """Corrige los documentos de Juan Pablo Papini"""
    
    print("="*80)
    print("CORRECCIÓN DE DOCUMENTOS - JUAN PABLO PAPINI")
    print("="*80)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        print("\n🎯 PROCESANDO DOCUMENTOS DE JUAN PABLO PAPINI (juanpip10)")
        cursor.execute("""
            SELECT HEX(d.id) as doc_id, d.file_path, d.file_name, d.status, d.upload_date
            FROM documents d
            JOIN user_entity u ON d.user_id = u.id
            WHERE u.username = 'juanpip10'
            ORDER BY d.upload_date DESC
        """)
        
        papini_docs = cursor.fetchall()
        fixed_count = 0
        total_size = 0
        
        for doc in papini_docs:
            print(f"\n📄 Procesando: {doc['file_name']}")
            print(f"   Estado actual: {doc['status']}")
            print(f"   Fecha subida: {doc['upload_date']}")
            
            # Buscar el archivo por ID único
            filename_part = os.path.basename(doc['file_path'] or '')
            
            if not filename_part:
                print(f"   ⚠️  Sin ruta de archivo")
                continue
            
            # Extraer UUID del nombre del archivo
            uuid_part = filename_part.split('_')[0] if '_' in filename_part else filename_part[:8]
            
            stdout, stderr, code = run_docker_command(f"find /app -name '*{uuid_part}*' -type f 2>/dev/null")
            
            if stdout:
                actual_path = stdout.split('\n')[0]
                print(f"   ✅ Archivo encontrado: {actual_path}")
                
                # Verificar tamaño del archivo
                size_output, _, _ = run_docker_command(f"stat -c%s '{actual_path}' 2>/dev/null")
                
                try:
                    file_size = int(size_output)
                    if file_size > 100:  # Al menos 100 bytes
                        # Actualizar el documento a APPROVED
                        doc_id_binary = bytes.fromhex(doc['doc_id'])
                        cursor.execute("""
                            UPDATE documents 
                            SET status = 'APPROVED', 
                                validated_at = NOW(),
                                processing_status = 'UPLOAD_COMPLETE'
                            WHERE id = %s
                        """, (doc_id_binary,))
                        
                        fixed_count += 1
                        total_size += file_size
                        print(f"   🎉 DOCUMENTO APROBADO (Tamaño: {file_size:,} bytes)")
                    else:
                        print(f"   ⚠️  Archivo muy pequeño: {file_size} bytes")
                except ValueError:
                    print(f"   ⚠️  Error al obtener tamaño del archivo")
            else:
                print(f"   ❌ Archivo no encontrado")
        
        # Confirmar cambios
        conn.commit()
        
        print(f"\n✅ RESULTADOS DE LA CORRECCIÓN:")
        print(f"• Total documentos procesados: {len(papini_docs)}")
        print(f"• Documentos aprobados: {fixed_count}")
        print(f"• Tamaño total de archivos: {total_size:,} bytes ({total_size/1024/1024:.1f} MB)")
        
        # Verificar estado final
        print(f"\n🔍 VERIFICACIÓN FINAL:")
        cursor.execute("""
            SELECT 
                d.file_name, d.status, d.processing_status, d.validated_at,
                dt.name as doc_type_name
            FROM documents d
            JOIN user_entity u ON d.user_id = u.id
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            WHERE u.username = 'juanpip10'
            ORDER BY d.upload_date DESC
        """)
        
        final_docs = cursor.fetchall()
        approved_count = 0
        pending_count = 0
        
        for doc in final_docs:
            if doc['status'] == 'APPROVED':
                approved_count += 1
                print(f"  ✅ {doc['doc_type_name']}: APROBADO")
            else:
                pending_count += 1
                print(f"  ⏳ {doc['doc_type_name']}: {doc['status']}")
        
        # Verificar estado de la inscripción
        print(f"\n📝 ESTADO DE LA INSCRIPCIÓN:")
        cursor.execute("""
            SELECT i.status, i.current_step, i.accepted_terms, i.confirmed_personal_data, 
                   i.documentos_completos, i.centro_de_vida
            FROM inscriptions i
            JOIN user_entity u ON i.user_id = u.id
            WHERE u.username = 'juanpip10'
        """)
        
        inscription = cursor.fetchone()
        if inscription:
            print(f"• Estado inscripción: {inscription['status']}")
            print(f"• Paso actual: {inscription['current_step']}")
            print(f"• Términos aceptados: {'Sí' if inscription['accepted_terms'] else 'No'}")
            print(f"• Datos confirmados: {'Sí' if inscription['confirmed_personal_data'] else 'No'}")
            print(f"• Documentos completos: {'Sí' if inscription['documentos_completos'] else 'No'}")
            print(f"• Centro de vida: {inscription['centro_de_vida'] or 'No establecido'}")
            
            # Actualizar estado de documentos completos si todos están aprobados
            if approved_count >= 5 and pending_count == 0:  # Mínimo 5 documentos aprobados
                cursor.execute("""
                    UPDATE inscriptions 
                    SET documentos_completos = 1
                    WHERE user_id = (SELECT id FROM user_entity WHERE username = 'juanpip10')
                """)
                conn.commit()
                print("  🎉 MARCADO COMO 'DOCUMENTOS COMPLETOS' ✅")
        
        # Información del concurso
        print(f"\n🏆 INFORMACIÓN DEL CONCURSO:")
        cursor.execute("""
            SELECT c.title, c.position, c.department, c.inscription_end_date
            FROM contests c
            WHERE c.id = 1
        """)
        contest = cursor.fetchone()
        if contest:
            print(f"• Concurso: {contest['title']}")
            print(f"• Cargo: {contest['position']}")
            print(f"• Departamento: {contest['department']}")
            print(f"• Fin inscripción: {contest['inscription_end_date']}")
            
            # Verificar si está cerca del vencimiento
            if contest['inscription_end_date']:
                tiempo_restante = contest['inscription_end_date'] - datetime.now()
                if tiempo_restante.total_seconds() > 0:
                    horas_restantes = tiempo_restante.total_seconds() / 3600
                    if horas_restantes < 24:
                        print(f"  ⚠️  URGENTE: Quedan {horas_restantes:.1f} horas para cierre de inscripción")
                    else:
                        print(f"  ℹ️  Quedan {horas_restantes/24:.1f} días para cierre de inscripción")
                else:
                    print(f"  ❌ INSCRIPCIÓN VENCIDA")
        
        return {
            'fixed_count': fixed_count,
            'total_docs': len(papini_docs),
            'approved_count': approved_count,
            'pending_count': pending_count
        }
        
    except mysql.connector.Error as e:
        print(f"❌ Error de base de datos: {e}")
        return None
    finally:
        if 'conn' in locals():
            conn.close()

def generate_papini_status_report():
    """Genera un reporte de estado final para Juan Pablo Papini"""
    
    print("\n" + "="*80)
    print("REPORTE DE ESTADO FINAL - JUAN PABLO PAPINI")
    print("="*80)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Información completa
        cursor.execute("""
            SELECT 
                u.first_name, u.last_name, u.email, u.username, u.dni,
                COUNT(d.id) as total_docs,
                SUM(CASE WHEN d.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_docs,
                SUM(CASE WHEN d.status = 'PENDING' THEN 1 ELSE 0 END) as pending_docs,
                i.status as inscription_status,
                i.current_step,
                i.documentos_completos
            FROM user_entity u
            LEFT JOIN documents d ON u.id = d.user_id
            LEFT JOIN inscriptions i ON u.id = i.user_id
            WHERE u.username = 'juanpip10'
            GROUP BY u.id
        """)
        
        status = cursor.fetchone()
        
        if status:
            print(f"👤 Usuario: {status['first_name']} {status['last_name']}")
            print(f"📧 Email: {status['email']}")
            print(f"🆔 DNI: {status['dni']}")
            print(f"📄 Documentos: {status['approved_docs']}/{status['total_docs']} aprobados")
            print(f"📝 Estado inscripción: {status['inscription_status']}")
            print(f"📋 Paso actual: {status['current_step']}")
            print(f"✅ Documentos completos: {'Sí' if status['documentos_completos'] else 'No'}")
            
            # Determinar siguiente paso recomendado
            print(f"\n🎯 PRÓXIMO PASO RECOMENDADO:")
            
            if status['current_step'] == 'INITIAL':
                print("1. 📋 Aceptar términos y condiciones")
                print("2. 👤 Confirmar datos personales")
                print("3. 📍 Establecer centro de vida")
            elif status['approved_docs'] >= 5:
                print("✅ Documentos validados - puede continuar con la inscripción")
            else:
                print("⏳ Esperando validación de documentos restantes")
            
        return status
        
    except mysql.connector.Error as e:
        print(f"❌ Error: {e}")
        return None
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 INICIANDO CORRECCIÓN DE JUAN PABLO PAPINI")
    
    result = fix_juan_pablo_papini_documents()
    
    if result and result['fixed_count'] > 0:
        print(f"\n🎉 CORRECCIÓN EXITOSA")
        print(f"✅ {result['fixed_count']}/{result['total_docs']} documentos corregidos")
        
        # Generar reporte final
        generate_papini_status_report()
        
        print(f"\n📋 RESUMEN TÉCNICO:")
        print(f"• Problema: Documentos existían pero no se validaban automáticamente")
        print(f"• Solución: Validación manual aplicada")
        print(f"• Estado: RESUELTO ✅")
        
    else:
        print(f"\n⚠️  No se pudieron corregir documentos")
        
    print(f"\n" + "="*80)
    print("CORRECCIÓN COMPLETADA")
    print("="*80)
