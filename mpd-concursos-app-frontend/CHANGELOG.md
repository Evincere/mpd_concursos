# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin publicar]

### Corregido
- **CRÍTICO**: Unificado manejo de estados en postulacion-detalle
  - Reemplazado método manual `getEstadoPostulacionLabel()` por `app-contest-status-badge`
  - Estado "PENDING_DOCS" ahora se muestra correctamente como "Documentos Pendientes" en español con estilos
  - Eliminado código duplicado y estilos CSS obsoletos
  - Todos los componentes ahora usan el mismo mecanismo unificado para mostrar estados
- **Modal de Continuación de Inscripción**: Corregido el comportamiento del modal automático que aparecía para inscripciones con estado `COMPLETED_PENDING_DOCS`. Ahora el modal solo aparece automáticamente para inscripciones realmente interrumpidas (`IN_PROCESS`, `ACTIVE`). Para inscripciones completadas con documentación pendiente, el usuario debe decidir explícitamente cuándo continuar desde "Mis Postulaciones" o haciendo clic en "Completar Documentos".
- **CRÍTICO**: Corregida validación de inscripciones duplicadas que permitía crear múltiples inscripciones al mismo concurso
  - Mejorada validación local en `InscriptionService` para prevenir creación de inscripciones duplicadas
  - Agregados métodos `shouldPreventNewInscription()` y `getInscriptionBlockMessage()` para validación robusta
  - Mejorado manejo de errores con mensajes más descriptivos según el estado de la inscripción existente
  - Solo permite nuevas inscripciones cuando el estado anterior es CANCELLED o REJECTED
  - Actualizado manejo de errores 409 (Conflict) para mostrar mensajes específicos del backend

- **CRÍTICO**: Implementación completa de estados diferenciados para inscripciones con documentación
  - **Nuevos estados en `PostulationStatus` enum:**
    - `PENDING_VALIDATION`: Inscripción completa pendiente de validación administrativa (amarillo)
    - `PENDING_DOCS`: Inscripción con documentos pendientes que permite completar (naranja)
  - **Mapeo corregido en servicios:**
    - `state-mapping.service.ts`: Mapeo correcto de `COMPLETED_WITH_DOCS` → `PENDING_VALIDATION`
    - `state-mapping.service.ts`: Mapeo correcto de `COMPLETED_PENDING_DOCS` → `PENDING_DOCS`
    - `postulaciones.component.ts`: Actualizado para usar nuevos estados específicos
    - `postulaciones-filter.service.ts`: Soporte para filtrar por documentos pendientes
  - **Lógica de reanudación corregida:**
    - `InscripcionStateUtils`: `COMPLETED_PENDING_DOCS` permite reanudación para completar documentos
    - `inscripcion-button.component.ts`: Botón "Completar Documentos" para `COMPLETED_PENDING_DOCS`
    - `contest-status-badge.component.ts`: Soporte visual para nuevos estados
  - **Experiencia de usuario mejorada:**
    - Colores diferenciados: amarillo para validación, naranja para documentos pendientes
    - Mensajes específicos según el estado de la inscripción
    - Tooltips informativos para cada situación

### Agregado
- Implementación completa de la funcionalidad de cambio de estado de usuario en el panel administrativo
- Nuevo componente `ChangeStatusDialogComponent` para cambiar el estado de los usuarios
- Integración del cambio de estado en la vista de detalle de usuario
- Mejora del método `toggleUserStatus` para permitir cambiar a cualquier estado disponible
- Validación para requerir una razón al cambiar a estados restrictivos (BLOCKED, LOCKED, EXPIRED)

### Cambiado
- Mejorado el contraste visual del select de estado en el formulario de usuario
- Implementado un toggle para la selección de roles en lugar de checkboxes
- Actualizado el componente de detalle de usuario para mostrar y permitir cambiar el estado

### Corregido
- Eliminadas todas las referencias a datos mockeados en el repositorio de usuarios
- Corregido el problema con la creación de usuarios al enviar el formato correcto al backend
- Mejorada la visualización de estados de usuario con colores distintivos

## [0.1.0] - 2023-05-19

### Agregado
- Implementación inicial del panel administrativo
- Gestión básica de usuarios (listar, crear, editar)
- Componentes personalizados para mantener consistencia visual
