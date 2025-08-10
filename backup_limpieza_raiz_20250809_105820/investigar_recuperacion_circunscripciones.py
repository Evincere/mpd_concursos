#!/usr/bin/env python3
"""
Investigación para recuperar circunscripciones perdidas
Analiza posibles fuentes de recuperación de datos
"""

import mysql.connector
import json
import os
import glob
from datetime import datetime

def connect_to_database():
    """Conecta a la base de datos MySQL"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3307,
            user='root',
            password='root1234',
            database='mpd_concursos'
        )
        return connection
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

def analizar_inscripciones_por_periodo():
    """Analiza las inscripciones por período para entender el alcance"""
    conn = connect_to_database()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("🔍 ANÁLISIS DE INSCRIPCIONES POR PERÍODO")
    print("=" * 60)
    
    # Inscripciones por día
    cursor.execute("""
        SELECT DATE(created_at) as fecha, COUNT(*) as inscripciones,
               COUNT(CASE WHEN status = 'COMPLETED_WITH_DOCS' THEN 1 END) as completadas
        FROM inscriptions 
        GROUP BY DATE(created_at) 
        ORDER BY fecha ASC
    """)
    
    resultados = cursor.fetchall()
    total_afectadas = 0
    
    print("📅 Inscripciones por día:")
    for fecha, total, completadas in resultados:
        print(f"   {fecha}: {total:3d} inscripciones ({completadas:3d} completadas)")
        total_afectadas += completadas
    
    print(f"\n📊 RESUMEN:")
    print(f"   - Total inscripciones completadas: {total_afectadas}")
    print(f"   - Todas SIN circunscripciones registradas")
    
    conn.close()
    return total_afectadas

def buscar_logs_backend():
    """Busca logs del backend que puedan contener información"""
    print("\n🔍 BÚSQUEDA EN LOGS DEL BACKEND")
    print("=" * 60)
    
    # Buscar en logs de Docker
    print("📋 Verificando logs recientes del backend...")
    
    try:
        # Buscar en logs del contenedor
        import subprocess
        result = subprocess.run(['docker', 'logs', 'mpd-concursos-backend', '--since', '24h'], 
                              capture_output=True, text=True)
        
        logs = result.stdout
        if 'circun' in logs.lower() or 'preferences' in logs.lower():
            print("✅ Encontradas referencias a circunscripciones/preferences en logs")
            
            # Buscar líneas específicas
            lines = logs.split('\n')
            relevant_lines = [line for line in lines 
                            if 'circun' in line.lower() or 'preferences' in line.lower()]
            
            print(f"📝 Líneas relevantes encontradas ({len(relevant_lines)}):")
            for i, line in enumerate(relevant_lines[:10]):  # Mostrar solo 10
                print(f"   {i+1}: {line[:100]}...")
                
            if len(relevant_lines) > 10:
                print(f"   ... y {len(relevant_lines)-10} líneas más")
        else:
            print("❌ No se encontraron referencias relevantes en logs recientes")
            
    except Exception as e:
        print(f"❌ Error accediendo a logs: {e}")

def buscar_backups_con_datos():
    """Busca en backups si hay información recuperable"""
    print("\n🔍 BÚSQUEDA EN ARCHIVOS DE BACKUP")
    print("=" * 60)
    
    # Buscar archivos de backup
    backup_patterns = [
        '*.sql',
        '*.sql.gz',
        'backup_*.sql',
        '*backup*.sql',
        '*.json',
        '*.csv'
    ]
    
    archivos_backup = []
    for pattern in backup_patterns:
        archivos_backup.extend(glob.glob(pattern))
    
    print(f"📁 Archivos de backup encontrados: {len(archivos_backup)}")
    
    for archivo in archivos_backup[:10]:  # Mostrar solo primeros 10
        size = os.path.getsize(archivo)
        modified = datetime.fromtimestamp(os.path.getmtime(archivo))
        print(f"   - {archivo}: {size:,} bytes ({modified.strftime('%Y-%m-%d %H:%M')})")
    
    if len(archivos_backup) > 10:
        print(f"   ... y {len(archivos_backup)-10} archivos más")
    
    # Buscar específicamente en backups SQL
    sql_files = [f for f in archivos_backup if f.endswith('.sql')]
    
    for sql_file in sql_files[:3]:  # Verificar solo primeros 3
        print(f"\n🔍 Analizando {sql_file}...")
        try:
            with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(10000)  # Leer solo primeros 10KB
                
                if 'inscription_circunscripciones' in content:
                    lines = content.split('\n')
                    relevant_lines = [line for line in lines 
                                    if 'inscription_circunscripciones' in line 
                                    and 'INSERT' in line.upper()]
                    
                    if relevant_lines:
                        print(f"   ✅ Encontrados {len(relevant_lines)} INSERTs de circunscripciones!")
                        print(f"   📝 Ejemplo: {relevant_lines[0][:100]}...")
                    else:
                        print(f"   ❌ Tabla vacía en backup")
                else:
                    print(f"   ❌ No contiene datos de circunscripciones")
                    
        except Exception as e:
            print(f"   ❌ Error leyendo archivo: {e}")

def verificar_estructura_request_logs():
    """Verifica si hay logs de requests HTTP con datos POST"""
    print("\n🔍 BÚSQUEDA EN LOGS DE REQUESTS HTTP")
    print("=" * 60)
    
    try:
        import subprocess
        
        # Buscar logs de nginx que puedan tener requests
        result = subprocess.run(['docker', 'logs', 'mpd-concursos-nginx-proxy', '--since', '48h'], 
                              capture_output=True, text=True)
        
        nginx_logs = result.stdout
        
        # Buscar requests POST a endpoints de inscripción
        post_requests = [line for line in nginx_logs.split('\n') 
                        if 'POST' in line and ('/inscription' in line or '/step' in line)]
        
        print(f"📊 Requests POST encontrados: {len(post_requests)}")
        
        if post_requests:
            print("📝 Ejemplos de requests (últimos 5):")
            for req in post_requests[-5:]:
                print(f"   {req[:120]}...")
        else:
            print("❌ No se encontraron requests POST relevantes")
            
    except Exception as e:
        print(f"❌ Error accediendo a logs de nginx: {e}")

def investigar_estructura_frontend():
    """Investiga la estructura del frontend para entender el flujo"""
    print("\n🔍 ANÁLISIS DE ESTRUCTURA DEL FRONTEND")
    print("=" * 60)
    
    frontend_path = "mpd-concursos-app-frontend"
    
    if os.path.exists(frontend_path):
        print(f"✅ Directorio frontend encontrado: {frontend_path}")
        
        # Buscar archivos relacionados con circunscripciones
        import subprocess
        try:
            result = subprocess.run([
                'find', frontend_path, '-type', 'f', 
                '-name', '*.js', '-o', '-name', '*.ts', '-o', '-name', '*.jsx', '-o', '-name', '*.tsx'
            ], capture_output=True, text=True)
            
            js_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
            
            print(f"📁 Archivos JS/TS encontrados: {len(js_files)}")
            
            # Buscar en archivos que puedan contener lógica de circunscripciones
            for js_file in js_files[:20]:  # Revisar solo primeros 20
                if any(term in js_file.lower() for term in ['inscription', 'step', 'form', 'circun']):
                    try:
                        with open(js_file, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            if 'circun' in content.lower():
                                print(f"   ✅ {js_file}: Contiene referencias a circunscripciones")
                    except:
                        pass
                        
        except Exception as e:
            print(f"❌ Error analizando frontend: {e}")
    else:
        print(f"❌ No se encontró el directorio del frontend")

def generar_reporte_recuperacion():
    """Genera el reporte completo de investigación"""
    print("\n" + "=" * 80)
    print("📋 REPORTE DE INVESTIGACIÓN - RECUPERACIÓN DE CIRCUNSCRIPCIONES")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Análisis de inscripciones
    total_afectadas = analizar_inscripciones_por_periodo()
    
    # Búsqueda en logs
    buscar_logs_backend()
    
    # Búsqueda en backups
    buscar_backups_con_datos()
    
    # Búsqueda en logs HTTP
    verificar_estructura_request_logs()
    
    # Análisis de frontend
    investigar_estructura_frontend()
    
    print("\n" + "=" * 80)
    print("📊 CONCLUSIONES DE RECUPERACIÓN:")
    print("=" * 80)
    print(f"• {total_afectadas} inscripciones completadas afectadas")
    print("• Datos perdidos en el mapper, NO en la persistencia")
    print("• Posibles fuentes de recuperación a investigar:")
    print("  - Logs de aplicación con datos POST")
    print("  - Backups de base de datos previos al problema")
    print("  - Logs del navegador/frontend (si existen)")
    print("  - Contacto directo con usuarios (último recurso)")
    print("=" * 80)

if __name__ == "__main__":
    generar_reporte_recuperacion()
