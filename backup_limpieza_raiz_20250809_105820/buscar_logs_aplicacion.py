#!/usr/bin/env python3
"""
BÚSQUEDA ESPECÍFICA EN LOGS DE APLICACIÓN
Análisis directo de logs locales y búsqueda de patrones específicos
"""

import re
import subprocess
import os
from datetime import datetime

def analizar_logs_aplicacion_local():
    """Analiza logs locales de la aplicación"""
    print("🔍 ANÁLISIS DE LOGS LOCALES DE APLICACIÓN")
    print("=" * 60)
    
    log_files = [
        './logs/application-dev.log',
        './logs/backup-error.log'
    ]
    
    for log_file in log_files:
        if os.path.exists(log_file):
            print(f"\n📁 Analizando: {log_file}")
            size = os.path.getsize(log_file)
            print(f"   Tamaño: {size:,} bytes")
            
            try:
                with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Buscar patrones específicos
                patterns = [
                    r'selectedCircunscripciones.*\[.*\]',
                    r'PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA',
                    r'preferences.*circun',
                    r'updateInscriptionStep.*{.*}',
                    r'PUT.*inscription.*step'
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        print(f"   ✅ Patrón '{pattern}': {len(matches)} coincidencias")
                        for i, match in enumerate(matches[:3]):
                            print(f"      {i+1}: {match[:80]}{'...' if len(match) > 80 else ''}")
                        if len(matches) > 3:
                            print(f"      ... y {len(matches) - 3} más")
                    else:
                        print(f"   ❌ Patrón '{pattern}': Sin coincidencias")
                        
            except Exception as e:
                print(f"   ❌ Error: {e}")
        else:
            print(f"❌ No existe: {log_file}")

def buscar_en_logs_completos_backend():
    """Búsqueda más detallada en logs completos del backend"""
    print("\n🔍 BÚSQUEDA EXHAUSTIVA EN LOGS DEL BACKEND")
    print("=" * 60)
    
    try:
        # Obtener logs completos sin límite de tiempo
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend', 
            '--tail', '50000'  # Últimas 50,000 líneas
        ], capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        lines = logs.split('\n')
        
        print(f"📝 Analizando {len(lines):,} líneas de logs...")
        
        # Buscar patrones muy específicos
        specific_patterns = [
            r'Request body:.*selectedCircunscripciones',
            r'Mapping.*selectedCircunscripciones',
            r'Processing.*selectedCircunscripciones',
            r'Preferences.*selectedCircunscripciones.*\[.*\]',
            r'JSON.*selectedCircunscripciones',
            r'"selectedCircunscripciones"\s*:\s*\[.*\]',
            r'updateInscriptionStep.*Request.*{',
            r'InscriptionStepRequest.*selectedCircunscripciones'
        ]
        
        found_data = []
        
        for pattern in specific_patterns:
            matches = []
            for i, line in enumerate(lines):
                if re.search(pattern, line, re.IGNORECASE):
                    # Capturar contexto (línea anterior, actual, siguiente)
                    context = {
                        'line_num': i,
                        'pattern': pattern,
                        'before': lines[i-1] if i > 0 else '',
                        'current': line,
                        'after': lines[i+1] if i < len(lines)-1 else '',
                        'timestamp': extract_timestamp(line)
                    }
                    matches.append(context)
            
            if matches:
                print(f"\n✅ Patrón '{pattern[:40]}...': {len(matches)} coincidencias")
                found_data.extend(matches)
                
                for j, match in enumerate(matches[:2]):
                    print(f"   📤 Match {j+1}:")
                    if match['before']:
                        print(f"      Antes: {match['before'][:70]}{'...' if len(match['before']) > 70 else ''}")
                    print(f"      >>> {match['current'][:70]}{'...' if len(match['current']) > 70 else ''}")
                    if match['after']:
                        print(f"      Después: {match['after'][:70]}{'...' if len(match['after']) > 70 else ''}")
                
                if len(matches) > 2:
                    print(f"      ... y {len(matches) - 2} más")
            else:
                print(f"❌ Patrón '{pattern[:40]}...': Sin coincidencias")
        
        return found_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def extract_timestamp(line):
    """Extrae timestamp de una línea de log"""
    # Buscar patrones de timestamp comunes
    patterns = [
        r'\d{2}:\d{2}:\d{2}\.\d{3}',  # HH:MM:SS.mmm
        r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}',  # YYYY-MM-DD HH:MM:SS
        r'\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}',  # DD/MMM/YYYY:HH:MM:SS
    ]
    
    for pattern in patterns:
        match = re.search(pattern, line)
        if match:
            return match.group(0)
    
    return None

def buscar_patterns_request_completo():
    """Busca patrones de requests HTTP completos con body"""
    print("\n🔍 BÚSQUEDA DE REQUESTS HTTP COMPLETOS")
    print("=" * 60)
    
    try:
        # Buscar en logs con más contexto
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend', 
            '--since', '336h'  # 14 días completos
        ], capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        
        # Buscar bloques de logs que puedan contener request completo
        request_blocks = []
        
        # Dividir por bloques basado en timestamps
        lines = logs.split('\n')
        current_block = []
        current_timestamp = None
        
        for line in lines:
            timestamp = extract_timestamp(line)
            
            if timestamp and timestamp != current_timestamp:
                # Nuevo bloque
                if current_block and any('updateInscriptionStep' in l or 'inscription' in l.lower() for l in current_block):
                    request_blocks.append({
                        'timestamp': current_timestamp,
                        'lines': current_block.copy()
                    })
                
                current_block = [line]
                current_timestamp = timestamp
            else:
                current_block.append(line)
        
        # Procesar último bloque
        if current_block and any('updateInscriptionStep' in l or 'inscription' in l.lower() for l in current_block):
            request_blocks.append({
                'timestamp': current_timestamp,
                'lines': current_block.copy()
            })
        
        print(f"📊 Bloques de requests encontrados: {len(request_blocks)}")
        
        # Analizar bloques que puedan contener datos de circunscripciones
        relevant_blocks = []
        
        for block in request_blocks:
            block_text = ' '.join(block['lines'])
            
            if any(keyword in block_text.lower() for keyword in [
                'selectedcircunscripciones', 'primera', 'segunda', 'tercera', 
                'preferences', 'updateinscriptionstep'
            ]):
                # Buscar datos específicos en el bloque
                extracted_data = extract_data_from_block(block)
                if extracted_data:
                    relevant_blocks.append({
                        'timestamp': block['timestamp'],
                        'data': extracted_data,
                        'full_block': block['lines']
                    })
        
        print(f"🎯 Bloques con datos relevantes: {len(relevant_blocks)}")
        
        for i, block in enumerate(relevant_blocks[:3]):
            print(f"\n📤 Bloque {i+1} [{block['timestamp']}]:")
            for key, value in block['data'].items():
                print(f"   {key}: {value}")
        
        return relevant_blocks
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def extract_data_from_block(block):
    """Extrae datos específicos de un bloque de logs"""
    block_text = ' '.join(block['lines'])
    extracted = {}
    
    # Buscar ID de inscripción
    id_match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', block_text)
    if id_match:
        extracted['inscription_id'] = id_match.group(1)
    
    # Buscar step
    step_match = re.search(r'step[:\s]+(COMPLETED|ACTIVE|PENDING|\w+)', block_text, re.IGNORECASE)
    if step_match:
        extracted['step'] = step_match.group(1)
    
    # Buscar circunscripciones
    circun_patterns = [
        r'PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA',
        r'selectedCircunscripciones.*\[(.*?)\]',
        r'circunscripcion.*:\s*([A-Z]+)'
    ]
    
    for pattern in circun_patterns:
        matches = re.findall(pattern, block_text, re.IGNORECASE)
        if matches:
            extracted['circunscripciones_found'] = matches
            break
    
    # Buscar email si está disponible
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', block_text)
    if email_match:
        extracted['email'] = email_match.group(1)
    
    return extracted if extracted else None

def generar_reporte_logs_aplicacion():
    """Genera reporte de análisis de logs de aplicación"""
    print("\n" + "=" * 80)
    print("📋 ANÁLISIS ESPECÍFICO DE LOGS DE APLICACIÓN")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Análisis 1: Logs locales
    analizar_logs_aplicacion_local()
    
    # Análisis 2: Logs backend exhaustivo
    backend_data = buscar_en_logs_completos_backend()
    
    # Análisis 3: Requests completos
    request_blocks = buscar_patterns_request_completo()
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE ANÁLISIS DE LOGS DE APLICACIÓN")
    print("=" * 80)
    print(f"• Datos encontrados en backend: {len(backend_data) if backend_data else 0}")
    print(f"• Bloques de requests relevantes: {len(request_blocks) if request_blocks else 0}")
    
    if request_blocks:
        print(f"\n🎯 DATOS POTENCIALES ENCONTRADOS:")
        for i, block in enumerate(request_blocks[:5]):
            if 'inscription_id' in block['data']:
                print(f"   {i+1}. ID: {block['data']['inscription_id'][:8]}... - {block['timestamp']}")
                if 'circunscripciones_found' in block['data']:
                    print(f"      Circunscripciones: {block['data']['circunscripciones_found']}")
    
    return {
        'backend_data': backend_data,
        'request_blocks': request_blocks
    }

if __name__ == "__main__":
    resultado = generar_reporte_logs_aplicacion()
    print(f"\n🎯 Análisis de logs de aplicación completado.")
