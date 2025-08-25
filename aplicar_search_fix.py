#!/usr/bin/env python3

import re

def aplicar_fix():
    file_path = '/home/semper/dashboard-monitor/src/app/api/validation/search/route.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Agregar la función mapeo después del import
    mapeo_function = '''
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
    
    # Agregar después del import
    content = content.replace(
        "import { NextRequest, NextResponse } from 'next/server';",
        "import { NextRequest, NextResponse } from 'next/server';\n" + mapeo_function
    )
    
    # 2. Reemplazar toda la lógica de circunscripción existente
    old_logic = '''      // Determine circunscripcion from centroDeVida
      let circunscripcion = 'PRIMERA_CIRCUNSCRIPCION';
      if (inscription?.centroDeVida) {
        const centro = inscription.centroDeVida.toLowerCase();
        if (centro.includes('primera') || centro.includes('1°') || centro.includes('1') || 
            centro.includes('capital') || centro.includes('mendoza')) {
          circunscripcion = 'PRIMERA_CIRCUNSCRIPCION';
        } else if (centro.includes('segunda') || centro.includes('2°') || centro.includes('2') || 
                   centro.includes('san rafael')) {
          circunscripcion = 'SEGUNDA_CIRCUNSCRIPCION';
        } else if (centro.includes('tercera') || centro.includes('3°') || centro.includes('3') || 
                   centro.includes('san martin') || centro.includes('san martín')) {
          circunscripcion = 'TERCERA_CIRCUNSCRIPCION';
        } else if (centro.includes('cuarta') || centro.includes('4°') || centro.includes('4') || 
                   centro.includes('tunuyan') || centro.includes('tunuyán')) {
          circunscripcion = 'CUARTA_CIRCUNSCRIPCION';
        }
      }'''
    
    new_logic = '''      // Determine circunscripcion usando datos reales del backend
      const circunscripcion = mapearCircunscripcionReal(inscription);'''
    
    content = content.replace(old_logic, new_logic)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Search endpoint actualizado con mapeo de circunscripciones reales")

if __name__ == "__main__":
    aplicar_fix()
