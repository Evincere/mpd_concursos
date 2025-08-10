#!/usr/bin/env python3
"""
Script para investigar la actividad completa del usuario María de los Milagros Pecorari Sosa
DNI: 39380028
"""

import mysql.connector
import json
import sys
from datetime import datetime
import os
import binascii

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'database': 'mpd_concursos',
    'user': 'mpd_user',
    'password': 'mpd_password_secure'
}

def conectar_db():
    """Establece conexión con la base de datos"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

def binary_to_hex(binary_data):
    """Convierte datos binarios a hex string"""
    if binary_data:
        return binascii.hexlify(binary_data).decode('utf-8')
    return None

def buscar_usuario_por_dni(conn, dni):
    """Busca el usuario por DNI"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        HEX(u.id) as id,
        u.first_name,
        u.last_name,
        u.dni,
        u.email,
        u.telefono,
        u.birth_date,
        u.direccion,
        u.province,
        u.municipality,
        u.country,
        u.created_at,
        u.status,
        u.username,
        u.cuit,
        u.legal_address,
        u.residential_address,
        u.profile_image_url
    FROM user_entity u 
    WHERE u.dni = %s
    """
    
    cursor.execute(query, (dni,))
    usuario = cursor.fetchone()
    cursor.close()
    
    return usuario

def obtener_inscripciones(conn, user_id_hex):
    """Obtiene todas las inscripciones del usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        HEX(i.id) as id,
        i.contest_id,
        c.name as contest_name,
        c.status as contest_status,
        i.inscription_date,
        i.status,
        i.current_step,
        i.accepted_terms,
        i.confirmed_personal_data,
        i.documentos_completos,
        i.centro_de_vida,
        i.data_confirmation_date,
        i.terms_acceptance_date,
        i.documentation_deadline,
        i.frozen_date,
        i.created_at,
        i.updated_at
    FROM inscriptions i
    LEFT JOIN contests c ON i.contest_id = c.id
    WHERE HEX(i.user_id) = %s
    ORDER BY i.inscription_date DESC
    """
    
    cursor.execute(query, (user_id_hex,))
    inscripciones = cursor.fetchall()
    cursor.close()
    
    return inscripciones

def obtener_documentos(conn, user_id_hex):
    """Obtiene todos los documentos subidos por el usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        HEX(d.id) as id,
        d.file_name,
        d.file_path,
        d.content_type,
        d.status,
        d.processing_status,
        d.comments,
        d.rejection_reason,
        d.error_message,
        d.upload_date,
        d.validated_at,
        HEX(d.validated_by) as validated_by,
        d.is_archived,
        d.archived_at,
        HEX(d.archived_by) as archived_by,
        d.version,
        dt.name as document_type_name,
        dt.description as document_type_description,
        CASE 
            WHEN d.file_path IS NOT NULL AND d.file_path != '' THEN 'ARCHIVO_REFERENCIADO'
            ELSE 'SIN_ARCHIVO'
        END as estado_archivo
    FROM documents d
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    WHERE HEX(d.user_id) = %s
    ORDER BY d.upload_date DESC
    """
    
    cursor.execute(query, (user_id_hex,))
    documentos = cursor.fetchall()
    cursor.close()
    
    return documentos

def obtener_actividad_reciente(conn, user_id_hex):
    """Obtiene la actividad reciente del usuario si existe tabla de logs"""
    cursor = conn.cursor(dictionary=True)
    
    # Verificar si existe tabla de logs de auditoría
    cursor.execute("SHOW TABLES LIKE 'audit_logs'")
    if cursor.fetchone():
        query = """
        SELECT 
            action,
            entity_name,
            entity_id,
            old_values,
            new_values,
            created_at,
            HEX(user_id) as user_id_hex
        FROM audit_logs
        WHERE HEX(user_id) = %s OR entity_id LIKE %s
        ORDER BY created_at DESC
        LIMIT 20
        """
        cursor.execute(query, (user_id_hex, f'%{user_id_hex}%'))
        actividad = cursor.fetchall()
    else:
        actividad = []
    
    cursor.close()
    return actividad

def verificar_archivos_fisicos(documentos):
    """Verifica la existencia física de los archivos"""
    storage_paths = [
        '/root/concursos/mpd_concursos/storage',
        '/var/lib/docker/volumes/mpd_concursos_storage/_data',
        './storage'
    ]
    
    for doc in documentos:
        if doc['file_path']:
            doc['archivo_existe'] = False
            for base_path in storage_paths:
                full_path = os.path.join(base_path, doc['file_path'])
                if os.path.exists(full_path):
                    doc['archivo_existe'] = True
                    doc['ruta_completa'] = full_path
                    try:
                        stat = os.stat(full_path)
                        doc['tamaño_archivo'] = stat.st_size
                        doc['fecha_modificacion'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
                    except:
                        pass
                    break
            
            if not doc['archivo_existe']:
                doc['ruta_completa'] = 'ARCHIVO NO ENCONTRADO'
        else:
            doc['archivo_existe'] = False
            doc['ruta_completa'] = 'SIN RUTA ESPECIFICADA'

def obtener_estadisticas_educacion(conn, user_id_hex):
    """Obtiene información de educación del usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        HEX(id) as id,
        institution_name,
        degree_title,
        start_date,
        end_date,
        is_current,
        created_at
    FROM education_record
    WHERE HEX(user_id) = %s
    ORDER BY start_date DESC
    """
    
    cursor.execute(query, (user_id_hex,))
    educacion = cursor.fetchall()
    cursor.close()
    
    return educacion

def obtener_experiencia_laboral(conn, user_id_hex):
    """Obtiene información de experiencia laboral del usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        HEX(id) as id,
        company_name,
        position,
        start_date,
        end_date,
        is_current,
        description,
        created_at
    FROM work_experience
    WHERE HEX(user_id) = %s
    ORDER BY start_date DESC
    """
    
    cursor.execute(query, (user_id_hex,))
    experiencia = cursor.fetchall()
    cursor.close()
    
    return experiencia

def generar_reporte(usuario, inscripciones, documentos, actividad, educacion, experiencia, dni):
    """Genera el reporte completo"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print("="*80)
    print(f"INVESTIGACIÓN COMPLETA DEL USUARIO")
    print(f"DNI: {dni}")
    print(f"Fecha de consulta: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    if not usuario:
        print(f"❌ NO SE ENCONTRÓ USUARIO CON DNI: {dni}")
        return
    
    # Información básica del usuario
    print("\n📋 INFORMACIÓN BÁSICA DEL USUARIO:")
    print("-" * 50)
    print(f"• ID Usuario: {usuario['id']}")
    print(f"• Nombre Completo: {usuario['first_name']} {usuario['last_name']}")
    print(f"• DNI: {usuario['dni']}")
    print(f"• Email: {usuario['email']}")
    print(f"• Username: {usuario['username']}")
    print(f"• Teléfono: {usuario['telefono'] or 'No especificado'}")
    print(f"• CUIT: {usuario['cuit'] or 'No especificado'}")
    print(f"• Fecha de Nacimiento: {usuario['birth_date'] or 'No especificada'}")
    print(f"• Domicilio: {usuario['direccion'] or 'No especificado'}")
    print(f"• Domicilio Legal: {usuario['legal_address'] or 'No especificado'}")
    print(f"• Domicilio Residencial: {usuario['residential_address'] or 'No especificado'}")
    print(f"• Provincia: {usuario['province'] or 'No especificada'}")
    print(f"• Municipio: {usuario['municipality'] or 'No especificado'}")
    print(f"• País: {usuario['country'] or 'No especificado'}")
    
    # Estado de la cuenta
    print(f"\n🔐 ESTADO DE LA CUENTA:")
    print("-" * 50)
    print(f"• Estado: {usuario['status']}")
    print(f"• Fecha de Registro: {usuario['created_at']}")
    print(f"• Imagen de Perfil: {'✅ SÍ' if usuario['profile_image_url'] else '❌ NO'}")
    
    # Inscripciones
    print(f"\n📝 INSCRIPCIONES ({len(inscripciones)} total):")
    print("-" * 50)
    if inscripciones:
        for i, inscripcion in enumerate(inscripciones, 1):
            print(f"\n{i}. Concurso ID: {inscripcion['contest_id']}")
            print(f"   • ID Inscripción: {inscripcion['id']}")
            print(f"   • Estado: {inscripcion['status']}")
            print(f"   • Paso Actual: {inscripcion['current_step']}")
            print(f"   • Fecha de Inscripción: {inscripcion['inscription_date']}")
            print(f"   • Términos Aceptados: {'✅ SÍ' if inscripcion['accepted_terms'] else '❌ NO'}")
            print(f"   • Datos Confirmados: {'✅ SÍ' if inscripcion['confirmed_personal_data'] else '❌ NO'}")
            print(f"   • Documentos Completos: {'✅ SÍ' if inscripcion['documentos_completos'] else '❌ NO'}")
            print(f"   • Centro de Vida: {inscripcion['centro_de_vida'] or 'No especificado'}")
            print(f"   • Fecha Confirmación Datos: {inscripcion['data_confirmation_date'] or 'No confirmada'}")
            print(f"   • Fecha Aceptación Términos: {inscripcion['terms_acceptance_date'] or 'No aceptados'}")
            print(f"   • Fecha Límite Documentos: {inscripcion['documentation_deadline'] or 'No especificada'}")
            if inscripcion['frozen_date']:
                print(f"   • ⚠️  Fecha de Congelamiento: {inscripcion['frozen_date']}")
    else:
        print("❌ No se encontraron inscripciones")
    
    # Documentación
    print(f"\n📄 DOCUMENTACIÓN ({len(documentos)} archivos):")
    print("-" * 50)
    if documentos:
        for i, doc in enumerate(documentos, 1):
            print(f"\n{i}. {doc['file_name']}")
            print(f"   • ID Documento: {doc['id']}")
            print(f"   • Tipo: {doc['document_type_name'] or 'No especificado'}")
            if doc['document_type_description']:
                print(f"   • Descripción Tipo: {doc['document_type_description']}")
            print(f"   • Estado: {doc['status']}")
            print(f"   • Estado de Procesamiento: {doc['processing_status']}")
            print(f"   • Archivo en Sistema: {'✅ SÍ' if doc['archivo_existe'] else '❌ NO'}")
            if doc['archivo_existe']:
                print(f"   • Ruta: {doc['ruta_completa']}")
                if 'tamaño_archivo' in doc:
                    print(f"   • Tamaño: {doc['tamaño_archivo']} bytes")
                if 'fecha_modificacion' in doc:
                    print(f"   • Modificado: {doc['fecha_modificacion']}")
            elif doc['file_path']:
                print(f"   • Ruta Esperada: {doc['file_path']}")
            print(f"   • Tipo de Contenido: {doc['content_type']}")
            print(f"   • Fecha de Subida: {doc['upload_date']}")
            print(f"   • Validado: {'✅ SÍ' if doc['validated_at'] else '❌ NO'}")
            if doc['validated_at']:
                print(f"   • Fecha de Validación: {doc['validated_at']}")
                print(f"   • Validado por: {doc['validated_by'] or 'Sistema'}")
            print(f"   • Archivado: {'✅ SÍ' if doc['is_archived'] else '❌ NO'}")
            if doc['is_archived'] and doc['archived_at']:
                print(f"   • Fecha de Archivado: {doc['archived_at']}")
            print(f"   • Comentarios: {doc['comments'] or 'Ninguno'}")
            if doc['rejection_reason']:
                print(f"   • ⚠️  Razón de Rechazo: {doc['rejection_reason']}")
            if doc['error_message']:
                print(f"   • ❌ Error: {doc['error_message']}")
            print(f"   • Versión: {doc['version'] or 'N/A'}")
    else:
        print("❌ No se encontraron documentos")
    
    # Educación
    if educacion:
        print(f"\n🎓 EDUCACIÓN ({len(educacion)} registros):")
        print("-" * 50)
        for i, edu in enumerate(educacion, 1):
            print(f"\n{i}. {edu['institution_name']}")
            print(f"   • Título: {edu['degree_title']}")
            print(f"   • Inicio: {edu['start_date']}")
            print(f"   • Fin: {edu['end_date'] if not edu['is_current'] else 'ACTUAL'}")
    
    # Experiencia Laboral
    if experiencia:
        print(f"\n💼 EXPERIENCIA LABORAL ({len(experiencia)} registros):")
        print("-" * 50)
        for i, exp in enumerate(experiencia, 1):
            print(f"\n{i}. {exp['company_name']}")
            print(f"   • Puesto: {exp['position']}")
            print(f"   • Inicio: {exp['start_date']}")
            print(f"   • Fin: {exp['end_date'] if not exp['is_current'] else 'ACTUAL'}")
            if exp['description']:
                print(f"   • Descripción: {exp['description']}")
    
    # Actividad reciente
    print(f"\n🕒 ACTIVIDAD RECIENTE ({len(actividad)} registros):")
    print("-" * 50)
    if actividad:
        for act in actividad[:10]:  # Solo los últimos 10
            print(f"• {act['created_at']}: {act['action']} en {act['entity_name']}")
            if act['old_values'] and act['new_values']:
                print(f"  Cambios detectados en la entidad")
    else:
        print("❌ No se encontraron registros de actividad")
    
    # Resumen final
    print(f"\n📊 RESUMEN FINAL:")
    print("-" * 50)
    print(f"• Usuario {usuario['status']}")
    print(f"• {len(inscripciones)} inscripción(es) encontrada(s)")
    print(f"• {len(documentos)} documento(s) en el sistema")
    
    docs_ok = sum(1 for doc in documentos if doc['archivo_existe'])
    docs_faltantes = len(documentos) - docs_ok
    print(f"• {docs_ok} archivo(s) físico(s) encontrado(s)")
    if docs_faltantes > 0:
        print(f"• ⚠️  {docs_faltantes} archivo(s) faltante(s) en el sistema")
    
    docs_validados = sum(1 for doc in documentos if doc['validated_at'])
    print(f"• {docs_validados} documento(s) validado(s)")
    
    docs_rechazados = sum(1 for doc in documentos if doc['status'] == 'REJECTED')
    if docs_rechazados > 0:
        print(f"• ❌ {docs_rechazados} documento(s) rechazado(s)")
    
    docs_pendientes = sum(1 for doc in documentos if doc['status'] == 'PENDING')
    if docs_pendientes > 0:
        print(f"• ⏳ {docs_pendientes} documento(s) pendiente(s)")
    
    # Guardar reporte en archivo
    filename = f"investigacion_maria_pecorari_{timestamp}.md"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Investigación Usuario María de los Milagros Pecorari Sosa\n")
        f.write(f"**DNI:** {dni}\n")
        f.write(f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        if usuario:
            f.write("## Datos del Usuario\n")
            f.write(f"- **ID:** {usuario['id']}\n")
            f.write(f"- **Nombre:** {usuario['first_name']} {usuario['last_name']}\n")
            f.write(f"- **Email:** {usuario['email']}\n")
            f.write(f"- **Estado:** {usuario['status']}\n")
            f.write(f"- **Registro:** {usuario['created_at']}\n\n")
            
            f.write("## Inscripciones\n")
            if inscripciones:
                for inscripcion in inscripciones:
                    f.write(f"- **Concurso ID {inscripcion['contest_id']}** ({inscripcion['status']})\n")
                    f.write(f"  - Paso actual: {inscripcion['current_step']}\n")
                    f.write(f"  - Fecha: {inscripcion['inscription_date']}\n")
                    f.write(f"  - Documentos completos: {'Sí' if inscripcion['documentos_completos'] else 'No'}\n")
            else:
                f.write("No hay inscripciones registradas.\n")
            
            f.write("\n## Documentos\n")
            if documentos:
                for doc in documentos:
                    estado_archivo = "✅ Existe" if doc['archivo_existe'] else "❌ Faltante"
                    f.write(f"- **{doc['file_name']}** ({doc['document_type_name']}) - {estado_archivo}\n")
                    f.write(f"  - Estado: {doc['status']}\n")
                    f.write(f"  - Subido: {doc['upload_date']}\n")
                    if doc['validated_at']:
                        f.write(f"  - Validado: {doc['validated_at']}\n")
                    if doc['rejection_reason']:
                        f.write(f"  - Rechazado: {doc['rejection_reason']}\n")
            else:
                f.write("No hay documentos registrados.\n")
    
    print(f"\n💾 Reporte guardado en: {filename}")

def main():
    dni = "39380028"  # DNI de María de los Milagros Pecorari Sosa
    
    print("🔍 Iniciando investigación del usuario...")
    print(f"DNI buscado: {dni}")
    
    conn = conectar_db()
    if not conn:
        print("❌ No se pudo conectar a la base de datos")
        sys.exit(1)
    
    try:
        # Buscar usuario
        usuario = buscar_usuario_por_dni(conn, dni)
        
        if usuario:
            user_id_hex = usuario['id']
            
            # Obtener información completa
            inscripciones = obtener_inscripciones(conn, user_id_hex)
            documentos = obtener_documentos(conn, user_id_hex)
            actividad = obtener_actividad_reciente(conn, user_id_hex)
            educacion = obtener_estadisticas_educacion(conn, user_id_hex)
            experiencia = obtener_experiencia_laboral(conn, user_id_hex)
            
            # Verificar archivos físicos
            verificar_archivos_fisicos(documentos)
            
            # Generar reporte
            generar_reporte(usuario, inscripciones, documentos, actividad, educacion, experiencia, dni)
        else:
            generar_reporte(None, [], [], [], [], [], dni)
            
    except Exception as e:
        print(f"❌ Error durante la investigación: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
