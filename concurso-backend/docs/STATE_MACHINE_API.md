# State Machine API Documentation

## Overview

Este documento describe los endpoints de API relacionados con las máquinas de estado implementadas en el sistema MPD Concursos. Las máquinas de estado proporcionan validación centralizada y gestión de transiciones para concursos, inscripciones y postulaciones.

## Contest State Machine API

### Obtener Estados Válidos Siguientes

**Endpoint:** `GET /api/admin/contests/{id}/valid-next-states`

**Descripción:** Obtiene los estados válidos siguientes para un concurso específico.

**Parámetros:**
- `id` (path): ID del concurso

**Respuesta:**
```json
[
  "PUBLISHED",
  "CANCELLED"
]
```

**Códigos de Estado:**
- `200 OK`: Estados obtenidos exitosamente
- `404 Not Found`: Concurso no encontrado

### Verificar Permisos de Inscripción

**Endpoint:** `GET /api/admin/contests/{id}/allows-inscriptions`

**Descripción:** Verifica si un concurso permite inscripciones en su estado actual.

**Parámetros:**
- `id` (path): ID del concurso

**Respuesta:**
```json
true
```

**Códigos de Estado:**
- `200 OK`: Verificación exitosa
- `404 Not Found`: Concurso no encontrado

### Cambiar Estado de Concurso

**Endpoint:** `PATCH /api/admin/contests/{id}/status`

**Descripción:** Cambia el estado de un concurso con validación de máquina de estado.

**Parámetros:**
- `id` (path): ID del concurso
- `status` (query): Nuevo estado del concurso

**Respuesta:**
```json
{
  "id": 1,
  "title": "Concurso de Ejemplo",
  "status": "PUBLISHED",
  "isActive": true,
  "allowsInscriptions": false
}
```

**Códigos de Estado:**
- `200 OK`: Estado cambiado exitosamente
- `400 Bad Request`: Transición de estado inválida
- `404 Not Found`: Concurso no encontrado

## Inscription State Machine API

### Obtener Estados Válidos Siguientes

**Endpoint:** `GET /api/admin/inscriptions/{id}/valid-next-states`

**Descripción:** Obtiene los estados válidos siguientes para una inscripción específica.

**Parámetros:**
- `id` (path): ID de la inscripción

**Respuesta:**
```json
[
  "COMPLETED_WITH_DOCS",
  "COMPLETED_PENDING_DOCS",
  "CANCELLED"
]
```

**Códigos de Estado:**
- `200 OK`: Estados obtenidos exitosamente
- `404 Not Found`: Inscripción no encontrada

### Verificar Permisos de Carga de Documentos

**Endpoint:** `GET /api/admin/inscriptions/{id}/allows-document-upload`

**Descripción:** Verifica si una inscripción permite carga de documentos en su estado actual.

**Parámetros:**
- `id` (path): ID de la inscripción

**Respuesta:**
```json
true
```

**Códigos de Estado:**
- `200 OK`: Verificación exitosa
- `404 Not Found`: Inscripción no encontrada

### Verificar si es Reanudable

**Endpoint:** `GET /api/admin/inscriptions/{id}/is-resumable`

**Descripción:** Verifica si una inscripción puede ser reanudada por el usuario.

**Parámetros:**
- `id` (path): ID de la inscripción

**Respuesta:**
```json
true
```

**Códigos de Estado:**
- `200 OK`: Verificación exitosa
- `404 Not Found`: Inscripción no encontrada

### Cambiar Estado de Inscripción

**Endpoint:** `PATCH /api/admin/inscriptions/{id}/state`

**Descripción:** Cambia el estado de una inscripción con validación de máquina de estado.

**Parámetros:**
- `id` (path): ID de la inscripción

**Cuerpo de la Petición:**
```json
{
  "newState": "PENDING",
  "note": "Documentación completa verificada"
}
```

**Respuesta:**
```json
{
  "id": "uuid-string",
  "contestId": 1,
  "userId": "user-uuid",
  "state": "PENDING",
  "inscriptionDate": "2024-01-15T10:30:00",
  "lastUpdated": "2024-01-15T14:45:00"
}
```

**Códigos de Estado:**
- `200 OK`: Estado cambiado exitosamente
- `400 Bad Request`: Transición de estado inválida
- `404 Not Found`: Inscripción no encontrada

## State Machine Rules

### Contest State Transitions

```
DRAFT → PUBLISHED, CANCELLED
PUBLISHED → ACTIVE, CANCELLED  
ACTIVE → PAUSED, CLOSED, CANCELLED
PAUSED → ACTIVE, CANCELLED
CLOSED → FINISHED, CANCELLED
FINISHED → ARCHIVED
IN_PROGRESS → CLOSED, CANCELLED (legacy)
CANCELLED, ARCHIVED → [Estados finales]
```

### Inscription State Transitions

```
ACTIVE → COMPLETED_WITH_DOCS, COMPLETED_PENDING_DOCS, CANCELLED
COMPLETED_WITH_DOCS → PENDING, CANCELLED
COMPLETED_PENDING_DOCS → COMPLETED_WITH_DOCS, FROZEN, CANCELLED
PENDING → APPROVED, REJECTED, CANCELLED
FROZEN → REJECTED
APPROVED, REJECTED, CANCELLED → [Estados finales]
```

### Postulation State Transitions

```
ACTIVE → PENDING, CANCELLED
PENDING → APPROVED, REJECTED, CANCELLED
APPROVED, REJECTED, CANCELLED → [Estados finales]
```

## Business Rules

### Contest Rules

- **DRAFT**: Concurso en preparación. Puede ser publicado o cancelado.
- **PUBLISHED**: Concurso publicado. Puede activarse para inscripciones o cancelarse.
- **ACTIVE**: Concurso activo con inscripciones abiertas. Puede pausarse, cerrarse o cancelarse.
- **PAUSED**: Concurso pausado temporalmente. Puede reactivarse o cancelarse.
- **CLOSED**: Inscripciones cerradas. Puede finalizarse o cancelarse.
- **FINISHED**: Concurso finalizado. Solo puede archivarse.
- **CANCELLED**: Concurso cancelado. Estado final.
- **ARCHIVED**: Concurso archivado. Estado final.

### Inscription Rules

- **ACTIVE**: Inscripción en proceso. El usuario puede cargar documentos y completar la inscripción.
- **COMPLETED_WITH_DOCS**: Inscripción completada con toda la documentación. Lista para revisión administrativa.
- **COMPLETED_PENDING_DOCS**: Inscripción completada pero con documentos pendientes. El usuario tiene 3 días hábiles después del cierre para completar.
- **PENDING**: Inscripción enviada, pendiente de revisión administrativa.
- **FROZEN**: Inscripción congelada por vencimiento del plazo de documentación. Será rechazada automáticamente.
- **APPROVED**: Inscripción aprobada. Estado final.
- **REJECTED**: Inscripción rechazada. Estado final.
- **CANCELLED**: Inscripción cancelada por el usuario. Estado final.

## Error Handling

Todos los endpoints de máquinas de estado manejan los siguientes tipos de errores:

### 400 Bad Request
Cuando se intenta una transición de estado inválida:
```json
{
  "error": "Invalid state transition",
  "message": "Cannot transition from APPROVED to ACTIVE"
}
```

### 404 Not Found
Cuando el recurso no existe:
```json
{
  "error": "Resource not found",
  "message": "Contest with id 123 not found"
}
```

### 500 Internal Server Error
Para errores internos del servidor:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Authentication & Authorization

Todos los endpoints de administración requieren:
- **Autenticación**: Token JWT válido
- **Autorización**: Rol `ADMIN`

Los endpoints de usuario requieren:
- **Autenticación**: Token JWT válido
- **Autorización**: Propietario del recurso o rol `ADMIN`
