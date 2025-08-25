#!/usr/bin/env python3

import re

# 1. Arreglar AdminInscriptionDTO
def fix_dto():
    file_path = 'concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/controller/dto/AdminInscriptionDTO.java'
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Restaurar desde backup
    with open(file_path + '.backup', 'r') as f:
        content = f.read()
    
    # Insertar antes del último }
    new_fields = '''
    
    // ====================================================================
    // CAMPOS AGREGADOS PARA CIRCUNSCRIPCIONES - 2025-08-19
    // ====================================================================
    
    /**
     * Centro de vida seleccionado por el usuario durante la inscripción
     */
    private String centroDeVida;
    
    /**
     * Circunscripciones seleccionadas por el usuario
     */
    private java.util.Set<String> selectedCircunscripciones;
'''
    
    # Insertar antes del último }
    content = content.rstrip()
    if content.endswith('}'):
        content = content[:-1] + new_fields + '\n}'
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ AdminInscriptionDTO actualizado")

# 2. Arreglar AdminInscriptionMapper
def fix_mapper():
    file_path = 'concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/controller/mapper/AdminInscriptionMapper.java'
    
    with open(file_path + '.backup', 'r') as f:
        content = f.read()
    
    # Buscar 'return dto;' y agregar código antes
    new_mapping = '''
        // ====================================================================
        // MAPEO DE CIRCUNSCRIPCIONES AGREGADO - 2025-08-19
        // ====================================================================
        
        // Mapear centro de vida si está disponible en las preferencias
        if (inscription.getPreferences() != null) {
            dto.setCentroDeVida(inscription.getPreferences().getCentroDeVida());
            dto.setSelectedCircunscripciones(inscription.getPreferences().getSelectedCircunscripciones());
        }

'''
    
    content = content.replace('        return dto;', new_mapping + '        return dto;')
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ AdminInscriptionMapper actualizado")

if __name__ == "__main__":
    fix_dto()
    fix_mapper()
    print("✅ Ambos archivos actualizados correctamente")
