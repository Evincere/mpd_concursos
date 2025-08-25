# Solución al problema de StaleObjectStateException en AdminDocumentService

## Resumen del problema

Durante las pruebas del microservicio de gestión de estado de documentos, se presentaron errores `StaleObjectStateException` de Hibernate al intentar aprobar y rechazar documentos a través de los endpoints REST del backend.

## Descripción técnica del error

### Excepción encontrada
```
org.hibernate.StaleObjectStateException: Row was updated or deleted by another transaction 
(or unsaved-value mapping was incorrect): [ar.gov.mpd.concursobackend.document.infrastructure.entity.DocumentEntity#58d53101-6e04-471c-95d0-3732f9a65d90]
```

### Causa raíz
El problema se originó en la implementación de los métodos de cambio de estado (`approveDocument`, `rejectDocument`, `revertDocument`) en la clase `AdminDocumentService`. La implementación original seguía este flujo:

1. **Obtener entidad** desde el repositorio JPA
2. **Convertir entidad a modelo de dominio** usando el mapper
3. **Modificar estado** en el modelo de dominio
4. **Convertir modelo de dominio de vuelta a entidad** usando el mapper
5. **Guardar entidad** en el repositorio

### El problema específico
El **mapper entre `DocumentEntity` y el modelo de dominio `Document` no preservaba el campo `version`** utilizado por Hibernate para el control de concurrencia optimista (Optimistic Locking).

Al no preservar la versión:
- La entidad guardada tenía una versión incorrecta o nula
- Hibernate detectaba un conflicto de concurrencia y lanzaba `StaleObjectStateException`
- Las operaciones de cambio de estado fallaban con error HTTP 500

## Solución implementada

### Estrategia de solución
Cambiar la implementación para **operar directamente sobre la entidad JPA gestionada**, evitando las conversiones innecesarias que causaban la pérdida del campo `version`.

### Implementación antes (problemática)
```java
public DocumentResponseDto approveDocument(String documentId) {
    DocumentEntity entity = documentSpringRepository.findById(documentId)
        .orElseThrow(() -> new DocumentNotFoundException("Documento no encontrado: " + documentId));
    
    // Conversión problemática que perdía el campo version
    Document document = documentMapper.toDomain(entity);
    document.approve();
    
    // Re-conversión que no preservaba version
    DocumentEntity updatedEntity = documentMapper.toEntity(document);
    DocumentEntity savedEntity = documentSpringRepository.save(updatedEntity);
    
    return documentMapper.toResponseDto(savedEntity);
}
```

### Implementación después (solucionada)
```java
public DocumentResponseDto approveDocument(String documentId) {
    DocumentEntity entity = documentSpringRepository.findById(documentId)
        .orElseThrow(() -> new DocumentNotFoundException("Documento no encontrado: " + documentId));
    
    // Operación directa sobre la entidad JPA gestionada
    entity.setEstado(DocumentState.APPROVED);
    entity.setValidadoPor(getCurrentUserId());
    entity.setFechaValidacion(LocalDateTime.now());
    entity.setMotivoRechazo(null); // Limpiar motivo de rechazo previo
    
    // Guardado directo preserva automáticamente el campo version
    DocumentEntity savedEntity = documentSpringRepository.save(entity);
    
    return documentMapper.toResponseDto(savedEntity);
}
```

### Métodos modificados
Los siguientes métodos se actualizaron con la nueva estrategia:

1. **`revertDocument(String documentId)`**
   - Cambia estado a `PENDING`
   - Limpia `validadoPor`, `fechaValidacion` y `motivoRechazo`

2. **`approveDocument(String documentId)`**
   - Cambia estado a `APPROVED` 
   - Establece `validadoPor` y `fechaValidacion`
   - Limpia `motivoRechazo`

3. **`rejectDocument(String documentId, String motivo)`**
   - Cambia estado a `REJECTED`
   - Establece `validadoPor`, `fechaValidacion` y `motivoRechazo`

## Beneficios de la solución

### 1. **Preservación del control de versiones**
- El campo `version` se mantiene automáticamente
- Hibernate puede realizar correctamente el locking optimista
- Se evitan conflictos de concurrencia

### 2. **Mejor rendimiento**
- Eliminación de conversiones innecesarias entre capas
- Menos asignaciones de memoria
- Operaciones más directas

### 3. **Código más simple y mantenible**
- Lógica más directa y clara
- Menos puntos de falla
- Menor complejidad en el flujo de datos

### 4. **Consistencia transaccional**
- Las operaciones se realizan dentro del contexto transaccional de Spring
- Mejor garantía de atomicidad

## Pruebas realizadas

Después de implementar la solución, se verificó el funcionamiento completo:

### Test 1: Revertir documento
```bash
curl -X PATCH "http://localhost:8080/api/admin/documentos/58d53101.../revertir"
# Resultado: REJECTED → PENDING ✅
```

### Test 2: Rechazar documento  
```bash
curl -X PATCH "http://localhost:8080/api/admin/documentos/58d53101.../rechazar" \
  -d '{"motivo": "Documento ilegible"}'
# Resultado: PENDING → REJECTED ✅
```

### Test 3: Aprobar documento
```bash
curl -X PATCH "http://localhost:8080/api/admin/documentos/58d53101.../aprobar"
# Resultado: PENDING → APPROVED ✅
```

## Lecciones aprendidas

### 1. **Cuidado con los mappers en entidades versionadas**
Los mappers entre entidades JPA y modelos de dominio deben preservar **todos** los campos de control, especialmente `version` para locking optimista.

### 2. **Operaciones directas vs conversiones**
Para operaciones simples de cambio de estado, es más eficiente y seguro operar directamente sobre la entidad JPA gestionada.

### 3. **Testing en entornos reales**
Los errores de concurrencia pueden no manifestarse en pruebas unitarias mock, siendo necesario realizar pruebas en entornos con base de datos real.

## Aplicabilidad

Esta solución es aplicable a cualquier entidad JPA que:
- Utilice `@Version` para locking optimista
- Tenga operaciones de cambio de estado
- Use mappers que puedan no preservar campos de control

## Archivos modificados

- **`AdminDocumentService.java`**: Métodos `revertDocument`, `approveDocument`, `rejectDocument`
- **Rebuild del backend**: Reconstrucción y redespliegue del contenedor Docker

---
**Fecha**: 2025-08-19  
**Estado**: Resuelto ✅  
**Impacto**: Las tres operaciones de cambio de estado funcionan correctamente sin errores de concurrencia
