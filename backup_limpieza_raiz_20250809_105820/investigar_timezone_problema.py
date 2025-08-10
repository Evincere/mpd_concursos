#!/usr/bin/env python3
"""
INVESTIGACIÓN DE PROBLEMA DE ZONA HORARIA
Análisis de configuración de timezone en el sistema y aplicación
"""

import subprocess
import mysql.connector
from datetime import datetime

def verificar_timezone_sistema():
    """Verifica la configuración de timezone del sistema"""
    print("🕐 VERIFICACIÓN DE TIMEZONE DEL SISTEMA")
    print("=" * 60)
    
    # 1. Timezone del sistema host
    try:
        result = subprocess.run(['timedatectl', 'show'], capture_output=True, text=True)
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if 'Timezone' in line:
                    print(f"   Sistema Host: {line}")
        
        # También verificar con date
        result_date = subprocess.run(['date'], capture_output=True, text=True)
        print(f"   Fecha/Hora Host: {result_date.stdout.strip()}")
        
    except Exception as e:
        print(f"❌ Error verificando timezone del host: {e}")
    
    # 2. Timezone de contenedores Docker
    print(f"\n🐳 TIMEZONE DE CONTENEDORES:")
    
    containers = ['mpd-concursos-backend', 'mpd-concursos-mysql']
    
    for container in containers:
        try:
            result = subprocess.run([
                'docker', 'exec', container, 'date'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"   {container}: {result.stdout.strip()}")
            else:
                print(f"   {container}: ❌ Error obteniendo fecha")
                
        except Exception as e:
            print(f"   {container}: ❌ Error: {e}")

def verificar_timezone_java():
    """Verifica configuración de timezone en la aplicación Java"""
    print(f"\n☕ CONFIGURACIÓN TIMEZONE JAVA")
    print("=" * 60)
    
    try:
        # Buscar en logs del backend referencias a timezone
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend'
        ], capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        
        # Buscar configuración de timezone
        timezone_lines = []
        for line in logs.split('\n'):
            if any(term in line.lower() for term in ['timezone', 'utc', 'gmt', 'america/argentina', 'time']):
                if len(line) < 200:  # Evitar líneas muy largas
                    timezone_lines.append(line.strip())
        
        if timezone_lines:
            print(f"📝 Referencias a timezone en logs ({len(timezone_lines)} encontradas):")
            for i, line in enumerate(timezone_lines[:5]):
                print(f"   {i+1}: {line}")
            if len(timezone_lines) > 5:
                print(f"   ... y {len(timezone_lines) - 5} más")
        else:
            print(f"❌ No se encontraron configuraciones de timezone en logs")
    
    except Exception as e:
        print(f"❌ Error verificando logs de Java: {e}")

def verificar_inscripcion_gabriela():
    """Busca la inscripción específica de Gabriela Luis"""
    print(f"\n👤 BÚSQUEDA DE INSCRIPCIÓN - GABRIELA LUIS")
    print("=" * 60)
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3307,
            user='root',
            password='root1234',
            database='mpd_concursos'
        )
        
        cursor = connection.cursor()
        
        # Buscar por email que contenga "gabriela" y "luis"
        cursor.execute("""
            SELECT 
                HEX(i.id) as inscription_id,
                u.email,
                u.first_name,
                u.last_name,
                i.created_at,
                i.updated_at,
                i.status,
                i.inscription_date
            FROM inscriptions i
            JOIN user_entity u ON i.user_id = u.id
            WHERE (LOWER(u.email) LIKE '%gabriela%' AND LOWER(u.email) LIKE '%luis%')
               OR (LOWER(u.first_name) LIKE '%gabriela%' AND LOWER(u.last_name) LIKE '%luis%')
               OR LOWER(u.email) LIKE '%aluis%'
            ORDER BY i.created_at DESC
        """)
        
        results = cursor.fetchall()
        
        if results:
            print(f"✅ Inscripciones encontradas: {len(results)}")
            for result in results:
                ins_id, email, first_name, last_name, created_at, updated_at, status, inscription_date = result
                print(f"\n📋 Inscripción encontrada:")
                print(f"   Email: {email}")
                print(f"   Nombre: {first_name} {last_name}")
                print(f"   Estado: {status}")
                print(f"   🕐 Created At: {created_at}")
                print(f"   🕐 Updated At: {updated_at}")
                print(f"   🕐 Inscription Date: {inscription_date}")
                
                # Verificar si es de hoy
                if created_at:
                    fecha_creacion = created_at.strftime('%Y-%m-%d') if hasattr(created_at, 'strftime') else str(created_at)[:10]
                    print(f"   📅 Fecha creación: {fecha_creacion}")
                    
                    if '2025-08-08' in fecha_creacion or '2025-08-09' in fecha_creacion:
                        print(f"   🎯 ¡Esta podría ser la inscripción de Gabriela!")
        else:
            # Buscar por cualquier inscripción reciente (últimas 24 horas)
            cursor.execute("""
                SELECT 
                    HEX(i.id) as inscription_id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    i.created_at,
                    i.updated_at,
                    i.status
                FROM inscriptions i
                JOIN user_entity u ON i.user_id = u.id
                WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                ORDER BY i.created_at DESC
                LIMIT 10
            """)
            
            recent_results = cursor.fetchall()
            print(f"📊 Inscripciones recientes (últimas 24h): {len(recent_results)}")
            
            for result in recent_results:
                ins_id, email, first_name, last_name, created_at, updated_at, status = result
                print(f"   {email}: {created_at} - {status}")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error buscando inscripción: {e}")

def verificar_timezone_mysql():
    """Verifica configuración de timezone en MySQL"""
    print(f"\n🗄️ CONFIGURACIÓN TIMEZONE MYSQL")
    print("=" * 60)
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3307,
            user='root',
            password='root1234',
            database='mpd_concursos'
        )
        
        cursor = connection.cursor()
        
        # Verificar timezone de MySQL
        cursor.execute("SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP()")
        result = cursor.fetchone()
        
        if result:
            global_tz, session_tz, now_time, utc_time = result
            print(f"   Global timezone: {global_tz}")
            print(f"   Session timezone: {session_tz}")
            print(f"   NOW(): {now_time}")
            print(f"   UTC_TIMESTAMP(): {utc_time}")
            
            # Calcular diferencia
            if now_time and utc_time:
                diff = now_time - utc_time
                print(f"   Diferencia con UTC: {diff}")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error verificando MySQL timezone: {e}")

def verificar_configuracion_aplicacion():
    """Verifica configuración de timezone en la aplicación"""
    print(f"\n⚙️ CONFIGURACIÓN DE APLICACIÓN")
    print("=" * 60)
    
    # Buscar en archivos de configuración
    config_files = [
        './concurso-backend/src/main/resources/application.properties',
        './concurso-backend/src/main/resources/application-prod.properties',
        './docker-compose.production.yml',
        './.env',
        './.env.production'
    ]
    
    for config_file in config_files:
        try:
            with open(config_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Buscar configuración de timezone
            timezone_config = []
            for line in content.split('\n'):
                if any(term in line.lower() for term in ['timezone', 'tz', 'utc', 'america/argentina']):
                    timezone_config.append(line.strip())
            
            if timezone_config:
                print(f"✅ {config_file}:")
                for config in timezone_config[:3]:
                    print(f"   {config}")
                    
        except Exception as e:
            if 'No such file' not in str(e):
                print(f"❌ Error leyendo {config_file}: {e}")

def generar_solucion_timezone():
    """Genera solución para el problema de timezone"""
    print(f"\n💡 SOLUCIÓN RECOMENDADA")
    print("=" * 60)
    
    print(f"🎯 PROBLEMA IDENTIFICADO:")
    print(f"   • Usuario se inscribió 08/08 21:45hs (hora Argentina)")
    print(f"   • Sistema registró fecha como 09/08")
    print(f"   • Diferencia de 3 horas sugiere problema UTC vs ART")
    
    print(f"\n🔧 CONFIGURACIONES A VERIFICAR:")
    print(f"   1. Timezone de contenedores Docker")
    print(f"   2. Timezone de aplicación Spring Boot")
    print(f"   3. Timezone de base de datos MySQL")
    print(f"   4. Variables de entorno TZ")
    
    print(f"\n⚡ ACCIONES INMEDIATAS:")
    print(f"   1. Identificar inscripción específica de Gabriela Luis")
    print(f"   2. Verificar timestamps en base de datos")
    print(f"   3. Corregir configuración de timezone")
    print(f"   4. Considerar corrección retroactiva si es crítico")

def main():
    """Función principal de investigación"""
    print("🕐 INVESTIGACIÓN DE PROBLEMA DE TIMEZONE")
    print("=" * 80)
    print(f"📅 Reclamo: Usuario Gabriela Luis")
    print(f"📅 Inscripción: 08/08 antes 21:45hs → Sistema registró 09/08")
    print(f"📅 Hora actual: 22:12 del 08/08/25")
    print()
    
    # 1. Verificar timezone del sistema
    verificar_timezone_sistema()
    
    # 2. Verificar timezone Java
    verificar_timezone_java()
    
    # 3. Buscar inscripción específica
    verificar_inscripcion_gabriela()
    
    # 4. Verificar timezone MySQL
    verificar_timezone_mysql()
    
    # 5. Verificar configuración
    verificar_configuracion_aplicacion()
    
    # 6. Generar solución
    generar_solucion_timezone()
    
    print(f"\n✅ Investigación de timezone completada.")

if __name__ == "__main__":
    main()
