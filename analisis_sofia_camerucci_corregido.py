#!/usr/bin/env python3
import mysql.connector
import json
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

def get_user_analysis(username):
    """Obtiene un análisis completo del usuario Sofia Camerucci"""
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Información básica del usuario
        cursor.execute("""
            SELECT HEX(id) as user_id, username, email, first_name, last_name, 
                   dni, status, telefono, birth_date, direccion, municipality, 
                   province, country, cuit, legal_address, residential_address,
                   created_at
            FROM user_entity 
            WHERE username = %s
        """, (username,))
        
        user_info = cursor.fetchone()
        
        if not user_info:
            print(f"Usuario {username} no encontrado")
            return None
        
        user_id_hex = user_info['user_id']
        user_id_binary = bytes.fromhex(user_id_hex)
        
        print("="*80)
        print(f"ANÁLISIS COMPLETO DE SOFIA CAMERUCCI ({username})")
        print("="*80)
        print("\n📋 INFORMACIÓN BÁSICA DEL USUARIO:")
        print(f"• ID: {user_id_hex}")
        print(f"• Nombre: {user_info['first_name']} {user_info['last_name']}")
        print(f"• DNI: {user_info['dni']}")
        print(f"• Email: {user_info['email']}")
        print(f"• Username: {user_info['username']}")
        print(f"• Estado: {user_info['status']}")
        print(f"• Teléfono: {user_info['telefono'] or 'No registrado'}")
        print(f"• Fecha de nacimiento: {user_info['birth_date'] or 'No registrada'}")
        print(f"• Dirección: {user_info['direccion'] or 'No registrada'}")
        print(f"• Municipio: {user_info['municipality'] or 'No registrado'}")
        print(f"• Provincia: {user_info['province'] or 'No registrada'}")
        print(f"• País: {user_info['country'] or 'No registrado'}")
        print(f"• CUIT: {user_info['cuit'] or 'No registrado'}")
        print(f"• Fecha de registro: {user_info['created_at']}")
        
        # Inscripciones
        cursor.execute("""
            SELECT HEX(id) as inscription_id, contest_id, status, current_step,
                   accepted_terms, confirmed_personal_data, documentos_completos,
                   centro_de_vida, created_at, updated_at, inscription_date,
                   terms_acceptance_date, data_confirmation_date, frozen_date
            FROM inscriptions 
            WHERE user_id = %s
        """, (user_id_binary,))
        
        inscriptions = cursor.fetchall()
        
        print(f"\n📝 INSCRIPCIONES ({len(inscriptions)}):")
        if inscriptions:
            for i, insc in enumerate(inscriptions, 1):
                print(f"\n  Inscripción #{i}:")
                print(f"  • ID: {insc['inscription_id']}")
                print(f"  • Concurso ID: {insc['contest_id']}")
                print(f"  • Estado: {insc['status']}")
                print(f"  • Paso actual: {insc['current_step']}")
                print(f"  • Términos aceptados: {'Sí' if insc['accepted_terms'] else 'No'}")
                print(f"  • Datos confirmados: {'Sí' if insc['confirmed_personal_data'] else 'No'}")
                print(f"  • Documentos completos: {'Sí' if insc['documentos_completos'] else 'No'}")
                print(f"  • Centro de vida: {insc['centro_de_vida'] or 'No establecido'}")
                print(f"  • Fecha de inscripción: {insc['inscription_date']}")
                print(f"  • Términos aceptados en: {insc['terms_acceptance_date']}")
                print(f"  • Datos confirmados en: {insc['data_confirmation_date']}")
                print(f"  • Fecha congelada: {insc['frozen_date']}")
                print(f"  • Última actualización: {insc['updated_at']}")
        else:
            print("  • No tiene inscripciones activas")
        
        # Documentos
        cursor.execute("""
            SELECT HEX(id) as doc_id, HEX(document_type_id) as doc_type_id,
                   file_name, file_path, status, processing_status,
                   upload_date, validated_at, comments, rejection_reason,
                   content_type, is_archived, archived_at, version
            FROM documents 
            WHERE user_id = %s
            ORDER BY upload_date DESC
        """, (user_id_binary,))
        
        documents = cursor.fetchall()
        
        # Obtener tipos de documentos
        doc_types = {}
        if documents:
            cursor.execute("SELECT HEX(id) as id, name FROM document_types")
            for dt in cursor.fetchall():
                doc_types[dt['id']] = dt['name']
        
        print(f"\n📄 DOCUMENTOS ({len(documents)}):")
        if documents:
            for i, doc in enumerate(documents, 1):
                doc_type_name = doc_types.get(doc['doc_type_id'], 'Tipo desconocido')
                print(f"\n  Documento #{i}:")
                print(f"  • ID: {doc['doc_id']}")
                print(f"  • Tipo: {doc_type_name}")
                print(f"  • Nombre archivo: {doc['file_name']}")
                print(f"  • Ruta: {doc['file_path']}")
                print(f"  • Estado: {doc['status']}")
                print(f"  • Estado procesamiento: {doc['processing_status']}")
                print(f"  • Tipo de contenido: {doc['content_type']}")
                print(f"  • Fecha subida: {doc['upload_date']}")
                print(f"  • Validado en: {doc['validated_at'] or 'No validado'}")
                print(f"  • Versión: {doc['version']}")
                print(f"  • Archivado: {'Sí' if doc['is_archived'] else 'No'}")
                print(f"  • Comentarios: {doc['comments'] or 'Sin comentarios'}")
                print(f"  • Razón rechazo: {doc['rejection_reason'] or 'N/A'}")
        else:
            print("  • No tiene documentos registrados")
        
        # Logs de auditoría
        cursor.execute("""
            SELECT event_type, description, outcome, timestamp, ip_address
            FROM audit_logs 
            WHERE username = %s
            ORDER BY timestamp DESC
            LIMIT 15
        """, (username,))
        
        logs = cursor.fetchall()
        
        print(f"\n📊 ACTIVIDAD RECIENTE ({len(logs)} eventos):")
        if logs:
            for log in logs:
                print(f"  • {log['timestamp']}: {log['event_type']} - {log['description']} ({log['outcome']})")
        else:
            print("  • No hay registros de actividad")
        
        # Notificaciones
        cursor.execute("""
            SELECT type, message, status, created_at
            FROM notifications 
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (user_id_binary,))
        
        notifications = cursor.fetchall()
        
        print(f"\n🔔 NOTIFICACIONES ({len(notifications)}):")
        if notifications:
            for notif in notifications:
                print(f"  • {notif['created_at']}: [{notif['type']}] {notif['message']} - Estado: {notif['status']}")
        else:
            print("  • No tiene notificaciones")
        
        # Estadísticas generales
        pending_docs = [d for d in documents if d['status'] == 'PENDING']
        approved_docs = [d for d in documents if d['status'] == 'APPROVED']
        rejected_docs = [d for d in documents if d['status'] == 'REJECTED']
        
        print(f"\n📈 RESUMEN DEL ESTADO:")
        print(f"  • Total inscripciones: {len(inscriptions)}")
        print(f"  • Total documentos: {len(documents)}")
        print(f"  • Documentos pendientes: {len(pending_docs)}")
        print(f"  • Documentos aprobados: {len(approved_docs)}")
        print(f"  • Documentos rechazados: {len(rejected_docs)}")
        print(f"  • Última actividad: {logs[0]['timestamp'] if logs else 'Sin actividad registrada'}")
        
        # Análisis de problemas
        problems = []
        recommendations = []
        
        if not inscriptions:
            problems.append("❌ No tiene inscripciones activas")
            recommendations.append("💡 El usuario debe completar el proceso de inscripción")
        
        if pending_docs:
            problems.append(f"⏳ Tiene {len(pending_docs)} documentos pendientes de validación")
            recommendations.append("💡 Revisar y validar los documentos pendientes")
        
        if rejected_docs:
            problems.append(f"❌ Tiene {len(rejected_docs)} documentos rechazados")
            recommendations.append("💡 Notificar al usuario sobre documentos rechazados y solicitar resubmisión")
        
        if not user_info['telefono']:
            problems.append("❌ No tiene teléfono registrado")
            recommendations.append("💡 Solicitar al usuario que complete su información de contacto")
        
        # Verificar archivos físicos
        missing_files = []
        for doc in documents:
            if doc['file_path']:
                file_exists = os.path.exists(doc['file_path'])
                if not file_exists:
                    missing_files.append(doc['file_path'])
        
        if missing_files:
            problems.append(f"🗂️  {len(missing_files)} archivos físicos no encontrados")
            recommendations.append("💡 Verificar integridad del sistema de archivos")
        
        print(f"\n⚠️  PROBLEMAS IDENTIFICADOS ({len(problems)}):")
        if problems:
            for i, problem in enumerate(problems, 1):
                print(f"  {i}. {problem}")
        else:
            print("  ✅ No se identificaron problemas críticos")
        
        print(f"\n💡 RECOMENDACIONES ({len(recommendations)}):")
        if recommendations:
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        else:
            print("  ✅ No hay recomendaciones específicas")
        
        print("\n" + "="*80)
        print("FIN DEL ANÁLISIS")
        print("="*80)
        
        return {
            'user_info': user_info,
            'inscriptions': inscriptions,
            'documents': documents,
            'logs': logs,
            'notifications': notifications,
            'problems': problems,
            'recommendations': recommendations
        }
        
    except mysql.connector.Error as e:
        print(f"Error de base de datos: {e}")
        return None
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    analysis = get_user_analysis('scamerucci')
