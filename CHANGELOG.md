# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-12-06

### ✨ Agregado - Sistema de Máquinas de Estado

#### 🔧 Backend - Arquitectura de Estado
- **ContestStateMachine**: Máquina de estado centralizada para concursos
  - Validación de transiciones: DRAFT → PUBLISHED → ACTIVE → CLOSED → FINISHED → ARCHIVED
  - Soporte para estados legacy (IN_PROGRESS)
  - Reglas de negocio documentadas en código
- **InscriptionStateMachine**: Máquina de estado para inscripciones
  - Estados complejos: ACTIVE → COMPLETED_WITH_DOCS/COMPLETED_PENDING_DOCS → PENDING → APPROVED/REJECTED
  - Transiciones automáticas basadas en documentación
  - Manejo de estados congelados (FROZEN) por vencimiento de plazos
- **PostulationStateMachine**: Máquina de estado para postulaciones
  - Flujo simplificado: ACTIVE → PENDING → APPROVED/REJECTED/CANCELLED
- **PostulationStatus Enum**: Nuevo enum para estados de postulaciones en backend

#### 🔗 API REST - Endpoints de Estado
- `GET /api/admin/contests/{id}/valid-next-states` - Estados válidos siguientes para concursos
- `GET /api/admin/contests/{id}/allows-inscriptions` - Verificar permisos de inscripción
- `GET /api/admin/inscriptions/{id}/valid-next-states` - Estados válidos siguientes para inscripciones
- `GET /api/admin/inscriptions/{id}/allows-document-upload` - Verificar permisos de carga de documentos
- `GET /api/admin/inscriptions/{id}/is-resumable` - Verificar si inscripción es reanudable

#### 🧪 Testing Completo
- **41 tests unitarios** para máquinas de estado
- **100% cobertura** de transiciones de estado
- **Validación exhaustiva** de reglas de negocio
- **Manejo de edge cases** (valores nulos, estados inválidos)

### 🔄 Cambiado - Refactoring de Estado

#### 🏗️ Arquitectura Mejorada
- **ContestStatus Enum Unificado**: Eliminación de duplicados, soporte bilingüe
- **Type Safety Completo**: Conversión de String a Enum en toda la aplicación
- **Validación Centralizada**: Todas las transiciones validadas por máquinas de estado
- **Contest.status**: Cambiado de `String` a `ContestStatus` enum

#### 🔧 Servicios Actualizados
- **ContestService**: Integración con ContestStateMachine para validación
- **AdminInscriptionService**: Validación de transiciones usando InscriptionStateMachine
- **ContestValidator**: Uso de máquinas de estado en lugar de lógica hardcodeada

### 🗑️ Eliminado - Limpieza de Código

#### 🧹 Código Legacy Removido
- **Enum duplicado**: `contest/domain/model/ContestStatus.java` eliminado
- **Métodos deprecated**: Limpieza de métodos obsoletos en Inscription y ContestValidator
- **ExperienciaEntity**: Clase deprecated eliminada completamente
- **Validación hardcodeada**: Reemplazada por máquinas de estado centralizadas

### 📚 Documentación

#### 📖 Documentación Nueva
- **STATE_MACHINE_API.md**: Documentación completa de endpoints de máquinas de estado
- **README.md actualizado**: Sección de máquinas de estado con diagramas Mermaid
- **Diagramas de transición**: Documentación visual de todos los flujos de estado
- **Reglas de negocio**: Documentadas en código y API

### 🔧 Mejoras Técnicas

#### 🏛️ Arquitectura
- **Principios SOLID**: Aplicados en diseño de máquinas de estado
- **Clean Code**: Código auto-documentado con reglas de negocio explícitas
- **Patrón State Machine**: Implementación robusta y extensible
- **Inyección de Dependencias**: Correcta integración con Spring Boot

#### 🚀 Rendimiento
- **Validación Eficiente**: Operaciones O(1) para verificación de transiciones
- **Memoria Optimizada**: Uso de Map estático para transiciones válidas
- **Compilación Rápida**: Eliminación de código duplicado y conflictos

### 🔒 Seguridad y Robustez

#### 🛡️ Validación Robusta
- **Transiciones Imposibles**: Prevención de estados inconsistentes
- **Manejo de Errores**: Excepciones descriptivas para transiciones inválidas
- **Códigos HTTP Apropiados**: 400 Bad Request para transiciones inválidas, 404 Not Found para recursos inexistentes

#### 🔍 Auditabilidad
- **Trazabilidad Completa**: Todas las transiciones validadas y registradas
- **Reglas Documentadas**: Cada estado tiene descripción de reglas de negocio
- **Testing Exhaustivo**: Validación de todos los casos de uso

### 🎯 Impacto en Producción

#### ✅ Beneficios Inmediatos
- **Consistencia de Datos**: Estados siempre coherentes con reglas de negocio
- **Mantenibilidad**: Cambios en reglas centralizados en un solo lugar
- **Extensibilidad**: Fácil agregar nuevos estados y transiciones
- **Confiabilidad**: Imposible realizar transiciones inválidas

#### 🔮 Preparación Futura
- **API Preparada**: Frontend puede implementar UI dinámica basada en estados válidos
- **Escalabilidad**: Arquitectura preparada para nuevos tipos de entidades
- **Integración**: Base sólida para futuras integraciones con sistemas externos

---

## [1.1.0] - 2024-11-15

### Agregado
- Sistema de inscripciones con documentación
- Portal de postulantes con glassmorphism design
- Sistema de notificaciones
- Gestión de documentos PDF

### Cambiado
- Migración a Angular 18
- Actualización de dependencias de Spring Boot
- Mejoras en la interfaz de usuario

### Corregido
- Problemas de autenticación JWT
- Errores en carga de documentos
- Inconsistencias en estados de concursos

---

## [1.0.0] - 2024-10-01

### Agregado
- Versión inicial del sistema
- Gestión básica de concursos
- Sistema de autenticación
- Panel administrativo
- Base de datos MySQL

### Características Iniciales
- Creación y gestión de concursos
- Sistema de usuarios y roles
- Interfaz administrativa básica
- API REST completa
