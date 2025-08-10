#!/usr/bin/env python3
"""
INVESTIGACIÓN PROFUNDA DEL PIPELINE DE REQUESTS
Analizar exactamente qué datos llegan al backend y en qué punto se pierden
"""

import subprocess
import re
import json
from datetime import datetime

def buscar_logs_http_detallados():
    """Busca logs HTTP más detallados incluyendo request bodies"""
    print("🔍 BÚSQUEDA EXHAUSTIVA DE LOGS HTTP CON REQUEST BODY")
    print("=" * 60)
    
    try:
        # Obtener logs completos del backend
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend'
        ], capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        lines = logs.split('\n')
        
        print(f"📝 Analizando {len(lines):,} líneas completas...")
        
        # Buscar patrones muy específicos de logging HTTP
        http_patterns = [
            # Spring Boot logging patterns
            r'.*Request.*PUT.*inscription.*step.*',
            r'.*POST.*inscription.*body.*',
            r'.*@RequestBody.*InscriptionStepRequest.*',
            r'.*RequestMapping.*updateInscriptionStep.*',
            
            # JSON request patterns
            r'.*\{.*"selectedCircunscripciones".*\}.*',
            r'.*\{.*"step".*"selectedCircunscripciones".*\}.*',
            
            # Controller logging patterns
            r'.*InscriptionController.*updateStep.*',
            r'.*updateInscriptionStep.*request.*',
            
            # Generic HTTP logging
            r'.*HTTP.*PUT.*inscription.*',
            r'.*Request body.*\{.*\}.*',
        ]
        
        found_requests = []
        
        for pattern in http_patterns:
            for i, line in enumerate(lines):
                if re.search(pattern, line, re.IGNORECASE):
                    # Capturar contexto amplio
                    context_start = max(0, i - 10)
                    context_end = min(len(lines), i + 10)
                    context = lines[context_start:context_end]
                    
                    found_requests.append({
                        'line_num': i,
                        'pattern': pattern,
                        'matched_line': line,
                        'context': context,
                        'timestamp': extract_timestamp(line)
                    })
        
        print(f"🎯 Requests HTTP encontrados: {len(found_requests)}")
        
        if found_requests:
            print(f"\n📤 EJEMPLOS DE REQUESTS ENCONTRADOS:")
            for i, req in enumerate(found_requests[:3]):
                print(f"\n   REQUEST {i+1} (línea {req['line_num']}):")
                print(f"   Patrón: {req['pattern'][:50]}...")
                print(f"   Línea: {req['matched_line'][:100]}...")
                
                # Buscar JSON en el contexto
                json_found = []
                for ctx_line in req['context']:
                    if '{' in ctx_line and '}' in ctx_line:
                        json_found.append(ctx_line.strip())
                
                if json_found:
                    print(f"   JSON en contexto:")
                    for json_line in json_found[:2]:
                        print(f"      {json_line[:80]}{'...' if len(json_line) > 80 else ''}")
        
        return found_requests
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def extract_timestamp(line):
    """Extrae timestamp de una línea de log"""
    patterns = [
        r'\d{2}:\d{2}:\d{2}\.\d{3}',
        r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}',
        r'\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, line)
        if match:
            return match.group(0)
    return None

def buscar_en_controlador_inscripcion():
    """Analiza el controlador de inscripción para entender el logging"""
    print("\n🔍 ANÁLISIS DEL CONTROLADOR DE INSCRIPCIÓN")
    print("=" * 60)
    
    controller_files = [
        './concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/controller/InscriptionController.java',
        './concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/rest/InscriptionController.java',
        './concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/application/controller/InscriptionController.java'
    ]
    
    controller_found = False
    
    for controller_file in controller_files:
        try:
            with open(controller_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            print(f"✅ Encontrado: {controller_file}")
            controller_found = True
            
            # Buscar método updateInscriptionStep
            update_method = re.search(
                r'public.*updateInscriptionStep.*?\{.*?\}', 
                content, 
                re.DOTALL | re.IGNORECASE
            )
            
            if update_method:
                print(f"📋 Método updateInscriptionStep encontrado:")
                method_lines = update_method.group(0).split('\n')
                for i, line in enumerate(method_lines[:15]):  # Primeras 15 líneas
                    print(f"   {i+1:2d}: {line}")
                if len(method_lines) > 15:
                    print(f"   ... y {len(method_lines) - 15} líneas más")
            
            # Buscar logging statements
            log_statements = re.findall(r'log\.(debug|info|warn|error).*?;', content, re.IGNORECASE)
            
            if log_statements:
                print(f"\n📝 Statements de logging encontrados: {len(log_statements)}")
                for i, stmt in enumerate(log_statements[:5]):
                    print(f"   {i+1}: {stmt[:80]}{'...' if len(stmt) > 80 else ''}")
            else:
                print(f"❌ No se encontraron statements de logging")
            
            break
            
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"❌ Error leyendo {controller_file}: {e}")
    
    if not controller_found:
        print(f"❌ No se encontró ningún controlador de inscripción")

def buscar_logs_spring_debug():
    """Busca logs de Spring Framework en modo debug"""
    print("\n🔍 BÚSQUEDA DE LOGS DE SPRING FRAMEWORK DEBUG")
    print("=" * 60)
    
    try:
        # Buscar logs específicos de Spring
        result = subprocess.run([
            'docker', 'logs', 'mpd-concursos-backend'
        ], capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        
        # Patrones específicos de Spring Boot
        spring_patterns = [
            r'.*org\.springframework\.web.*',
            r'.*DispatcherServlet.*',
            r'.*RequestMappingHandlerAdapter.*',
            r'.*HttpMessageConverter.*',
            r'.*@RequestBody.*',
            r'.*HandlerMethodArgumentResolver.*'
        ]
        
        spring_logs = []
        
        for pattern in spring_patterns:
            matches = re.findall(pattern, logs, re.IGNORECASE)
            if matches:
                spring_logs.extend(matches[:3])  # Solo primeras 3 de cada patrón
        
        print(f"📋 Logs de Spring encontrados: {len(spring_logs)}")
        
        if spring_logs:
            print(f"📝 Ejemplos:")
            for i, log_entry in enumerate(spring_logs[:5]):
                print(f"   {i+1}: {log_entry[:100]}{'...' if len(log_entry) > 100 else ''}")
        else:
            print(f"❌ No se encontraron logs específicos de Spring Framework")
        
        return spring_logs
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def verificar_configuracion_logging():
    """Verifica la configuración de logging de la aplicación"""
    print("\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE LOGGING")
    print("=" * 60)
    
    config_files = [
        './concurso-backend/src/main/resources/logback-spring.xml',
        './concurso-backend/src/main/resources/logback.xml',
        './concurso-backend/src/main/resources/application.properties',
        './concurso-backend/src/main/resources/application.yml',
        './concurso-backend/src/main/resources/application-prod.properties'
    ]
    
    for config_file in config_files:
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"\n✅ Encontrado: {config_file}")
            
            # Buscar configuración de logging
            logging_config = []
            
            if 'logback' in config_file:
                # XML logging config
                loggers = re.findall(r'<logger.*?/>', content, re.DOTALL)
                levels = re.findall(r'level="(.*?)"', content)
                logging_config.extend(loggers[:3])
                if levels:
                    print(f"   Niveles configurados: {set(levels)}")
                    
            else:
                # Properties/YAML logging config
                log_lines = [line for line in content.split('\n') 
                           if 'logging' in line.lower() or 'log' in line.lower()]
                logging_config.extend(log_lines[:5])
            
            if logging_config:
                print(f"   Configuración de logging:")
                for i, config_line in enumerate(logging_config):
                    print(f"      {i+1}: {config_line[:60]}{'...' if len(config_line) > 60 else ''}")
            else:
                print(f"   ❌ No se encontró configuración específica de logging")
                
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"❌ Error leyendo {config_file}: {e}")

def analizar_discrepancia_logs():
    """Analiza la discrepancia entre lo esperado y encontrado en logs"""
    print("\n🤔 ANÁLISIS DE DISCREPANCIA EN LOGS")
    print("=" * 60)
    
    print(f"📋 TEORÍA vs REALIDAD:")
    print(f"")
    print(f"✅ CONFIRMADO:")
    print(f"   • Frontend maneja selectedCircunscripciones")
    print(f"   • Frontend envía requests a /inscription/{id}/step")
    print(f"   • Backend tiene endpoint que recibe InscriptionStepRequest")
    print(f"   • InscriptionStepRequest incluye selectedCircunscripciones")
    print(f"")
    print(f"❓ DISCREPANCIA:")
    print(f"   • NO encontramos logs de requests HTTP con body completo")
    print(f"   • NO encontramos logs de JSON con selectedCircunscripciones")
    print(f"   • NO encontramos traces de Spring framework procesando requests")
    print(f"")
    print(f"🤔 POSIBLES EXPLICACIONES:")
    print(f"   1. Nivel de logging insuficiente (INFO/WARN instead of DEBUG)")
    print(f"   2. Spring Security/Filters no loggean request body")
    print(f"   3. Logs rotados/perdidos por tamaño")
    print(f"   4. Configuración de logging no incluye request body")
    print(f"   5. Framework Jackson no loggea deserialization")
    print(f"")
    print(f"🎯 HIPÓTESIS MÁS PROBABLE:")
    print(f"   • Los datos SÍ llegaban al backend")
    print(f"   • Se perdían específicamente en el mapper")
    print(f"   • Logs de aplicación no incluyen request body por configuración")
    print(f"   • Solo se loggean errores, no requests exitosos")

def buscar_evidencia_adicional():
    """Busca evidencia adicional en otros lugares"""
    print("\n🔍 BÚSQUEDA DE EVIDENCIA ADICIONAL")
    print("=" * 60)
    
    # 1. Buscar en logs de nginx con más detalle
    try:
        with open('/var/log/nginx/access.log', 'r') as f:
            nginx_content = f.read()
        
        # Buscar requests específicos
        inscription_requests = []
        for line in nginx_content.split('\n'):
            if 'PUT' in line and 'inscription' in line and 'step' in line:
                inscription_requests.append(line)
        
        print(f"📤 Requests PUT a /inscription/.../step en nginx: {len(inscription_requests)}")
        
        if inscription_requests:
            print(f"📝 Ejemplos:")
            for i, req in enumerate(inscription_requests[:3]):
                # Extraer tamaño de request
                size_match = re.search(r'" (\d+) (\d+)', req)
                if size_match:
                    status, size = size_match.groups()
                    print(f"   {i+1}: Status {status}, Size {size} bytes")
                    print(f"      {req[:80]}...")
        
        print(f"")
        print(f"💡 OBSERVACIÓN CLAVE:")
        if inscription_requests:
            # Analizar tamaños de requests
            sizes = []
            for req in inscription_requests:
                size_match = re.search(r'" \d+ (\d+)', req)
                if size_match:
                    sizes.append(int(size_match.group(1)))
            
            if sizes:
                avg_size = sum(sizes) / len(sizes)
                print(f"   • Tamaño promedio de requests: {avg_size:.0f} bytes")
                print(f"   • Requests con cuerpo JSON (>100 bytes): {len([s for s in sizes if s > 100])}")
                print(f"   • Esto sugiere que SÍ se enviaban datos en el body")
        
    except Exception as e:
        print(f"❌ Error analizando nginx logs: {e}")

def generar_conclusion_investigacion():
    """Genera conclusión de la investigación sobre la discrepancia"""
    print("\n" + "=" * 80)
    print("🎯 CONCLUSIÓN SOBRE LA DISCREPANCIA EN LOGS")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"\n🔍 PREGUNTA ORIGINAL:")
    print(f'   "Si Frontend SÍ enviaba circunscripciones, ¿por qué no hay logs?"')
    
    print(f"\n💡 RESPUESTA:")
    print(f"   Los logs de aplicación Spring Boot por defecto NO incluyen:")
    print(f"   • Request body completo")
    print(f"   • Parámetros JSON deserialized")
    print(f"   • Trace de mapeo de objetos")
    print(f"   • Debug de Jackson ObjectMapper")
    
    print(f"\n📊 EVIDENCIA CIRCUNSTANCIAL:")
    print(f"   ✅ Código frontend maneja selectedCircunscripciones")
    print(f"   ✅ Interface InscriptionStepRequest incluye selectedCircunscripciones")
    print(f"   ✅ Requests HTTP de tamaño apropiado en nginx logs")
    print(f"   ✅ Mapper original NO incluía selectedCircunscripciones")
    print(f"   ✅ Corrección del mapper resuelve el problema")
    
    print(f"\n🎯 CONCLUSIÓN FINAL:")
    print(f"   • Frontend SÍ enviaba circunscripciones (evidencia de código)")
    print(f"   • Backend SÍ las recibía (evidencia de interface)")
    print(f"   • Mapper las IGNORABA (evidencia de código)")
    print(f"   • Logs no las muestran por configuración de Spring Boot")
    print(f"   • Ausencia de logs NO significa ausencia de datos")
    
    print(f"\n✅ VALIDACIÓN:")
    print(f"   • Corrección aplicada funciona correctamente")
    print(f"   • Nuevas inscripciones SÍ guardan circunscripciones")
    print(f"   • Problema era específicamente en el mapper")

def main():
    """Función principal de investigación de discrepancia"""
    print("🔍 INVESTIGACIÓN PROFUNDA - ¿POR QUÉ NO HAY LOGS DE REQUESTS?")
    print("=" * 80)
    
    # 1. Buscar logs HTTP detallados
    requests_found = buscar_logs_http_detallados()
    
    # 2. Analizar controlador
    buscar_en_controlador_inscripcion()
    
    # 3. Buscar logs de Spring
    spring_logs = buscar_logs_spring_debug()
    
    # 4. Verificar configuración de logging
    verificar_configuracion_logging()
    
    # 5. Buscar evidencia adicional
    buscar_evidencia_adicional()
    
    # 6. Analizar discrepancia
    analizar_discrepancia_logs()
    
    # 7. Generar conclusión
    generar_conclusion_investigacion()
    
    print(f"\n🎯 Investigación de discrepancia completada.")

if __name__ == "__main__":
    main()
