#!/usr/bin/env python3
import os
import re

print("🔍 VERIFICACIÓN DE INTEGRIDAD REAL DE ARCHIVOS")
print("=" * 50)

archivos_encontrados = 0
archivos_faltantes_reales = 0
usuarios_afectados = set()

with open('DOCUMENTOS_FALTANTES.txt', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    
    # Buscar todas las entradas de archivos faltantes
    faltas = re.findall(r'❌ FALTANTE: (\d+) - (.*?) - (.*?)\n.*?Archivo: (.*?)\n.*?Ruta esperada: (.*?)\n', content, re.DOTALL)
    
    print(f"📊 Procesando {len(faltas)} archivos reportados como faltantes...")
    
    for dni, nombre, tipo_doc, archivo_relativo, ruta_esperada in faltas:
        # Construir ruta corregida (sin doble directorio)
        base_path = "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
        
        # Extraer nombre del archivo de la ruta esperada
        archivo_nombre = os.path.basename(ruta_esperada)
        
        # Construir rutas posibles
        ruta_simple = f"{base_path}/{dni}/{archivo_nombre}"
        ruta_doble = ruta_esperada  # La ruta original de BD (con doble directorio)
        
        archivo_existe = False
        
        # Verificar si existe en ruta simple
        if os.path.exists(ruta_simple):
            archivo_existe = True
            archivos_encontrados += 1
        # Verificar si existe en ruta doble (por si acaso)
        elif os.path.exists(ruta_doble):
            archivo_existe = True
            archivos_encontrados += 1
        
        if not archivo_existe:
            archivos_faltantes_reales += 1
            usuarios_afectados.add(dni)
            if archivos_faltantes_reales <= 5:  # Mostrar solo primeros 5
                print(f"❌ REALMENTE FALTANTE: {dni} - {nombre} - {tipo_doc}")
                print(f"   Archivo: {archivo_nombre}")
                print(f"   Ruta simple: {ruta_simple}")
        elif archivos_faltantes_reales <= 3 and archivos_encontrados <= 10:
            print(f"✅ ENCONTRADO: {dni} - {tipo_doc}")

print("\n📊 RESUMEN FINAL:")
print(f"✅ Archivos reportados como faltantes pero que SÍ EXISTEN: {archivos_encontrados}")
print(f"❌ Archivos REALMENTE faltantes: {archivos_faltantes_reales}")
print(f"👥 Usuarios con archivos realmente faltantes: {len(usuarios_afectados)}")
print(f"📈 Porcentaje de archivos recuperables: {archivos_encontrados/(archivos_encontrados+archivos_faltantes_reales)*100:.1f}%")

if len(usuarios_afectados) > 0:
    print(f"\n👥 Usuarios con archivos realmente faltantes:")
    for i, usuario in enumerate(sorted(usuarios_afectados)[:10]):
        print(f"   - {usuario}")
        if i >= 9 and len(usuarios_afectados) > 10:
            print(f"   ... y {len(usuarios_afectados) - 10} más")
            break
