#!/usr/bin/env python3
"""
INVESTIGACIÓN FORENSE DE LOGS - RECUPERACIÓN DE CIRCUNSCRIPCIONES
Análisis exhaustivo de logs para recuperar datos perdidos
"""

import subprocess
import json
import re
import mysql.connector
from datetime import datetime, timedelta
import os

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

def obtener_inscripciones_afectadas():
    """Obtiene lista de inscripciones sin circunscripciones"""
    conn = connect_to_database()
    if not conn:
        return []
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.id, i.user_id, i.created_at, i.updated_at, u.email, i.status
        FROM inscriptions i 
        JOIN user_entity u ON i.user_id = u.id 
        WHERE i.status IN ('COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS')
        ORDER BY i.created_at ASC
    """)
    
    inscripciones = cursor.fetchall()
    conn.close()
    
    print(f"📊 Inscripciones afectadas encontradas: {len(inscripciones)}")
    return inscripciones

def analizar_logs_backend_detallados():
    """Analiza logs del backend buscando requests con circunscripciones"""
    print("\n🔍 ANÁLISIS DETALLADO DE LOGS DEL BACKEND")
    print("=" * 60)
    
    # Buscar en logs desde hace 10 días
    dias = 10
    print(f"📅 Analizando logs de los últimos {dias} días...")
    
    try:
        # Logs del backend con mayor detalle
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend', 
            '--since', f'{dias * 24}h'
        ], capture_output=True, text=True)
        
        logs_content = result.stdout + result.stderr
        lines = logs_content.split('\n')
        
        print(f"📝 Total líneas de log analizadas: {len(lines):,}")
        
        # Buscar líneas relevantes
        patterns_circunscripciones = [
            r'selectedCircunscripciones',
            r'circunscripcion',
            r'PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA',
            r'updateInscriptionStep',
            r'inscription.*step',
            r'PUT.*step',
            r'POST.*inscription'
        ]
        
        encontradas = {}
        for pattern in patterns_circunscripciones:
            encontradas[pattern] = []
            for i, line in enumerate(lines):
                if re.search(pattern, line, re.IGNORECASE):
                    encontradas[pattern].append((i, line.strip()))
        
        # Mostrar resultados
        total_matches = sum(len(matches) for matches in encontradas.values())
        print(f"🎯 Total coincidencias encontradas: {total_matches}")
        
        for pattern, matches in encontradas.items():
            if matches:
                print(f"\n🔍 Patrón '{pattern}': {len(matches)} coincidencias")
                for i, (line_num, line) in enumerate(matches[:5]):  # Mostrar solo 5 ejemplos
                    print(f"   {line_num:6d}: {line[:100]}{'...' if len(line) > 100 else ''}")
                if len(matches) > 5:
                    print(f"   ... y {len(matches) - 5} coincidencias más")
        
        # Buscar específicamente requests HTTP con body
        print(f"\n🌐 Buscando requests HTTP con datos...")
        http_patterns = [
            r'PUT.*inscription.*step',
            r'POST.*inscription',
            r'\{.*selectedCircunscripciones.*\}',
            r'Request.*body.*circun'
        ]
        
        http_matches = []
        for pattern in http_patterns:
            for i, line in enumerate(lines):
                if re.search(pattern, line, re.IGNORECASE):
                    # Incluir contexto (líneas anteriores y posteriores)
                    context_start = max(0, i - 2)
                    context_end = min(len(lines), i + 3)
                    context = lines[context_start:context_end]
                    http_matches.append((i, pattern, context))
        
        print(f"📨 Requests HTTP encontrados: {len(http_matches)}")
        for i, (line_num, pattern, context) in enumerate(http_matches[:3]):
            print(f"\n📤 Match {i+1} (línea {line_num}, patrón: {pattern}):")
            for j, ctx_line in enumerate(context):
                marker = ">>> " if j == 2 else "    "  # Marcar línea principal
                print(f"   {marker}{ctx_line[:120]}{'...' if len(ctx_line) > 120 else ''}")
        
        if len(http_matches) > 3:
            print(f"   ... y {len(http_matches) - 3} requests más")
            
        return {
            'total_lines': len(lines),
            'matches': encontradas,
            'http_requests': http_matches
        }
        
    except Exception as e:
        print(f"❌ Error analizando logs del backend: {e}")
        return None

def analizar_logs_nginx():
    """Analiza logs de nginx buscando requests POST/PUT con datos"""
    print("\n🔍 ANÁLISIS DE LOGS DE NGINX/PROXY")
    print("=" * 60)
    
    try:
        # Logs de nginx
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-nginx-proxy', 
            '--since', '240h'  # 10 días
        ], capture_output=True, text=True)
        
        nginx_logs = result.stdout + result.stderr
        lines = nginx_logs.split('\n')
        
        print(f"📝 Líneas de log de nginx: {len(lines):,}")
        
        # Buscar requests específicos
        relevant_requests = []
        patterns = [
            r'PUT.*inscription.*step',
            r'POST.*inscription',
            r'"POST.*inscription.*HTTP',
            r'"PUT.*inscription.*step.*HTTP'
        ]
        
        for pattern in patterns:
            for line in lines:
                if re.search(pattern, line, re.IGNORECASE):
                    relevant_requests.append(line.strip())
        
        print(f"📨 Requests relevantes encontrados: {len(relevant_requests)}")
        
        # Analizar requests por día
        if relevant_requests:
            print(f"\n📅 Distribución por período:")
            dates_found = {}
            for request in relevant_requests:
                # Intentar extraer fecha del log
                date_match = re.search(r'(\d{1,2}/\w{3}/\d{4})', request)
                if date_match:
                    date = date_match.group(1)
                    dates_found[date] = dates_found.get(date, 0) + 1
            
            for date, count in sorted(dates_found.items()):
                print(f"   {date}: {count} requests")
        
        # Mostrar ejemplos
        print(f"\n📝 Ejemplos de requests (primeros 5):")
        for i, request in enumerate(relevant_requests[:5]):
            print(f"   {i+1}: {request[:150]}{'...' if len(request) > 150 else ''}")
        
        return {
            'total_lines': len(lines),
            'relevant_requests': relevant_requests,
            'dates_distribution': dates_found if 'dates_found' in locals() else {}
        }
        
    except Exception as e:
        print(f"❌ Error analizando logs de nginx: {e}")
        return None

def buscar_en_archivos_logs():
    """Busca en archivos de logs del sistema"""
    print("\n🔍 BÚSQUEDA EN ARCHIVOS DE LOGS DEL SISTEMA")
    print("=" * 60)
    
    # Buscar archivos de logs
    log_locations = [
        '/var/log/',
        './logs/',
        './'
    ]
    
    log_files_found = []
    
    for location in log_locations:
        if os.path.exists(location):
            try:
                result = subprocess.run([
                    'find', location, '-name', '*.log', '-type', 'f'
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    files = result.stdout.strip().split('\n')
                    log_files_found.extend([f for f in files if f])
            except Exception as e:
                print(f"⚠️ Error buscando en {location}: {e}")
    
    print(f"📁 Archivos de log encontrados: {len(log_files_found)}")
    
    # Analizar archivos relevantes
    relevant_files = []
    for log_file in log_files_found:
        if any(term in log_file.lower() for term in ['nginx', 'apache', 'access', 'error', 'app']):
            relevant_files.append(log_file)
    
    print(f"📋 Archivos relevantes: {len(relevant_files)}")
    for log_file in relevant_files[:10]:
        size = "?"
        try:
            size = f"{os.path.getsize(log_file):,} bytes"
        except:
            pass
        print(f"   - {log_file}: {size}")
    
    # Buscar contenido en archivos relevantes
    matches_found = 0
    for log_file in relevant_files[:5]:  # Solo primeros 5 para no saturar
        try:
            print(f"\n🔍 Analizando {log_file}...")
            result = subprocess.run([
                'grep', '-i', '-n', '-E', 
                'circunscripcion|selectedCircun|inscription.*step',
                log_file
            ], capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout:
                matches = result.stdout.strip().split('\n')
                matches_found += len(matches)
                print(f"   ✅ {len(matches)} coincidencias encontradas")
                
                for match in matches[:3]:
                    print(f"      {match[:100]}{'...' if len(match) > 100 else ''}")
                    
                if len(matches) > 3:
                    print(f"      ... y {len(matches) - 3} más")
            else:
                print(f"   ❌ Sin coincidencias")
                
        except Exception as e:
            print(f"   ⚠️ Error: {e}")
    
    return {
        'total_log_files': len(log_files_found),
        'relevant_files': relevant_files,
        'matches_found': matches_found
    }

def crear_mapa_inscripciones():
    """Crea mapa de inscripciones por email y fecha para correlacionar con logs"""
    print("\n🗺️ CREANDO MAPA DE INSCRIPCIONES PARA CORRELACIÓN")
    print("=" * 60)
    
    inscripciones = obtener_inscripciones_afectadas()
    
    # Crear mapa por email y por fecha
    mapa_email = {}
    mapa_fecha = {}
    
    for ins in inscripciones:
        ins_id, user_id, created_at, updated_at, email, status = ins
        
        # Convertir UUIDs binarios a string hex
        ins_id_hex = ins_id.hex() if isinstance(ins_id, bytes) else str(ins_id)
        user_id_hex = user_id.hex() if isinstance(user_id, bytes) else str(user_id)
        
        # Mapear por email
        mapa_email[email] = {
            'inscription_id': ins_id_hex,
            'user_id': user_id_hex,
            'created_at': created_at,
            'updated_at': updated_at,
            'status': status
        }
        
        # Mapear por fecha (día)
        fecha_key = created_at.date() if hasattr(created_at, 'date') else str(created_at)[:10]
        if fecha_key not in mapa_fecha:
            mapa_fecha[fecha_key] = []
        mapa_fecha[fecha_key].append({
            'email': email,
            'inscription_id': ins_id_hex,
            'user_id': user_id_hex
        })
    
    print(f"📊 Mapa creado:")
    print(f"   - {len(mapa_email)} inscripciones por email")
    print(f"   - {len(mapa_fecha)} días con inscripciones")
    
    print(f"\n📅 Distribución por fecha:")
    for fecha, inscripciones_dia in sorted(mapa_fecha.items()):
        print(f"   {fecha}: {len(inscripciones_dia)} inscripciones")
    
    return {
        'por_email': mapa_email,
        'por_fecha': mapa_fecha
    }

def generar_reporte_investigacion():
    """Genera reporte completo de la investigación"""
    print("\n" + "=" * 80)
    print("📋 REPORTE COMPLETO DE INVESTIGACIÓN FORENSE")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Paso 1: Obtener inscripciones afectadas
    inscripciones = obtener_inscripciones_afectadas()
    
    # Paso 2: Crear mapa de correlación
    mapa_inscripciones = crear_mapa_inscripciones()
    
    # Paso 3: Analizar logs del backend
    backend_results = analizar_logs_backend_detallados()
    
    # Paso 4: Analizar logs de nginx
    nginx_results = analizar_logs_nginx()
    
    # Paso 5: Buscar en archivos del sistema
    system_results = buscar_en_archivos_logs()
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN EJECUTIVO DE INVESTIGACIÓN")
    print("=" * 80)
    print(f"• Inscripciones afectadas: {len(inscripciones)}")
    if backend_results:
        total_matches = sum(len(matches) for matches in backend_results['matches'].values())
        print(f"• Coincidencias en logs backend: {total_matches}")
    if nginx_results:
        print(f"• Requests relevantes en nginx: {len(nginx_results['relevant_requests'])}")
    if system_results:
        print(f"• Coincidencias en archivos de sistema: {system_results['matches_found']}")
    
    print(f"\n📋 PRÓXIMOS PASOS RECOMENDADOS:")
    print(f"  1. Analizar coincidencias encontradas en detalle")
    print(f"  2. Correlacionar timestamps de logs con inscripciones")
    print(f"  3. Extraer datos JSON de requests HTTP completos")
    print(f"  4. Crear script de restauración de datos")
    
    return {
        'inscripciones': inscripciones,
        'backend': backend_results,
        'nginx': nginx_results,
        'system': system_results,
        'mapa': mapa_inscripciones
    }

if __name__ == "__main__":
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('docker-compose.production.yml'):
        print("❌ Execute from the mpd_concursos root directory")
        exit(1)
    
    resultado = generar_reporte_investigacion()
    
    print(f"\n🎯 Investigación completada. Datos disponibles para análisis manual.")
