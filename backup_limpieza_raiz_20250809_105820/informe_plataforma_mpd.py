#!/usr/bin/env python3
"""
Informe completo del estado de la plataforma MPD Concursos
"""

import mysql.connector
from datetime import datetime, timedelta
import json

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

def obtener_estadisticas_usuarios(cursor):
    """Obtiene estadísticas generales de usuarios"""
    print("🔍 Analizando usuarios registrados...")
    
    # Total de usuarios registrados
    cursor.execute("SELECT COUNT(*) as total FROM user_entity")
    total_usuarios = cursor.fetchone()['total']
    
    # Usuarios por estado
    cursor.execute("""
        SELECT status, COUNT(*) as cantidad 
        FROM user_entity 
        GROUP BY status
        ORDER BY cantidad DESC
    """)
    usuarios_por_estado = cursor.fetchall()
    
    # Usuarios registrados por fecha (últimos 30 días)
    cursor.execute("""
        SELECT DATE(created_at) as fecha, COUNT(*) as nuevos
        FROM user_entity 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
        LIMIT 10
    """)
    registros_recientes = cursor.fetchall()
    
    return {
        'total': total_usuarios,
        'por_estado': usuarios_por_estado,
        'registros_recientes': registros_recientes
    }

def obtener_estadisticas_inscripciones(cursor):
    """Obtiene estadísticas de inscripciones al concurso"""
    print("🔍 Analizando inscripciones al concurso...")
    
    # Total de inscripciones
    cursor.execute("SELECT COUNT(*) as total FROM inscriptions")
    total_inscripciones = cursor.fetchone()['total']
    
    # Inscripciones por estado
    cursor.execute("""
        SELECT status, COUNT(*) as cantidad 
        FROM inscriptions 
        GROUP BY status
        ORDER BY cantidad DESC
    """)
    inscripciones_por_estado = cursor.fetchall()
    
    # Usuarios con documentación completa
    cursor.execute("""
        SELECT COUNT(*) as completos
        FROM inscriptions 
        WHERE documentos_completos = 1 
        AND accepted_terms = 1 
        AND confirmed_personal_data = 1
    """)
    documentacion_completa = cursor.fetchone()['completos']
    
    # Usuarios pendientes de documentación
    cursor.execute("""
        SELECT COUNT(*) as pendientes
        FROM inscriptions 
        WHERE documentos_completos = 0 
        OR accepted_terms = 0 
        OR confirmed_personal_data = 0
    """)
    documentacion_pendiente = cursor.fetchone()['pendientes']
    
    # Paso actual en el proceso
    cursor.execute("""
        SELECT current_step, COUNT(*) as cantidad 
        FROM inscriptions 
        GROUP BY current_step
        ORDER BY cantidad DESC
    """)
    pasos_proceso = cursor.fetchall()
    
    return {
        'total': total_inscripciones,
        'por_estado': inscripciones_por_estado,
        'documentacion_completa': documentacion_completa,
        'documentacion_pendiente': documentacion_pendiente,
        'pasos_proceso': pasos_proceso
    }

def obtener_estadisticas_documentos(cursor):
    """Obtiene estadísticas de documentos subidos"""
    print("🔍 Analizando documentación subida...")
    
    # Total de documentos
    cursor.execute("SELECT COUNT(*) as total FROM documents")
    total_documentos = cursor.fetchone()['total']
    
    # Documentos por estado
    cursor.execute("""
        SELECT status, COUNT(*) as cantidad 
        FROM documents 
        GROUP BY status
        ORDER BY cantidad DESC
    """)
    documentos_por_estado = cursor.fetchall()
    
    # Usuarios con documentos vs sin documentos
    cursor.execute("""
        SELECT 
            (SELECT COUNT(DISTINCT HEX(user_id)) FROM documents) as usuarios_con_docs,
            (SELECT COUNT(*) FROM user_entity) as total_usuarios
    """)
    relacion_docs = cursor.fetchone()
    usuarios_sin_docs = relacion_docs['total_usuarios'] - relacion_docs['usuarios_con_docs']
    
    # Promedio de documentos por usuario
    cursor.execute("""
        SELECT 
            AVG(doc_count) as promedio_docs
        FROM (
            SELECT HEX(user_id), COUNT(*) as doc_count
            FROM documents
            GROUP BY user_id
        ) as user_docs
    """)
    promedio_docs = cursor.fetchone()['promedio_docs']
    
    return {
        'total': total_documentos,
        'por_estado': documentos_por_estado,
        'usuarios_con_docs': relacion_docs['usuarios_con_docs'],
        'usuarios_sin_docs': usuarios_sin_docs,
        'promedio_por_usuario': round(promedio_docs, 2) if promedio_docs else 0
    }

def obtener_usuarios_inactivos(cursor):
    """Identifica usuarios sin actividad en la plataforma"""
    print("🔍 Identificando usuarios inactivos...")
    
    # Usuarios registrados sin inscripción
    cursor.execute("""
        SELECT u.dni, u.first_name, u.last_name, u.email, u.created_at
        FROM user_entity u
        LEFT JOIN inscriptions i ON u.id = i.user_id
        WHERE i.user_id IS NULL
        ORDER BY u.created_at DESC
        LIMIT 20
    """)
    sin_inscripcion = cursor.fetchall()
    
    # Usuarios con inscripción pero sin documentos
    cursor.execute("""
        SELECT u.dni, u.first_name, u.last_name, u.email, i.inscription_date
        FROM user_entity u
        INNER JOIN inscriptions i ON u.id = i.user_id
        LEFT JOIN documents d ON u.id = d.user_id
        WHERE d.user_id IS NULL
        ORDER BY i.inscription_date DESC
        LIMIT 20
    """)
    sin_documentos = cursor.fetchall()
    
    # Total de usuarios sin actividad significativa
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM user_entity u
        LEFT JOIN inscriptions i ON u.id = i.user_id
        LEFT JOIN documents d ON u.id = d.user_id
        WHERE i.user_id IS NULL AND d.user_id IS NULL
    """)
    total_inactivos = cursor.fetchone()['total']
    
    return {
        'sin_inscripcion': sin_inscripcion,
        'sin_documentos': sin_documentos,
        'total_completamente_inactivos': total_inactivos
    }

def obtener_estadisticas_geograficas(cursor):
    """Obtiene distribución geográfica por centro de vida"""
    print("🔍 Analizando distribución geográfica...")
    
    # Por centro de vida (de inscripciones)
    cursor.execute("""
        SELECT 
            CASE 
                WHEN centro_de_vida IS NULL OR centro_de_vida = '' THEN 'NO ESPECIFICADO'
                ELSE centro_de_vida 
            END as centro_vida,
            COUNT(*) as cantidad
        FROM inscriptions
        GROUP BY centro_de_vida
        ORDER BY cantidad DESC
    """)
    por_centro_vida = cursor.fetchall()
    
    # Por provincia (de usuarios)
    cursor.execute("""
        SELECT 
            CASE 
                WHEN province IS NULL OR province = '' THEN 'NO ESPECIFICADA'
                ELSE province 
            END as provincia,
            COUNT(*) as cantidad
        FROM user_entity
        GROUP BY province
        ORDER BY cantidad DESC
    """)
    por_provincia = cursor.fetchall()
    
    # Por municipio
    cursor.execute("""
        SELECT 
            CASE 
                WHEN municipality IS NULL OR municipality = '' THEN 'NO ESPECIFICADO'
                ELSE municipality 
            END as municipio,
            COUNT(*) as cantidad
        FROM user_entity
        WHERE municipality IS NOT NULL AND municipality != ''
        GROUP BY municipality
        ORDER BY cantidad DESC
        LIMIT 15
    """)
    por_municipio = cursor.fetchall()
    
    return {
        'por_centro_vida': por_centro_vida,
        'por_provincia': por_provincia,
        'por_municipio': por_municipio
    }

def generar_informe_completo():
    """Genera el informe completo de la plataforma"""
    timestamp = datetime.now()
    
    print("="*80)
    print("INFORME COMPLETO - PLATAFORMA MPD CONCURSOS")
    print(f"Fecha: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    conn = conectar_db()
    if not conn:
        return
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. ESTADÍSTICAS DE USUARIOS
        print("\n" + "="*60)
        print("📊 1. ESTADÍSTICAS DE USUARIOS REGISTRADOS")
        print("="*60)
        
        stats_usuarios = obtener_estadisticas_usuarios(cursor)
        
        print(f"\n👥 TOTAL DE USUARIOS REGISTRADOS: {stats_usuarios['total']}")
        
        print(f"\n📈 DISTRIBUCIÓN POR ESTADO:")
        for estado in stats_usuarios['por_estado']:
            print(f"   • {estado['status']}: {estado['cantidad']} usuarios")
        
        if stats_usuarios['registros_recientes']:
            print(f"\n📅 REGISTROS RECIENTES (últimos 10 días):")
            for registro in stats_usuarios['registros_recientes']:
                print(f"   • {registro['fecha']}: {registro['nuevos']} nuevos usuarios")
        
        # 2. ESTADÍSTICAS DE INSCRIPCIONES
        print("\n" + "="*60)
        print("📝 2. ESTADÍSTICAS DEL CONCURSO")
        print("="*60)
        
        stats_inscripciones = obtener_estadisticas_inscripciones(cursor)
        
        print(f"\n🎯 INSCRIPCIONES TOTALES: {stats_inscripciones['total']}")
        
        print(f"\n📋 DISTRIBUCIÓN POR ESTADO:")
        for estado in stats_inscripciones['por_estado']:
            porcentaje = (estado['cantidad'] / stats_inscripciones['total']) * 100
            print(f"   • {estado['status']}: {estado['cantidad']} ({porcentaje:.1f}%)")
        
        print(f"\n✅ DOCUMENTACIÓN OBLIGATORIA COMPLETA: {stats_inscripciones['documentacion_completa']}")
        print(f"⏳ PENDIENTE DE DOCUMENTACIÓN: {stats_inscripciones['documentacion_pendiente']}")
        
        print(f"\n🔄 PASO ACTUAL EN EL PROCESO:")
        for paso in stats_inscripciones['pasos_proceso']:
            porcentaje = (paso['cantidad'] / stats_inscripciones['total']) * 100
            print(f"   • {paso['current_step']}: {paso['cantidad']} ({porcentaje:.1f}%)")
        
        # 3. ESTADÍSTICAS DE DOCUMENTACIÓN
        print("\n" + "="*60)
        print("📄 3. ESTADÍSTICAS DE DOCUMENTACIÓN")
        print("="*60)
        
        stats_docs = obtener_estadisticas_documentos(cursor)
        
        print(f"\n📑 TOTAL DE DOCUMENTOS SUBIDOS: {stats_docs['total']}")
        print(f"👤 USUARIOS CON DOCUMENTOS: {stats_docs['usuarios_con_docs']}")
        print(f"❌ USUARIOS SIN DOCUMENTOS: {stats_docs['usuarios_sin_docs']}")
        print(f"📊 PROMEDIO DE DOCUMENTOS POR USUARIO: {stats_docs['promedio_por_usuario']}")
        
        print(f"\n🏷️ ESTADO DE LOS DOCUMENTOS:")
        for estado in stats_docs['por_estado']:
            porcentaje = (estado['cantidad'] / stats_docs['total']) * 100
            print(f"   • {estado['status']}: {estado['cantidad']} ({porcentaje:.1f}%)")
        
        # 4. USUARIOS INACTIVOS
        print("\n" + "="*60)
        print("😴 4. ANÁLISIS DE USUARIOS INACTIVOS")
        print("="*60)
        
        stats_inactivos = obtener_usuarios_inactivos(cursor)
        
        print(f"\n🚫 USUARIOS SIN NINGUNA ACTIVIDAD: {stats_inactivos['total_completamente_inactivos']}")
        
        print(f"\n📋 USUARIOS SIN INSCRIPCIÓN (primeros 10):")
        for usuario in stats_inactivos['sin_inscripcion'][:10]:
            print(f"   • DNI {usuario['dni']}: {usuario['first_name']} {usuario['last_name']}")
            print(f"     Email: {usuario['email']}")
            print(f"     Registrado: {usuario['created_at']}")
        
        if len(stats_inactivos['sin_inscripcion']) > 10:
            print(f"   ... y {len(stats_inactivos['sin_inscripcion']) - 10} más")
        
        print(f"\n📄 USUARIOS CON INSCRIPCIÓN PERO SIN DOCUMENTOS (primeros 10):")
        for usuario in stats_inactivos['sin_documentos'][:10]:
            print(f"   • DNI {usuario['dni']}: {usuario['first_name']} {usuario['last_name']}")
            print(f"     Email: {usuario['email']}")
            print(f"     Inscrito: {usuario['inscription_date']}")
        
        if len(stats_inactivos['sin_documentos']) > 10:
            print(f"   ... y {len(stats_inactivos['sin_documentos']) - 10} más")
        
        # 5. DISTRIBUCIÓN GEOGRÁFICA
        print("\n" + "="*60)
        print("🗺️ 5. DISTRIBUCIÓN GEOGRÁFICA")
        print("="*60)
        
        stats_geo = obtener_estadisticas_geograficas(cursor)
        
        print(f"\n🎯 POR CENTRO DE VIDA (inscripciones):")
        for centro in stats_geo['por_centro_vida']:
            print(f"   • {centro['centro_vida']}: {centro['cantidad']} inscripciones")
        
        print(f"\n🏛️ POR PROVINCIA (usuarios registrados):")
        for provincia in stats_geo['por_provincia']:
            print(f"   • {provincia['provincia']}: {provincia['cantidad']} usuarios")
        
        print(f"\n🏘️ POR MUNICIPIO (top 15):")
        for municipio in stats_geo['por_municipio']:
            print(f"   • {municipio['municipio']}: {municipio['cantidad']} usuarios")
        
        # 6. RESUMEN EJECUTIVO
        print("\n" + "="*60)
        print("📊 6. RESUMEN EJECUTIVO")
        print("="*60)
        
        tasa_inscripcion = (stats_inscripciones['total'] / stats_usuarios['total']) * 100
        tasa_docs_completos = (stats_inscripciones['documentacion_completa'] / stats_inscripciones['total']) * 100 if stats_inscripciones['total'] > 0 else 0
        tasa_inactividad = (stats_inactivos['total_completamente_inactivos'] / stats_usuarios['total']) * 100
        
        print(f"\n🎯 MÉTRICAS CLAVE:")
        print(f"   • Total usuarios registrados: {stats_usuarios['total']}")
        print(f"   • Tasa de inscripción: {tasa_inscripcion:.1f}%")
        print(f"   • Usuarios con documentación completa: {stats_inscripciones['documentacion_completa']}")
        print(f"   • Tasa de finalización del proceso: {tasa_docs_completos:.1f}%")
        print(f"   • Usuarios completamente inactivos: {stats_inactivos['total_completamente_inactivos']}")
        print(f"   • Tasa de inactividad: {tasa_inactividad:.1f}%")
        print(f"   • Documentos totales en el sistema: {stats_docs['total']}")
        
        print(f"\n✅ ESTADO GENERAL DE LA PLATAFORMA:")
        if tasa_inscripcion > 70:
            print(f"   🟢 Alta participación en el concurso")
        elif tasa_inscripcion > 50:
            print(f"   🟡 Participación moderada en el concurso")
        else:
            print(f"   🔴 Baja participación en el concurso")
            
        if tasa_docs_completos > 70:
            print(f"   🟢 Alta tasa de finalización del proceso")
        elif tasa_docs_completos > 50:
            print(f"   🟡 Tasa de finalización moderada")
        else:
            print(f"   🔴 Baja tasa de finalización del proceso")
        
        print("\n" + "="*80)
        print("FIN DEL INFORME")
        print("="*80)
        
    except Exception as e:
        print(f"❌ Error generando informe: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    generar_informe_completo()
