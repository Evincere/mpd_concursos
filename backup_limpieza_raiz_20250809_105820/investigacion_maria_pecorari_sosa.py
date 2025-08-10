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

def buscar_usuario_por_dni(conn, dni):
    """Busca el usuario por DNI"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.domicilio,
        u.provincia,
        u.localidad,
        u.codigo_postal,
        u.created_at,
        u.updated_at,
        u.email_verified_at,
        u.is_active,
        u.password_changed_at,
        u.last_login_at,
        u.failed_login_attempts,
        u.locked_until
    FROM users u 
    WHERE u.dni = %s
    """
    
    cursor.execute(query, (dni,))
    usuario = cursor.fetchone()
    cursor.close()
    
    return usuario

def obtener_inscripciones(conn, user_id):
    """Obtiene todas las inscripciones del usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        i.id,
        i.concurso_id,
        c.nombre as concurso_nombre,
        c.estado as concurso_estado,
        i.fecha_inscripcion,
        i.estado,
        i.fecha_confirmacion,
        i.observaciones,
        i.created_at,
        i.updated_at
    FROM inscripciones i
    LEFT JOIN concursos c ON i.concurso_id = c.id
    WHERE i.user_id = %s
    ORDER BY i.fecha_inscripcion DESC
    """
    
    cursor.execute(query, (user_id,))
    inscripciones = cursor.fetchall()
    cursor.close()
    
    return inscripciones

def obtener_documentos(conn, user_id):
    """Obtiene todos los documentos subidos por el usuario"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        d.id,
        d.nombre_original,
        d.nombre_archivo,
        d.ruta,
        d.tipo_documento,
        d.estado,
        d.observaciones,
        d.fecha_subida,
        d.fecha_verificacion,
        d.verificado_por,
        d.created_at,
        d.updated_at,
        CASE 
            WHEN d.ruta IS NOT NULL AND d.ruta != '' THEN 
                CASE 
                    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'file_exists_check') 
                    THEN 'VERIFICACION_PENDIENTE'
                    ELSE 'ARCHIVO_REFERENCIADO'
                END
            ELSE 'SIN_ARCHIVO'
        END as estado_archivo
    FROM documentos d
    WHERE d.user_id = %s
    ORDER BY d.fecha_subida DESC
    """
    
    cursor.execute(query, (user_id,))
    documentos = cursor.fetchall()
    cursor.close()
    
    return documentos

def obtener_actividad_reciente(conn, user_id):
    """Obtiene la actividad reciente del usuario si existe tabla de logs"""
    cursor = conn.cursor(dictionary=True)
    
    # Verificar si existe tabla de logs
    cursor.execute("SHOW TABLES LIKE 'user_activity_logs'")
    if cursor.fetchone():
        query = """
        SELECT 
            action,
            description,
            ip_address,
            user_agent,
            created_at
        FROM user_activity_logs
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 20
        """
        cursor.execute(query, (user_id,))
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
        if doc['ruta']:
            doc['archivo_existe'] = False
            for base_path in storage_paths:
                full_path = os.path.join(base_path, doc['ruta'])
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

def generar_reporte(usuario, inscripciones, documentos, actividad, dni):
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
    print(f"• Nombre Completo: {usuario['nombre']} {usuario['apellido']}")
    print(f"• DNI: {usuario['dni']}")
    print(f"• Email: {usuario['email']}")
    print(f"• Teléfono: {usuario['telefono'] or 'No especificado'}")
    print(f"• Fecha de Nacimiento: {usuario['fecha_nacimiento'] or 'No especificada'}")
    print(f"• Domicilio: {usuario['domicilio'] or 'No especificado'}")
    print(f"• Provincia: {usuario['provincia'] or 'No especificada'}")
    print(f"• Localidad: {usuario['localidad'] or 'No especificada'}")
    print(f"• Código Postal: {usuario['codigo_postal'] or 'No especificado'}")
    
    # Estado de la cuenta
    print(f"\n🔐 ESTADO DE LA CUENTA:")
    print("-" * 50)
    print(f"• Cuenta Activa: {'✅ SÍ' if usuario['is_active'] else '❌ NO'}")
    print(f"• Email Verificado: {'✅ SÍ' if usuario['email_verified_at'] else '❌ NO'}")
    print(f"• Fecha de Registro: {usuario['created_at']}")
    print(f"• Última Actualización: {usuario['updated_at']}")
    print(f"• Último Login: {usuario['last_login_at'] or 'Nunca'}")
    print(f"• Intentos Fallidos de Login: {usuario['failed_login_attempts']}")
    print(f"• Cuenta Bloqueada Hasta: {usuario['locked_until'] or 'No bloqueada'}")
    print(f"• Contraseña Cambiada: {usuario['password_changed_at'] or 'Nunca'}")
    
    # Inscripciones
    print(f"\n📝 INSCRIPCIONES ({len(inscripciones)} total):")
    print("-" * 50)
    if inscripciones:
        for i, inscripcion in enumerate(inscripciones, 1):
            print(f"\n{i}. Concurso: {inscripcion['concurso_nombre']}")
            print(f"   • ID Inscripción: {inscripcion['id']}")
            print(f"   • Estado Inscripción: {inscripcion['estado']}")
            print(f"   • Estado Concurso: {inscripcion['concurso_estado']}")
            print(f"   • Fecha de Inscripción: {inscripcion['fecha_inscripcion']}")
            print(f"   • Fecha de Confirmación: {inscripcion['fecha_confirmacion'] or 'No confirmada'}")
            print(f"   • Observaciones: {inscripcion['observaciones'] or 'Ninguna'}")
    else:
        print("❌ No se encontraron inscripciones")
    
    # Documentación
    print(f"\n📄 DOCUMENTACIÓN ({len(documentos)} archivos):")
    print("-" * 50)
    if documentos:
        for i, doc in enumerate(documentos, 1):
            print(f"\n{i}. {doc['nombre_original']}")
            print(f"   • ID Documento: {doc['id']}")
            print(f"   • Tipo: {doc['tipo_documento']}")
            print(f"   • Estado: {doc['estado']}")
            print(f"   • Archivo en Sistema: {'✅ SÍ' if doc['archivo_existe'] else '❌ NO'}")
            if doc['archivo_existe']:
                print(f"   • Ruta: {doc['ruta_completa']}")
                if 'tamaño_archivo' in doc:
                    print(f"   • Tamaño: {doc['tamaño_archivo']} bytes")
                if 'fecha_modificacion' in doc:
                    print(f"   • Modificado: {doc['fecha_modificacion']}")
            print(f"   • Fecha de Subida: {doc['fecha_subida']}")
            print(f"   • Verificado: {'✅ SÍ' if doc['fecha_verificacion'] else '❌ NO'}")
            if doc['fecha_verificacion']:
                print(f"   • Fecha de Verificación: {doc['fecha_verificacion']}")
                print(f"   • Verificado por: {doc['verificado_por']}")
            print(f"   • Observaciones: {doc['observaciones'] or 'Ninguna'}")
    else:
        print("❌ No se encontraron documentos")
    
    # Actividad reciente
    print(f"\n🕒 ACTIVIDAD RECIENTE ({len(actividad)} registros):")
    print("-" * 50)
    if actividad:
        for act in actividad[:10]:  # Solo los últimos 10
            print(f"• {act['created_at']}: {act['action']}")
            if act['description']:
                print(f"  Descripción: {act['description']}")
            if act['ip_address']:
                print(f"  IP: {act['ip_address']}")
    else:
        print("❌ No se encontraron registros de actividad")
    
    # Resumen final
    print(f"\n📊 RESUMEN FINAL:")
    print("-" * 50)
    print(f"• Usuario {'ACTIVO' if usuario['is_active'] else 'INACTIVO'}")
    print(f"• {len(inscripciones)} inscripción(es) encontrada(s)")
    print(f"• {len(documentos)} documento(s) en el sistema")
    
    docs_ok = sum(1 for doc in documentos if doc['archivo_existe'])
    docs_faltantes = len(documentos) - docs_ok
    print(f"• {docs_ok} archivo(s) físico(s) encontrado(s)")
    if docs_faltantes > 0:
        print(f"• ⚠️  {docs_faltantes} archivo(s) faltante(s) en el sistema")
    
    docs_verificados = sum(1 for doc in documentos if doc['fecha_verificacion'])
    print(f"• {docs_verificados} documento(s) verificado(s)")
    
    # Guardar reporte en archivo
    filename = f"investigacion_maria_pecorari_{timestamp}.md"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Investigación Usuario María de los Milagros Pecorari Sosa\n")
        f.write(f"**DNI:** {dni}\n")
        f.write(f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        if usuario:
            f.write("## Datos del Usuario\n")
            f.write(f"- **ID:** {usuario['id']}\n")
            f.write(f"- **Nombre:** {usuario['nombre']} {usuario['apellido']}\n")
            f.write(f"- **Email:** {usuario['email']}\n")
            f.write(f"- **Estado:** {'Activo' if usuario['is_active'] else 'Inactivo'}\n")
            f.write(f"- **Último login:** {usuario['last_login_at'] or 'Nunca'}\n\n")
            
            f.write("## Inscripciones\n")
            if inscripciones:
                for inscripcion in inscripciones:
                    f.write(f"- **{inscripcion['concurso_nombre']}** ({inscripcion['estado']})\n")
                    f.write(f"  - Fecha: {inscripcion['fecha_inscripcion']}\n")
            else:
                f.write("No hay inscripciones registradas.\n")
            
            f.write("\n## Documentos\n")
            if documentos:
                for doc in documentos:
                    estado_archivo = "✅ Existe" if doc['archivo_existe'] else "❌ Faltante"
                    f.write(f"- **{doc['nombre_original']}** ({doc['tipo_documento']}) - {estado_archivo}\n")
                    f.write(f"  - Estado: {doc['estado']}\n")
                    f.write(f"  - Subido: {doc['fecha_subida']}\n")
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
            user_id = usuario['id']
            
            # Obtener información completa
            inscripciones = obtener_inscripciones(conn, user_id)
            documentos = obtener_documentos(conn, user_id)
            actividad = obtener_actividad_reciente(conn, user_id)
            
            # Verificar archivos físicos
            verificar_archivos_fisicos(documentos)
            
            # Generar reporte
            generar_reporte(usuario, inscripciones, documentos, actividad, dni)
        else:
            generar_reporte(None, [], [], [], dni)
            
    except Exception as e:
        print(f"❌ Error durante la investigación: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
