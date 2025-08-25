#!/usr/bin/env python3
"""
Script para arreglar la búsqueda de usuarios por DNI en AdminDocumentService.java
"""

import re

# Ruta del archivo
file_path = "/root/concursos/mpd_concursos/concurso-backend/src/main/java/ar/gov/mpd/concursobackend/document/application/service/AdminDocumentService.java"

# Leer el archivo actual
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Código original a reemplazar (líneas 211-221)
original_code = '''            if (filters.getUsuarioId() != null && !filters.getUsuarioId().isEmpty()) {
                try {
                    UUID userId = UUID.fromString(filters.getUsuarioId());
                    jpql.append("AND d.userId = :usuarioId ");
                    parameters.put("usuarioId", userId);
                    log.debug("Filtro de usuario aplicado: {}", userId);
                } catch (IllegalArgumentException e) {
                    log.error("Error al convertir usuarioId '{}' a UUID: {}", filters.getUsuarioId(), e.getMessage());
                    // Continuar sin el filtro de usuario
                }
            }'''

# Nuevo código híbrido
new_code = '''            if (filters.getUsuarioId() != null && !filters.getUsuarioId().isEmpty()) {
                String usuarioIdParam = filters.getUsuarioId().trim();
                
                try {
                    // Intentar primero como UUID (comportamiento original para compatibilidad)
                    UUID userId = UUID.fromString(usuarioIdParam);
                    jpql.append("AND d.userId = :usuarioId ");
                    parameters.put("usuarioId", userId);
                    log.debug("Filtro de usuario por UUID aplicado: {}", userId);
                } catch (IllegalArgumentException e) {
                    // Si falla UUID, intentar como DNI (nuevo comportamiento)
                    if (usuarioIdParam.matches("\\\\d+")) { // Solo números = posible DNI
                        jpql.append("AND EXISTS (SELECT 1 FROM UserEntity u WHERE u.id = d.userId AND u.dni = :usuarioDni) ");
                        parameters.put("usuarioDni", usuarioIdParam);
                        log.debug("Filtro de usuario por DNI aplicado: {}", usuarioIdParam);
                    } else {
                        log.warn("usuarioId '{}' no es ni UUID válido ni DNI numérico válido - ignorando filtro", usuarioIdParam);
                        // Continuar sin filtro (comportamiento actual preservado)
                    }
                }
            }'''

# Verificar que el código original existe
if original_code in content:
    print("✅ Código original encontrado, aplicando fix...")
    
    # Aplicar el reemplazo
    new_content = content.replace(original_code, new_code)
    
    # Verificar que el reemplazo se hizo correctamente
    if new_content != content and new_code in new_content:
        # Escribir el archivo modificado
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ Fix aplicado exitosamente!")
        print("🔧 Cambios realizados:")
        print("   - Mantiene compatibilidad con UUID")
        print("   - Añade soporte para búsqueda por DNI")
        print("   - Mejora logging para debug")
        print("   - Validación robusta de parámetros")
    else:
        print("❌ Error: El reemplazo no se pudo completar correctamente")
        exit(1)
else:
    print("❌ Error: No se pudo encontrar el código original esperado")
    print("Verificando si ya fue aplicado...")
    if "usuarioIdParam" in content and "DNI aplicado" in content:
        print("✅ El fix parece haber sido aplicado previamente")
    else:
        print("🔍 El código fuente parece haber cambiado. Revisar manualmente.")
        exit(1)

print("\n📝 Backup disponible en: AdminDocumentService.java.backup_*")
