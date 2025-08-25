#!/usr/bin/env python3
"""
Script para actualizar el endpoint validation/postulants para usar datos reales de circunscripciones
"""

import re

def actualizar_endpoint():
    file_path = '/home/semper/dashboard-monitor/src/app/api/validation/postulants/route.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Función para mapear circunscripciones reales
    mapeo_circunscripciones = '''
    // ====================================================================
    // MAPEO MEJORADO DE CIRCUNSCRIPCIONES - 2025-08-19
    // ====================================================================
    
    const mapearCircunscripcionReal = (inscription: any): string => {
      // 1. Usar selectedCircunscripciones si existe y tiene datos
      if (inscription.selectedCircunscripciones && inscription.selectedCircunscripciones.length > 0) {
        const primera = inscription.selectedCircunscripciones.find((c: string) => c.toLowerCase().includes('primera'));
        if (primera) return 'PRIMERA_CIRCUNSCRIPCION';
        
        const segunda = inscription.selectedCircunscripciones.find((c: string) => c.toLowerCase().includes('segunda'));
        if (segunda) return 'SEGUNDA_CIRCUNSCRIPCION';
        
        const tercera = inscription.selectedCircunscripciones.find((c: string) => c.toLowerCase().includes('tercera'));
        if (tercera) return 'TERCERA_CIRCUNSCRIPCION';
        
        const cuarta = inscription.selectedCircunscripciones.find((c: string) => c.toLowerCase().includes('cuarta'));
        if (cuarta) return 'CUARTA_CIRCUNSCRIPCION';
      }
      
      // 2. Fallback: analizar centroDeVida
      if (inscription.centroDeVida) {
        const centro = inscription.centroDeVida.toLowerCase();
        
        // Segunda circunscripción (San Rafael, Alvear, Malargüe)
        if (centro.includes('san rafael') || centro.includes('alvear') || centro.includes('malargüe') || centro.includes('malargue')) {
          return 'SEGUNDA_CIRCUNSCRIPCION';
        }
        
        // Tercera circunscripción (San Martín, Rivadavia, Junín, Santa Rosa)
        if (centro.includes('san martín') || centro.includes('san martin') || centro.includes('rivadavia') || 
            centro.includes('junín') || centro.includes('junin') || centro.includes('santa rosa')) {
          return 'TERCERA_CIRCUNSCRIPCION';
        }
        
        // Cuarta circunscripción (Tunuyán, Tupungato, San Carlos)
        if (centro.includes('tunuyán') || centro.includes('tunuyan') || centro.includes('tupungato') || centro.includes('san carlos')) {
          return 'CUARTA_CIRCUNSCRIPCION';
        }
        
        // Primera circunscripción (Capital, Guaymallén, Maipú, Las Heras, Godoy Cruz, Luján)
        if (centro.includes('ciudad') || centro.includes('mendoza') || centro.includes('capital') || 
            centro.includes('guaymallén') || centro.includes('guaymallen') || centro.includes('maipú') || centro.includes('maipu') ||
            centro.includes('las heras') || centro.includes('godoy cruz') || centro.includes('luján') || centro.includes('lujan')) {
          return 'PRIMERA_CIRCUNSCRIPCION';
        }
      }
      
      // 3. Default fallback
      return 'PRIMERA_CIRCUNSCRIPCION';
    };
'''
    
    # Insertar la función después de los imports
    content = content.replace(
        "import { NextRequest, NextResponse } from 'next/server';",
        "import { NextRequest, NextResponse } from 'next/server';\n\n" + mapeo_circunscripciones
    )
    
    # Reemplazar la lógica de determinación de circunscripción
    old_logic = r'''      // Determine circunscripcion
      let circunscripcion = 'PRIMERA_CIRCUNSCRIPCION';
      if \(inscription\?\.centroDeVida\) \{
        const centro = inscription\.centroDeVida\.toLowerCase\(\);
        if \(centro\.includes\('primera'\) \|\| centro\.includes\('1°'\) \|\| centro\.includes\('1'\) \|\| 
            centro\.includes\('capital'\) \|\| centro\.includes\('mendoza'\)\) \{
          circunscripcion = 'PRIMERA_CIRCUNSCRIPCION';
        \} else if \(centro\.includes\('segunda'\) \|\| centro\.includes\('2°'\) \|\| centro\.includes\('2'\) \|\| 
                   centro\.includes\('san rafael'\)\) \{
          circunscripcion = 'SEGUNDA_CIRCUNSCRIPCION';
        \} else if \(centro\.includes\('tercera'\) \|\| centro\.includes\('3°'\) \|\| centro\.includes\('3'\) \|\| 
                   centro\.includes\('san martin'\) \|\| centro\.includes\('san martín'\)\) \{
          circunscripcion = 'TERCERA_CIRCUNSCRIPCION';
        \} else if \(centro\.includes\('cuarta'\) \|\| centro\.includes\('4°'\) \|\| centro\.includes\('4'\) \|\| 
                   centro\.includes\('tunuyan'\) \|\| centro\.includes\('tunuyán'\)\) \{
          circunscripcion = 'CUARTA_CIRCUNSCRIPCION';
        \}
      \}'''
    
    new_logic = '''      // Determine circunscripcion usando datos reales del backend
      const circunscripcion = mapearCircunscripcionReal(inscription);'''
    
    content = re.sub(old_logic, new_logic, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Endpoint actualizado para usar datos reales de circunscripciones")

if __name__ == "__main__":
    print("🔧 ACTUALIZANDO ENDPOINT VALIDATION/POSTULANTS")
    print("=" * 60)
    actualizar_endpoint()
    print("✅ Endpoint actualizado correctamente")
