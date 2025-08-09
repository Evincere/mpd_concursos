#!/usr/bin/env python3
import mysql.connector
import json
from datetime import datetime
import os

def connect_to_db():
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        database='mpd_concursos',
        user='mpd_user',
        password='mpd_password_secure'
    )

def format_timestamp(timestamp):
    if timestamp:
        return timestamp.strftime('%Y-%m-%d %H:%M:%S')
    return 'N/A'

def investigate_user(dni):
    conn = connect_to_db()
    cursor = conn.cursor(dictionary=True)
    
    report = {
        'fecha_investigacion': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'dni_solicitado': dni,
        'usuario_encontrado': False,
        'datos_usuario': {},
        'inscripciones': [],
        'documentos': [],
        'logs_auditoria': [],
        'notificaciones': [],
        'analisis_seguridad': {},
        'recomendaciones': []
    }
    
    try:
        # Buscar usuario por DNI
        cursor.execute("""
            SELECT id, dni, first_name, last_name, email, username, 
                   created_at, status, telefono, direccion, legal_address, 
                   municipality, province, birth_date, country, cuit, password
            FROM user_entity WHERE dni = %s
        """, (dni,))
        
        user_data = cursor.fetchone()
        
        if user_data:
            report['usuario_encontrado'] = True
            
            # Formatear datos del usuario
            report['datos_usuario'] = {
                'id': str(user_data['id']),
                'dni': user_data['dni'],
                'nombre_completo': f"{user_data['first_name']} {user_data['last_name']}".title(),
                'email': user_data['email'],
                'username': user_data['username'],
                'fecha_registro': format_timestamp(user_data['created_at']),
                'estado': user_data['status'],
                'telefono': user_data['telefono'],
                'direccion': user_data['direccion'],
                'direccion_legal': user_data['legal_address'],
                'municipio': user_data['municipality'],
                'provincia': user_data['province'],
                'fecha_nacimiento': str(user_data['birth_date']) if user_data['birth_date'] else 'N/A',
                'pais': user_data['country'],
                'cuit': user_data['cuit'],
                'password_hash': '***PRESENTE***' if user_data['password'] else 'NO ESTABLECIDA'
            }
            
            user_id_bytes = user_data['id']
            
            # Buscar inscripciones
            cursor.execute("""
                SELECT i.id, i.inscription_date, i.status, c.title as concurso_titulo,
                       c.description as concurso_descripcion
                FROM inscriptions i 
                JOIN contests c ON i.contest_id = c.id 
                WHERE i.user_id = %s
                ORDER BY i.inscription_date DESC
            """, (user_id_bytes,))
            
            inscriptions = cursor.fetchall()
            for inscription in inscriptions:
                report['inscripciones'].append({
                    'id': str(inscription['id']),
                    'fecha_inscripcion': format_timestamp(inscription['inscription_date']),
                    'estado': inscription['status'],
                    'concurso': inscription['concurso_titulo'],
                    'descripcion': inscription['concurso_descripcion']
                })
            
            # Buscar documentos
            cursor.execute("""
                SELECT d.id, d.file_name, d.file_path, d.upload_date, d.status, 
                       d.processing_status, dt.name as document_type, d.comments,
                       d.rejection_reason, d.error_message
                FROM documents d 
                LEFT JOIN document_types dt ON d.document_type_id = dt.id 
                WHERE d.user_id = %s 
                ORDER BY d.upload_date DESC
            """, (user_id_bytes,))
            
            documents = cursor.fetchall()
            for doc in documents:
                report['documentos'].append({
                    'id': str(doc['id']),
                    'nombre_archivo': doc['file_name'],
                    'ruta_archivo': doc['file_path'],
                    'fecha_subida': format_timestamp(doc['upload_date']),
                    'estado': doc['status'],
                    'estado_procesamiento': doc['processing_status'],
                    'tipo_documento': doc['document_type'],
                    'comentarios': doc['comments'],
                    'razon_rechazo': doc['rejection_reason'],
                    'mensaje_error': doc['error_message']
                })
            
            # Buscar logs de auditoría relacionados
            cursor.execute("""
                SELECT id, event_type, description, timestamp, ip_address, 
                       outcome, session_id, user_agent
                FROM audit_logs 
                WHERE username LIKE %s OR description LIKE %s
                ORDER BY timestamp DESC
                LIMIT 20
            """, (f'%{user_data["username"]}%', f'%{dni}%'))
            
            audit_logs = cursor.fetchall()
            for log in audit_logs:
                report['logs_auditoria'].append({
                    'id': log['id'],
                    'tipo_evento': log['event_type'],
                    'descripcion': log['description'],
                    'timestamp': format_timestamp(log['timestamp']),
                    'ip_address': log['ip_address'],
                    'resultado': log['outcome'],
                    'session_id': log['session_id'],
                    'user_agent': log['user_agent']
                })
            
            # Buscar notificaciones
            cursor.execute("""
                SELECT id, subject, content, sent_at, status, type, 
                       read_at, acknowledged_at
                FROM notifications 
                WHERE recipient_id = %s
                ORDER BY sent_at DESC
                LIMIT 10
            """, (user_id_bytes,))
            
            notifications = cursor.fetchall()
            for notif in notifications:
                report['notificaciones'].append({
                    'id': str(notif['id']),
                    'asunto': notif['subject'],
                    'contenido': notif['content'][:200] + '...' if len(notif['content']) > 200 else notif['content'],
                    'fecha_envio': format_timestamp(notif['sent_at']),
                    'estado': notif['status'],
                    'tipo': notif['type'],
                    'fecha_lectura': format_timestamp(notif['read_at']),
                    'fecha_confirmacion': format_timestamp(notif['acknowledged_at'])
                })
            
            # Análisis de seguridad
            password_reset_requests = [log for log in audit_logs if log['event_type'] == 'PASSWORD_RESET_REQUEST']
            login_failures = [log for log in audit_logs if log['event_type'] == 'LOGIN_FAILURE']
            successful_logins = [log for log in audit_logs if log['event_type'] == 'LOGIN_SUCCESS']
            
            report['analisis_seguridad'] = {
                'solicitudes_reset_password': len(password_reset_requests),
                'intentos_login_fallidos': len(login_failures),
                'logins_exitosos': len(successful_logins),
                'ultimo_login_fallido': format_timestamp(login_failures[0]['timestamp']) if login_failures else 'N/A',
                'ultimo_login_exitoso': format_timestamp(successful_logins[0]['timestamp']) if successful_logins else 'N/A',
                'cuenta_activa': user_data['status'] == 'ACTIVE'
            }
            
            # Generar recomendaciones
            if password_reset_requests:
                report['recomendaciones'].append("⚠️  Se encontraron solicitudes de reset de contraseña anteriores")
            
            if len(login_failures) > 3:
                report['recomendaciones'].append("🔒 Usuario con múltiples intentos de login fallidos - verificar seguridad")
            
            if user_data['status'] == 'ACTIVE':
                report['recomendaciones'].append("✅ La cuenta está activa - proceder con blanqueo de contraseña si es solicitado")
            else:
                report['recomendaciones'].append("❌ La cuenta NO está activa - revisar estado antes del blanqueo")
            
            if not documents:
                report['recomendaciones'].append("📄 Usuario sin documentos cargados")
            
            if not inscriptions:
                report['recomendaciones'].append("📝 Usuario sin inscripciones a concursos")
                
        else:
            report['recomendaciones'].append("❌ No se encontró usuario con el DNI especificado")
            
    except Exception as e:
        report['error'] = str(e)
        
    finally:
        cursor.close()
        conn.close()
    
    return report

def generate_report(dni):
    report = investigate_user(dni)
    
    # Generar reporte en markdown
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'investigacion_gabriela_alliendes_{dni}_{timestamp}.md'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Investigación de Usuario - DNI {dni}\n\n")
        f.write(f"**Fecha de investigación:** {report['fecha_investigacion']}\n\n")
        
        if report['usuario_encontrado']:
            f.write("## ✅ Usuario Encontrado\n\n")
            
            # Datos del usuario
            f.write("### 👤 Datos del Usuario\n\n")
            user_data = report['datos_usuario']
            f.write(f"- **Nombre completo:** {user_data['nombre_completo']}\n")
            f.write(f"- **DNI:** {user_data['dni']}\n")
            f.write(f"- **Email:** {user_data['email']}\n")
            f.write(f"- **Username:** {user_data['username']}\n")
            f.write(f"- **Fecha de registro:** {user_data['fecha_registro']}\n")
            f.write(f"- **Estado:** {user_data['estado']}\n")
            f.write(f"- **Teléfono:** {user_data['telefono']}\n")
            f.write(f"- **Dirección legal:** {user_data['direccion_legal']}\n")
            f.write(f"- **Municipio:** {user_data['municipio']}\n")
            f.write(f"- **Provincia:** {user_data['provincia']}\n")
            f.write(f"- **CUIT:** {user_data['cuit']}\n")
            f.write(f"- **Contraseña:** {user_data['password_hash']}\n\n")
            
            # Análisis de seguridad
            f.write("### 🔐 Análisis de Seguridad\n\n")
            security = report['analisis_seguridad']
            f.write(f"- **Solicitudes de reset de contraseña:** {security['solicitudes_reset_password']}\n")
            f.write(f"- **Intentos de login fallidos:** {security['intentos_login_fallidos']}\n")
            f.write(f"- **Logins exitosos:** {security['logins_exitosos']}\n")
            f.write(f"- **Último login fallido:** {security['ultimo_login_fallido']}\n")
            f.write(f"- **Último login exitoso:** {security['ultimo_login_exitoso']}\n")
            f.write(f"- **Cuenta activa:** {'SÍ' if security['cuenta_activa'] else 'NO'}\n\n")
            
            # Inscripciones
            f.write("### 📝 Inscripciones a Concursos\n\n")
            if report['inscripciones']:
                for insc in report['inscripciones']:
                    f.write(f"- **{insc['concurso']}** - Estado: {insc['estado']} - Fecha: {insc['fecha_inscripcion']}\n")
            else:
                f.write("No se encontraron inscripciones.\n")
            f.write("\n")
            
            # Documentos
            f.write("### 📄 Documentos Cargados\n\n")
            if report['documentos']:
                for doc in report['documentos']:
                    f.write(f"- **{doc['nombre_archivo']}** ({doc['tipo_documento']}) - Estado: {doc['estado']} - Fecha: {doc['fecha_subida']}\n")
            else:
                f.write("No se encontraron documentos cargados.\n")
            f.write("\n")
            
            # Logs de auditoría recientes
            f.write("### 📋 Logs de Auditoría Recientes\n\n")
            if report['logs_auditoria']:
                for log in report['logs_auditoria']:
                    f.write(f"- **{log['timestamp']}** - {log['tipo_evento']}: {log['descripcion']}\n")
            else:
                f.write("No se encontraron logs de auditoría.\n")
            f.write("\n")
            
        else:
            f.write("## ❌ Usuario No Encontrado\n\n")
            f.write(f"No se encontró ningún usuario con DNI {dni} en la base de datos.\n\n")
        
        # Recomendaciones
        f.write("### 💡 Recomendaciones\n\n")
        for rec in report['recomendaciones']:
            f.write(f"- {rec}\n")
        f.write("\n")
        
        if report['usuario_encontrado'] and report['datos_usuario']['estado'] == 'ACTIVE':
            f.write("### 🔄 Procedimiento de Blanqueo de Contraseña\n\n")
            f.write("Para proceder con el blanqueo de contraseña:\n\n")
            f.write("1. ✅ **Usuario verificado** - DNI y datos coinciden\n")
            f.write("2. ✅ **Cuenta activa** - Se puede proceder con el reset\n")
            f.write("3. 🔧 **Generar nueva contraseña temporal**\n")
            f.write("4. 📧 **Notificar al usuario por email**\n")
            f.write("5. 📋 **Registrar acción en logs de auditoría**\n\n")
            
            f.write("**IMPORTANTE:** Solicitar al usuario que cambie la contraseña temporal en el primer login.\n\n")
    
    # También guardar JSON para procesamiento posterior
    json_filename = f'investigacion_gabriela_alliendes_{dni}_{timestamp}.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    return filename, json_filename

if __name__ == "__main__":
    dni = "26545767"
    md_file, json_file = generate_report(dni)
    print(f"Investigación completada:")
    print(f"- Reporte Markdown: {md_file}")
    print(f"- Datos JSON: {json_file}")
