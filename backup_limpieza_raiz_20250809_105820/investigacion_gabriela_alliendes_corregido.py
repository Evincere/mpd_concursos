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
        'analisis_seguridad': {
            'solicitudes_reset_password': 0,
            'intentos_login_fallidos': 0,
            'logins_exitosos': 0,
            'ultimo_login_fallido': 'N/A',
            'ultimo_login_exitoso': 'N/A',
            'cuenta_activa': False
        },
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
            try:
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
            except Exception as e:
                print(f"Error buscando inscripciones: {e}")
            
            # Buscar documentos
            try:
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
            except Exception as e:
                print(f"Error buscando documentos: {e}")
            
            # Buscar logs de auditoría relacionados
            try:
                cursor.execute("""
                    SELECT id, event_type, description, timestamp, ip_address, 
                           outcome, session_id, user_agent, username
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
                        'user_agent': log['user_agent'],
                        'username': log['username']
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
                
            except Exception as e:
                print(f"Error buscando logs de auditoría: {e}")
            
            # Buscar notificaciones
            try:
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
            except Exception as e:
                print(f"Error buscando notificaciones: {e}")
            
            # Generar recomendaciones
            if report['analisis_seguridad']['solicitudes_reset_password'] > 0:
                report['recomendaciones'].append("⚠️  Se encontraron solicitudes de reset de contraseña anteriores")
            
            if report['analisis_seguridad']['intentos_login_fallidos'] > 3:
                report['recomendaciones'].append("🔒 Usuario con múltiples intentos de login fallidos - verificar seguridad")
            
            if user_data['status'] == 'ACTIVE':
                report['recomendaciones'].append("✅ La cuenta está activa - proceder con blanqueo de contraseña si es solicitado")
            else:
                report['recomendaciones'].append("❌ La cuenta NO está activa - revisar estado antes del blanqueo")
            
            if not report['documentos']:
                report['recomendaciones'].append("📄 Usuario sin documentos cargados")
            
            if not report['inscripciones']:
                report['recomendaciones'].append("📝 Usuario sin inscripciones a concursos")
                
        else:
            report['recomendaciones'].append("❌ No se encontró usuario con el DNI especificado")
            
    except Exception as e:
        report['error'] = str(e)
        print(f"Error general: {e}")
        
    finally:
        cursor.close()
        conn.close()
    
    return report

def generate_report(dni):
    report = investigate_user(dni)
    
    # Generar reporte en markdown
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'INVESTIGACION_GABRIELA_ALLIENDES_{dni}_{timestamp}.md'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# 🔍 INVESTIGACIÓN DE USUARIO - SOLICITUD BLANQUEO CONTRASEÑA\n\n")
        f.write(f"**DNI Solicitado:** {dni}\n")
        f.write(f"**Fecha de investigación:** {report['fecha_investigacion']}\n\n")
        f.write("---\n\n")
        
        if report['usuario_encontrado']:
            f.write("## ✅ USUARIO ENCONTRADO EN SISTEMA\n\n")
            
            # Datos del usuario
            f.write("### 👤 DATOS PERSONALES\n\n")
            user_data = report['datos_usuario']
            f.write(f"| Campo | Valor |\n")
            f.write(f"|-------|-------|\n")
            f.write(f"| **Nombre completo** | {user_data['nombre_completo']} |\n")
            f.write(f"| **DNI** | {user_data['dni']} |\n")
            f.write(f"| **Email** | {user_data['email']} |\n")
            f.write(f"| **Username** | {user_data['username']} |\n")
            f.write(f"| **Fecha de registro** | {user_data['fecha_registro']} |\n")
            f.write(f"| **Estado de cuenta** | **{user_data['estado']}** |\n")
            f.write(f"| **Teléfono** | {user_data['telefono']} |\n")
            f.write(f"| **Dirección legal** | {user_data['direccion_legal']} |\n")
            f.write(f"| **Municipio** | {user_data['municipio']} |\n")
            f.write(f"| **Provincia** | {user_data['provincia']} |\n")
            f.write(f"| **CUIT** | {user_data['cuit']} |\n")
            f.write(f"| **Contraseña** | {user_data['password_hash']} |\n\n")
            
            # Análisis de seguridad
            f.write("### 🔐 ANÁLISIS DE SEGURIDAD\n\n")
            security = report['analisis_seguridad']
            f.write(f"| Métrica | Valor |\n")
            f.write(f"|---------|-------|\n")
            f.write(f"| **Solicitudes de reset de contraseña** | {security['solicitudes_reset_password']} |\n")
            f.write(f"| **Intentos de login fallidos** | {security['intentos_login_fallidos']} |\n")
            f.write(f"| **Logins exitosos** | {security['logins_exitosos']} |\n")
            f.write(f"| **Último login fallido** | {security['ultimo_login_fallido']} |\n")
            f.write(f"| **Último login exitoso** | {security['ultimo_login_exitoso']} |\n")
            f.write(f"| **Cuenta activa** | **{'SÍ' if security['cuenta_activa'] else 'NO'}** |\n\n")
            
            # Inscripciones
            f.write("### 📝 INSCRIPCIONES A CONCURSOS\n\n")
            if report['inscripciones']:
                f.write("| Concurso | Estado | Fecha de Inscripción |\n")
                f.write("|----------|--------|---------------------|\n")
                for insc in report['inscripciones']:
                    f.write(f"| {insc['concurso']} | {insc['estado']} | {insc['fecha_inscripcion']} |\n")
            else:
                f.write("❌ **No se encontraron inscripciones a concursos.**\n")
            f.write("\n")
            
            # Documentos
            f.write("### 📄 DOCUMENTOS CARGADOS\n\n")
            if report['documentos']:
                f.write("| Archivo | Tipo | Estado | Fecha de Carga |\n")
                f.write("|---------|------|--------|----------------|\n")
                for doc in report['documentos']:
                    tipo = doc['tipo_documento'] or 'N/A'
                    f.write(f"| {doc['nombre_archivo']} | {tipo} | {doc['estado']} | {doc['fecha_subida']} |\n")
            else:
                f.write("❌ **No se encontraron documentos cargados.**\n")
            f.write("\n")
            
            # Logs de auditoría recientes
            f.write("### 📋 LOGS DE AUDITORÍA RECIENTES\n\n")
            if report['logs_auditoria']:
                f.write("| Fecha/Hora | Evento | Descripción | Resultado |\n")
                f.write("|------------|--------|-------------|----------|\n")
                for log in report['logs_auditoria'][:10]:  # Solo los 10 más recientes
                    descripcion = log['descripcion'][:50] + '...' if len(log['descripcion']) > 50 else log['descripcion']
                    f.write(f"| {log['timestamp']} | {log['tipo_evento']} | {descripcion} | {log['resultado']} |\n")
            else:
                f.write("❌ **No se encontraron logs de auditoría.**\n")
            f.write("\n")
            
            # Notificaciones
            f.write("### 📨 NOTIFICACIONES RECIENTES\n\n")
            if report['notificaciones']:
                f.write("| Fecha | Asunto | Estado | Tipo |\n")
                f.write("|-------|--------|--------|------|\n")
                for notif in report['notificaciones']:
                    f.write(f"| {notif['fecha_envio']} | {notif['asunto']} | {notif['estado']} | {notif['tipo']} |\n")
            else:
                f.write("❌ **No se encontraron notificaciones.**\n")
            f.write("\n")
            
        else:
            f.write("## ❌ USUARIO NO ENCONTRADO\n\n")
            f.write(f"**No se encontró ningún usuario con DNI {dni} en la base de datos.**\n\n")
        
        # Recomendaciones
        f.write("### 💡 RECOMENDACIONES Y CONCLUSIONES\n\n")
        for rec in report['recomendaciones']:
            f.write(f"- {rec}\n")
        f.write("\n")
        
        if report['usuario_encontrado'] and report['datos_usuario']['estado'] == 'ACTIVE':
            f.write("### 🔄 PROCEDIMIENTO PARA BLANQUEO DE CONTRASEÑA\n\n")
            f.write("**VERIFICACIÓN PREVIA COMPLETADA ✅**\n\n")
            f.write("#### Pasos a seguir:\n\n")
            f.write("1. **✅ Usuario verificado** - DNI {dni} existe en sistema\n".format(dni=dni))
            f.write("2. **✅ Cuenta activa** - Estado: ACTIVE\n")
            f.write("3. **🔧 Generar nueva contraseña temporal**\n")
            f.write("4. **📧 Notificar al usuario**: {email}\n".format(email=report['datos_usuario']['email']))
            f.write("5. **📋 Registrar acción en logs de auditoría**\n\n")
            
            f.write("#### ⚠️ IMPORTANTE:\n")
            f.write("- Solicitar al usuario que cambie la contraseña temporal en el primer login\n")
            f.write("- Verificar identidad del solicitante antes de proceder\n")
            f.write("- Documentar la razón de la solicitud de blanqueo\n\n")
            
            f.write("#### 📞 Datos de contacto verificados:\n")
            f.write(f"- **Email:** {report['datos_usuario']['email']}\n")
            f.write(f"- **Teléfono:** {report['datos_usuario']['telefono']}\n")
            
        elif report['usuario_encontrado']:
            f.write("### ❌ NO PROCEDER CON BLANQUEO\n\n")
            f.write(f"**MOTIVO:** La cuenta no está en estado ACTIVE (Estado actual: {report['datos_usuario']['estado']})\n")
            f.write("**ACCIÓN:** Revisar y activar la cuenta antes de proceder con el blanqueo.\n\n")
        
        f.write("\n---\n")
        f.write("*Reporte generado automáticamente por el sistema MPD Concursos*\n")
    
    # También guardar JSON para procesamiento posterior
    json_filename = f'investigacion_gabriela_alliendes_{dni}_{timestamp}.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    return filename, json_filename

if __name__ == "__main__":
    dni = "26545767"
    print("🔍 Iniciando investigación de usuario...")
    print(f"DNI: {dni}")
    print("=" * 50)
    
    md_file, json_file = generate_report(dni)
    print(f"✅ Investigación completada:")
    print(f"📄 Reporte Markdown: {md_file}")
    print(f"📊 Datos JSON: {json_file}")
    print("=" * 50)
