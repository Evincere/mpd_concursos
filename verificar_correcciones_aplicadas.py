#!/usr/bin/env python3
import os
import re

print("🔍 VERIFICACIÓN POST-CORRECCIÓN DE RUTAS")
print("=" * 50)

archivos_encontrados_ahora = 0
archivos_faltantes_reales = 0

# Leer el archivo original de faltantes para comparar
with open('DOCUMENTOS_FALTANTES.txt', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    
    faltas = re.findall(r'❌ FALTANTE: (\d+) - (.*?) - (.*?)\n.*?Archivo: (.*?)\n.*?Ruta esperada: (.*?)\n', content, re.DOTALL)
    
    print(f"📊 Re-verificando {len(faltas)} archivos que se reportaron como faltantes...")
    
    for dni, nombre, tipo_doc, archivo_relativo, ruta_esperada_original in faltas:
        # Construir nueva ruta con estructura corregida
        base_path = "/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
        archivo_nombre = os.path.basename(ruta_esperada_original)
        
        # Ahora la ruta debería ser simple: base_path/user_id/filename
        ruta_corregida = f"{base_path}/{dni}/{archivo_nombre}"
        
        if os.path.exists(ruta_corregida):
            archivos_encontrados_ahora += 1
            if archivos_encontrados_ahora <= 5:  # Mostrar algunos ejemplos
                print(f"✅ RECUPERADO: {dni} - {tipo_doc}")
        else:
            archivos_faltantes_reales += 1
            if archivos_faltantes_reales <= 5:  # Mostrar algunos que siguen faltando
                print(f"❌ AÚN FALTA: {dni} - {nombre} - {tipo_doc}")

print(f"\n📊 RESULTADOS POST-CORRECCIÓN:")
print(f"✅ Archivos RECUPERADOS después de corrección: {archivos_encontrados_ahora}")
print(f"❌ Archivos que AÚN faltan realmente: {archivos_faltantes_reales}")
print(f"📈 Tasa de recuperación: {archivos_encontrados_ahora/(archivos_encontrados_ahora+archivos_faltantes_reales)*100:.1f}%")

# Comparar con resultado anterior
print(f"\n📈 COMPARACIÓN CON ESTADO PREVIO:")
print(f"   Antes de corrección: 192 archivos recuperables (58.4%)")
print(f"   Después de corrección: {archivos_encontrados_ahora} archivos recuperables")
print(f"   Mejora: +{archivos_encontrados_ahora - 192} archivos adicionales")

if archivos_encontrados_ahora > 250:
    print(f"\n🎉 ¡EXCELENTE! La corrección fue muy efectiva")
elif archivos_encontrados_ahora > 200:
    print(f"\n✅ La corrección fue exitosa")
else:
    print(f"\n⚠️ La corrección tuvo efecto limitado")
