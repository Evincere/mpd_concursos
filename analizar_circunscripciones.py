#!/usr/bin/env python3
"""
Script de Análisis de Circunscripciones - MPD Concursos
========================================================

PROPÓSITO: Analizar datos geográficos de inscripciones y usuarios para mapear 
circunscripciones de manera segura y precisa.

SEGURIDAD: Este script es READ-ONLY. NO modifica datos en la base.
"""

import mysql.connector
import re
import json
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Optional

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos',
    'charset': 'utf8mb4'
}

# Mapeo de departamentos a circunscripciones
DEPARTAMENTOS_CIRCUNSCRIPCIONES = {
    # PRIMERA CIRCUNSCRIPCIÓN
    'PRIMERA_CIRCUNSCRIPCION': [
        'ciudad', 'mendoza', 'capital', 'guaymallén', 'guaymallen', 'maipú', 'maipu',
        'las heras', 'godoy cruz', 'luján', 'lujan', 'lujan de cuyo'
    ],
    
    # SEGUNDA CIRCUNSCRIPCIÓN  
    'SEGUNDA_CIRCUNSCRIPCION': [
        'san rafael', 'alvear', 'malargüe', 'malargue'
    ],
    
    # TERCERA CIRCUNSCRIPCIÓN
    'TERCERA_CIRCUNSCRIPCION': [
        'san martín', 'san martin', 'rivadavia', 'junín', 'junin', 'santa rosa'
    ],
    
    # CUARTA CIRCUNSCRIPCIÓN
    'CUARTA_CIRCUNSCRIPCION': [
        'tunuyán', 'tunuyan', 'tupungato', 'san carlos'
    ]
}

def conectar_bd():
    """Conecta a la base de datos de manera segura."""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

def obtener_inscripciones_completas():
    """Obtiene todas las inscripciones COMPLETED_WITH_DOCS con datos geográficos."""
    conn = conectar_bd()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            HEX(i.id) as inscription_id,
            HEX(i.user_id) as user_id,
            i.centro_de_vida,
            i.status,
            u.direccion as user_direccion,
            u.municipality,
            u.province,
            u.legal_address,
            u.residential_address,
            u.first_name,
            u.last_name,
            u.dni
        FROM inscriptions i
        JOIN user_entity u ON i.user_id = u.id
        WHERE i.status = 'COMPLETED_WITH_DOCS'
        ORDER BY i.inscription_date
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        print(f"✅ Obtenidas {len(results)} inscripciones COMPLETED_WITH_DOCS")
        return results
        
    except mysql.connector.Error as e:
        print(f"❌ Error ejecutando consulta: {e}")
        return []
    finally:
        if conn:
            conn.close()

def obtener_circunscripciones_existentes():
    """Obtiene mappings existentes de la tabla inscription_circunscripciones."""
    conn = conectar_bd()
    if not conn:
        return {}
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            HEX(inscriptionId) as inscription_id,
            circunscripcion
        FROM inscription_circunscripciones
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Agrupar por inscription_id
        mappings = defaultdict(list)
        for row in results:
            mappings[row['inscription_id']].append(row['circunscripcion'])
        
        print(f"✅ Obtenidos mappings existentes para {len(mappings)} inscripciones")
        return dict(mappings)
        
    except mysql.connector.Error as e:
        print(f"❌ Error obteniendo circunscripciones existentes: {e}")
        return {}
    finally:
        if conn:
            conn.close()

def limpiar_texto_ubicacion(texto: str) -> str:
    """Limpia y normaliza texto de ubicación para análisis."""
    if not texto:
        return ""
    
    # Convertir a minúsculas y limpiar
    texto_limpio = texto.lower().strip()
    
    # Remover caracteres especiales y normalizar
    texto_limpio = re.sub(r'[^\w\s]', ' ', texto_limpio)
    texto_limpio = re.sub(r'\s+', ' ', texto_limpio)
    
    return texto_limpio

def mapear_circunscripcion(centro_vida: str, direccion: str, municipality: str) -> Tuple[str, str, float]:
    """
    Mapea ubicación a circunscripción basado en múltiples fuentes.
    
    Returns:
        Tuple[circunscripcion, fuente_datos, confianza]
    """
    # Preparar textos para análisis
    textos = []
    if centro_vida:
        textos.append(('centro_vida', limpiar_texto_ubicacion(centro_vida)))
    if direccion:
        textos.append(('direccion', limpiar_texto_ubicacion(direccion)))
    if municipality:
        textos.append(('municipality', limpiar_texto_ubicacion(municipality)))
    
    # Buscar coincidencias
    coincidencias = Counter()
    fuentes = {}
    
    for fuente, texto in textos:
        for circunscripcion, departamentos in DEPARTAMENTOS_CIRCUNSCRIPCIONES.items():
            for departamento in departamentos:
                if departamento in texto:
                    peso = 1.0
                    if fuente == 'centro_vida':
                        peso = 1.5  # Centro de vida tiene más peso
                    elif fuente == 'municipality':
                        peso = 1.3  # Municipality es muy confiable
                    
                    coincidencias[circunscripcion] += peso
                    fuentes[circunscripcion] = fuente
    
    if not coincidencias:
        return 'PRIMERA_CIRCUNSCRIPCION', 'default', 0.0
    
    # Obtener la circunscripción con mayor peso
    circunscripcion_elegida = coincidencias.most_common(1)[0][0]
    confianza = coincidencias[circunscripcion_elegida]
    fuente = fuentes.get(circunscripcion_elegida, 'unknown')
    
    return circunscripcion_elegida, fuente, confianza

def analizar_todas_las_inscripciones():
    """Análisis completo de todas las inscripciones."""
    print("🔍 INICIANDO ANÁLISIS DE CIRCUNSCRIPCIONES")
    print("=" * 60)
    
    # Obtener datos
    inscripciones = obtener_inscripciones_completas()
    circunscripciones_existentes = obtener_circunscripciones_existentes()
    
    if not inscripciones:
        print("❌ No se pudieron obtener inscripciones")
        return
    
    # Estadísticas
    estadisticas = {
        'total_analizado': 0,
        'con_centro_vida': 0,
        'con_direccion': 0,
        'con_municipality': 0,
        'con_mapping_existente': 0,
        'mapeo_automatico': Counter(),
        'confianza_alta': 0,
        'confianza_media': 0,
        'confianza_baja': 0,
        'sin_datos': 0
    }
    
    resultados = []
    
    for inscripcion in inscripciones:
        estadisticas['total_analizado'] += 1
        inscription_id = inscripcion['inscription_id']
        
        # Verificar si ya tiene mapping
        if inscription_id in circunscripciones_existentes:
            estadisticas['con_mapping_existente'] += 1
            resultado = {
                'inscription_id': inscription_id,
                'dni': inscripcion['dni'],
                'nombre': f"{inscripcion['first_name']} {inscripcion['last_name']}",
                'circunscripcion_actual': circunscripciones_existentes[inscription_id],
                'metodo': 'mapping_existente',
                'confianza': 1.0,
                'centro_vida': inscripcion['centro_de_vida'],
                'direccion': inscripcion['user_direccion']
            }
        else:
            # Análisis automático
            centro_vida = inscripcion['centro_de_vida']
            direccion = inscripcion['user_direccion'] 
            municipality = inscripcion['municipality']
            
            if centro_vida:
                estadisticas['con_centro_vida'] += 1
            if direccion:
                estadisticas['con_direccion'] += 1  
            if municipality:
                estadisticas['con_municipality'] += 1
            
            circunscripcion, fuente, confianza = mapear_circunscripcion(
                centro_vida, direccion, municipality
            )
            
            estadisticas['mapeo_automatico'][circunscripcion] += 1
            
            if confianza >= 1.5:
                estadisticas['confianza_alta'] += 1
            elif confianza >= 1.0:
                estadisticas['confianza_media'] += 1
            elif confianza > 0:
                estadisticas['confianza_baja'] += 1
            else:
                estadisticas['sin_datos'] += 1
            
            resultado = {
                'inscription_id': inscription_id,
                'dni': inscripcion['dni'],
                'nombre': f"{inscripcion['first_name']} {inscripcion['last_name']}",
                'circunscripcion_propuesta': circunscripcion,
                'metodo': fuente,
                'confianza': confianza,
                'centro_vida': centro_vida,
                'direccion': direccion,
                'municipality': municipality
            }
        
        resultados.append(resultado)
    
    # Mostrar estadísticas
    print("📊 ESTADÍSTICAS DEL ANÁLISIS")
    print("-" * 40)
    print(f"Total inscripciones analizadas: {estadisticas['total_analizado']}")
    print(f"Con mapping existente: {estadisticas['con_mapping_existente']}")
    print(f"Con centro de vida: {estadisticas['con_centro_vida']}")
    print(f"Con dirección usuario: {estadisticas['con_direccion']}")
    print(f"Con municipality: {estadisticas['con_municipality']}")
    print()
    
    print("🎯 MAPEO AUTOMÁTICO POR CIRCUNSCRIPCIÓN")
    for circ, count in estadisticas['mapeo_automatico'].most_common():
        print(f"  {circ}: {count}")
    print()
    
    print("📈 CONFIANZA DEL MAPEO")
    print(f"  Alta (≥1.5): {estadisticas['confianza_alta']}")
    print(f"  Media (≥1.0): {estadisticas['confianza_media']}")
    print(f"  Baja (<1.0): {estadisticas['confianza_baja']}")
    print(f"  Sin datos: {estadisticas['sin_datos']}")
    
    # Guardar resultados detallados
    with open('analisis_circunscripciones_detallado.json', 'w', encoding='utf-8') as f:
        json.dump({
            'estadisticas': dict(estadisticas),
            'resultados': resultados
        }, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n💾 Resultados guardados en: analisis_circunscripciones_detallado.json")
    
    # Mostrar casos problemáticos
    print("\n⚠️ CASOS QUE REQUIEREN ATENCIÓN")
    print("-" * 40)
    for resultado in resultados:
        if resultado.get('confianza', 0) < 1.0 and resultado.get('metodo') != 'mapping_existente':
            print(f"DNI {resultado['dni']}: {resultado['nombre']}")
            print(f"  Centro vida: {resultado.get('centro_vida', 'N/A')}")
            print(f"  Dirección: {resultado.get('direccion', 'N/A')}")
            print(f"  Municipality: {resultado.get('municipality', 'N/A')}")
            print(f"  Propuesta: {resultado.get('circunscripcion_propuesta', 'N/A')} (confianza: {resultado.get('confianza', 0):.2f})")
            print()

if __name__ == "__main__":
    print("🚀 ANÁLISIS DE CIRCUNSCRIPCIONES MPD - MODO SEGURO")
    print("=" * 60)
    print("⚠️  ESTE SCRIPT ES READ-ONLY - NO MODIFICA DATOS")
    print("=" * 60)
    
    analizar_todas_las_inscripciones()
    
    print("\n✅ ANÁLISIS COMPLETADO")
    print("📋 Revisa el archivo 'analisis_circunscripciones_detallado.json' para más detalles")
