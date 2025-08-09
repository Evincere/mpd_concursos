#!/usr/bin/env python3
"""
ANÁLISIS DETALLADO DE LOGS - EXTRACCIÓN DE CIRCUNSCRIPCIONES
Extrae datos específicos de requests con circunscripciones
"""

import subprocess
import re
import json
import mysql.connector
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

def analizar_logs_nginx_detallado():
    """Análisis detallado de logs de nginx para extraer requests POST/PUT"""
    print("🔍 ANÁLISIS DETALLADO DE NGINX ACCESS LOGS")
    print("=" * 60)
    
    try:
        with open('/var/log/nginx/access.log', 'r') as f:
            lines = f.readlines()
        
        print(f"📝 Procesando {len(lines):,} líneas de access.log...")
        
        # Buscar requests POST/PUT a endpoints de inscripción
        inscription_requests = []
        
        for i, line in enumerate(lines):
            # Buscar requests a endpoints de inscripción
            if re.search(r'(POST|PUT).*inscription.*step|PUT.*inscription.*HTTP', line, re.IGNORECASE):
                inscription_requests.append((i, line.strip()))
        
        print(f"📤 Requests de inscripción encontrados: {len(inscription_requests)}")
        
        # Analizar requests por detalle
        analyzed_requests = []
        for line_num, request in inscription_requests:
            # Extraer información del request
            match = re.search(r'(\d+\.\d+\.\d+\.\d+).*\[(.*?)\] "(.*?)" (\d+) (\d+)', request)
            if match:
                ip, timestamp, method_url, status, size = match.groups()
                
                # Extraer método y URL
                method_url_match = re.search(r'(GET|POST|PUT|PATCH|DELETE) (.*?) HTTP', method_url)
                if method_url_match:
                    method, url = method_url_match.groups()
                    
                    analyzed_requests.append({
                        'line': line_num,
                        'ip': ip,
                        'timestamp': timestamp,
                        'method': method,
                        'url': url,
                        'status': int(status),
                        'size': int(size),
                        'full_request': request
                    })
        
        print(f"📊 Requests analizados: {len(analyzed_requests)}")
        
        # Mostrar requests más relevantes
        relevant_requests = [r for r in analyzed_requests 
                           if 'step' in r['url'] and r['method'] in ['PUT', 'POST']]
        
        print(f"🎯 Requests relevantes (PUT/POST a /step): {len(relevant_requests)}")
        
        for i, req in enumerate(relevant_requests[:10]):
            print(f"   {i+1}. [{req['timestamp']}] {req['method']} {req['url']} -> {req['status']}")
        
        if len(relevant_requests) > 10:
            print(f"      ... y {len(relevant_requests) - 10} más")
        
        return relevant_requests
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def extraer_contexto_updateInscriptionStep():
    """Extrae contexto detallado de logs de UpdateInscriptionStepService"""
    print("\n🔍 EXTRACCIÓN DE CONTEXTO - UpdateInscriptionStepService")
    print("=" * 60)
    
    try:
        # Obtener logs completos del backend
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend', 
            '--since', '240h'  # 10 días
        ], capture_output=True, text=True)
        
        logs = result.stdout
        lines = logs.split('\n')
        
        print(f"📝 Analizando {len(lines):,} líneas...")
        
        # Buscar contexto de updateInscriptionStep
        contexts = []
        
        for i, line in enumerate(lines):
            if 'UpdateInscriptionStepService' in line and 'MÉTODO EJECUTADO' in line:
                # Extraer contexto (5 líneas antes, la línea actual, 20 líneas después)
                context_start = max(0, i - 5)
                context_end = min(len(lines), i + 20)
                context = lines[context_start:context_end]
                
                # Buscar información relevante en el contexto
                inscription_id = None
                step = None
                request_data = []
                
                for ctx_line in context:
                    # Buscar ID de inscripción
                    id_match = re.search(r'ID: ([a-f0-9-]{36})', ctx_line)
                    if id_match:
                        inscription_id = id_match.group(1)
                    
                    # Buscar step
                    step_match = re.search(r'Step: (\w+)', ctx_line)
                    if step_match:
                        step = step_match.group(1)
                    
                    # Buscar datos de request
                    if 'circun' in ctx_line.lower() or 'preferences' in ctx_line.lower():
                        request_data.append(ctx_line.strip())
                
                contexts.append({
                    'line_num': i,
                    'inscription_id': inscription_id,
                    'step': step,
                    'timestamp': None,  # Extraer si es posible
                    'context': context,
                    'request_data': request_data
                })
        
        print(f"🎯 Contextos de updateInscriptionStep encontrados: {len(contexts)}")
        
        # Analizar contextos con datos relevantes
        relevant_contexts = [ctx for ctx in contexts if ctx['request_data']]
        print(f"📊 Contextos con datos relevantes: {len(relevant_contexts)}")
        
        for i, ctx in enumerate(relevant_contexts[:5]):
            print(f"\n📤 Contexto {i+1}:")
            print(f"   ID: {ctx['inscription_id']}")
            print(f"   Step: {ctx['step']}")
            print(f"   Datos encontrados:")
            for data in ctx['request_data']:
                print(f"      {data[:100]}{'...' if len(data) > 100 else ''}")
        
        return contexts
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def buscar_json_en_logs():
    """Busca estructuras JSON en logs que puedan contener circunscripciones"""
    print("\n🔍 BÚSQUEDA DE ESTRUCTURAS JSON EN LOGS")
    print("=" * 60)
    
    try:
        # Buscar en logs del backend
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend', 
            '--since', '240h'
        ], capture_output=True, text=True)
        
        logs = result.stdout
        
        # Buscar líneas con estructura JSON
        json_patterns = [
            r'\{.*selectedCircunscripciones.*\}',
            r'\{.*"PRIMERA"|"SEGUNDA"|"TERCERA".*\}',
            r'\{.*circunscripciones.*\:.*\[.*\].*\}',
            r'\{.*step.*inscription.*\}',
        ]
        
        json_matches = []
        
        for pattern in json_patterns:
            matches = re.findall(pattern, logs, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Intentar parsear como JSON
                try:
                    # Limpiar y intentar parsear
                    clean_match = match.strip()
                    if clean_match.startswith('{') and clean_match.endswith('}'):
                        parsed = json.loads(clean_match)
                        if 'selectedCircunscripciones' in str(parsed):
                            json_matches.append({
                                'raw': clean_match,
                                'parsed': parsed,
                                'pattern': pattern
                            })
                except json.JSONDecodeError:
                    # Si no es JSON válido, guardarlo como raw
                    if len(match) < 500:  # Solo si no es muy largo
                        json_matches.append({
                            'raw': match,
                            'parsed': None,
                            'pattern': pattern
                        })
        
        print(f"🎯 Estructuras JSON encontradas: {len(json_matches)}")
        
        # Mostrar resultados
        for i, match in enumerate(json_matches[:5]):
            print(f"\n📤 JSON {i+1} (patrón: {match['pattern']}):")
            if match['parsed']:
                print(f"   ✅ JSON válido:")
                print(f"   {json.dumps(match['parsed'], indent=2)[:200]}...")
            else:
                print(f"   📝 Raw data:")
                print(f"   {match['raw'][:150]}{'...' if len(match['raw']) > 150 else ''}")
        
        return json_matches
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def correlacionar_con_base_datos(contexts, nginx_requests):
    """Correlaciona logs con datos de la base de datos"""
    print("\n🔗 CORRELACIÓN CON BASE DE DATOS")
    print("=" * 60)
    
    conn = connect_to_database()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    # Obtener inscripciones para correlacionar
    cursor.execute("""
        SELECT HEX(i.id) as id_hex, i.created_at, i.updated_at, u.email, i.status
        FROM inscriptions i 
        JOIN user_entity u ON i.user_id = u.id 
        WHERE i.status IN ('COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS')
        ORDER BY i.updated_at DESC
        LIMIT 50
    """)
    
    inscripciones = cursor.fetchall()
    
    print(f"📊 Inscripciones para correlacionar: {len(inscripciones)}")
    
    # Correlacionar contextos con inscripciones
    correlaciones = []
    
    for ctx in contexts:
        if ctx['inscription_id']:
            # Buscar inscripción correspondiente
            inscription_match = None
            for ins in inscripciones:
                id_hex, created_at, updated_at, email, status = ins
                # Comparar IDs (quitar guiones para comparar)
                if ctx['inscription_id'].replace('-', '').upper() == id_hex.upper():
                    inscription_match = {
                        'id': id_hex,
                        'email': email,
                        'created_at': created_at,
                        'updated_at': updated_at,
                        'status': status
                    }
                    break
            
            if inscription_match:
                correlaciones.append({
                    'context': ctx,
                    'inscription': inscription_match
                })
    
    print(f"🎯 Correlaciones exitosas: {len(correlaciones)}")
    
    # Mostrar correlaciones relevantes
    for i, corr in enumerate(correlaciones[:3]):
        print(f"\n📤 Correlación {i+1}:")
        print(f"   Email: {corr['inscription']['email']}")
        print(f"   Estado: {corr['inscription']['status']}")
        print(f"   Actualizado: {corr['inscription']['updated_at']}")
        if corr['context']['request_data']:
            print(f"   Datos encontrados en logs:")
            for data in corr['context']['request_data']:
                print(f"      {data[:80]}{'...' if len(data) > 80 else ''}")
    
    conn.close()
    return correlaciones

def generar_reporte_detallado():
    """Genera reporte detallado de la investigación"""
    print("\n" + "=" * 80)
    print("📋 ANÁLISIS DETALLADO DE LOGS - BÚSQUEDA DE CIRCUNSCRIPCIONES")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Análisis 1: Nginx logs
    nginx_requests = analizar_logs_nginx_detallado()
    
    # Análisis 2: Contexto de UpdateInscriptionStepService
    contexts = extraer_contexto_updateInscriptionStep()
    
    # Análisis 3: Búsqueda de JSON
    json_matches = buscar_json_en_logs()
    
    # Análisis 4: Correlación
    correlaciones = correlacionar_con_base_datos(contexts, nginx_requests)
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN DEL ANÁLISIS DETALLADO")
    print("=" * 80)
    print(f"• Requests de nginx analizados: {len(nginx_requests) if nginx_requests else 0}")
    print(f"• Contextos de updateInscriptionStep: {len(contexts) if contexts else 0}")
    print(f"• Estructuras JSON encontradas: {len(json_matches) if json_matches else 0}")
    print(f"• Correlaciones exitosas: {len(correlaciones) if correlaciones else 0}")
    
    if correlaciones:
        print(f"\n🎯 DATOS POTENCIALMENTE RECUPERABLES:")
        for i, corr in enumerate(correlaciones[:5]):
            print(f"   {i+1}. {corr['inscription']['email']} - ID: {corr['inscription']['id'][:8]}...")
    
    print(f"\n📋 SIGUIENTE FASE:")
    print(f"  • Analizar manualmente las correlaciones encontradas")
    print(f"  • Extraer patrones de datos de requests")
    print(f"  • Crear script de restauración específico")
    
    return {
        'nginx_requests': nginx_requests,
        'contexts': contexts,
        'json_matches': json_matches,
        'correlaciones': correlaciones
    }

if __name__ == "__main__":
    resultado = generar_reporte_detallado()
    print(f"\n🎉 Análisis detallado completado.")
