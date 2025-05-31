# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin publicar]

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
