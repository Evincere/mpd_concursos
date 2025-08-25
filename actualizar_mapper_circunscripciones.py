#!/usr/bin/env python3
"""
Script para actualizar AdminInscriptionMapper para incluir centroDeVida y selectedCircunscripciones
"""

import re

def actualizar_mapper():
    archivo_mapper = 'concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/controller/mapper/AdminInscriptionMapper.java'
    
    with open(archivo_mapper, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Buscar el método toAdminDTO y agregar el mapeo de los nuevos campos
    # Buscar justo antes del return dto;
    patron_return = r'(\s+)(return dto;)'
    
    # Código a insertar antes del return
    codigo_nuevo = '''
        // ====================================================================
        // MAPEO DE CIRCUNSCRIPCIONES AGREGADO - 2025-08-19
        // ====================================================================
        
        // Mapear centro de vida si está disponible en las preferencias
        if (inscription.getPreferences() != null) {
            dto.setCentroDeVida(inscription.getPreferences().getCentroDeVida());
            dto.setSelectedCircunscripciones(inscription.getPreferences().getSelectedCircunscripciones());
        }
'''
    
    # Realizar el reemplazo
    contenido_actualizado = re.sub(
        patron_return,
        f'{codigo_nuevo}\\1\\2',
        contenido
    )
    
    # Verificar que se hizo el cambio
    if contenido_actualizado != contenido:
        with open(archivo_mapper, 'w', encoding='utf-8') as f:
            f.write(contenido_actualizado)
        print("✅ AdminInscriptionMapper actualizado correctamente")
        return True
    else:
        print("⚠️ No se pudo actualizar el mapper - patrón no encontrado")
        return False

if __name__ == "__main__":
    print("🔧 ACTUALIZANDO ADMIN INSCRIPTION MAPPER")
    print("=" * 50)
    
    if actualizar_mapper():
        print("✅ Mapper actualizado. Listo para compilar.")
    else:
        print("❌ Error actualizando mapper.")
