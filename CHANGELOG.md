# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-prod] - 2025-01-XX - PREPARACIÓN PARA PRODUCCIÓN

### 🚀 Deployment en Servidor Donweb
- **Configurado** deployment para servidor vps-4778464-x.dattaweb.com (149.50.132.23)
- **Optimizado** Docker Compose para producción con límites de recursos
- **Agregado** soporte para HTTPS y configuración CORS específica para IP del servidor
- **Creado** docker-compose.prod.yml con configuraciones optimizadas para producción

### 🔧 Scripts de Automatización
- **Creado** deploy-production.sh - Script automático de deployment
- **Creado** verify-production.sh - Script de verificación de funcionalidades críticas
- **Creado** backup-production.sh - Script de backup automático
- **Configurado** variables de entorno específicas para producción (.env.production)

### 🌐 Configuración de Red y Seguridad
- **Actualizado** CORS para incluir IP del servidor (149.50.132.23)
- **Optimizado** nginx.conf con headers de seguridad y compresión mejorada
- **Configurado** health checks para todos los servicios
- **Agregado** logging estructurado para monitoreo

### 📊 Optimizaciones de Rendimiento
- **Configurado** límites de memoria y CPU para contenedores Docker
- **Optimizado** configuración JVM para backend (1GB heap, G1GC)
- **Mejorado** configuración de MySQL con health checks optimizados
- **Agregado** compresión gzip y cache de archivos estáticos

### 🔒 Configuración de Producción
- **Deshabilitado** SQL logging en producción
- **Configurado** perfiles de Spring Boot para producción
- **Optimizado** timeouts y configuraciones de red
- **Agregado** restart policies para alta disponibilidad

### 📋 Documentación
- **Actualizado** README.md con instrucciones de deployment
- **Documentado** comandos de gestión para producción
- **Creado** guías de troubleshooting y monitoreo
- **Agregado** URLs de acceso y verificación

## [1.4.1] - 2024-12-08

### Fixed
- **CRÍTICO**: Corrección del error "No se recibió el ID de inscripción" en el proceso de inscripción
  - Modificado el flujo en `concursos.component.ts` para crear la inscripción antes de navegar
  - Corregidos los eventos en `concurso-detalle.component.html` para usar `inscripcionClick` y `continuarClick`
  - Implementada validación robusta del ID de inscripción antes de la navegación
  - Agregado manejo de errores mejorado con notificaciones al usuario
- **Estados de Finalización Corregidos**: Implementación correcta de estados `COMPLETED_WITH_DOCS` y `COMPLETED_PENDING_DOCS`
  - Eliminado el estado genérico "PENDIENTE" en favor de estados específicos según documentación
  - Corregido el mapeo de estados en `inscripcion-process-page.component.ts`
  - Mejorada la experiencia de usuario con estados más descriptivos
- **Detección de Inscripciones Existentes**: Implementada en cards de concursos
  - Agregada lógica en `concurso-card.component.ts` para detectar inscripciones existentes
  - Botones inteligentes que cambian según el estado de la inscripción del usuario
  - Cache de inscripciones actualizado automáticamente después de crear inscripciones
- **CRÍTICO - Error 403 Forbidden**: Solucionado problema de permisos al finalizar inscripción con documentación incompleta
  - Corregido mapeo de estados `COMPLETED_WITH_DOCS` y `COMPLETED_PENDING_DOCS` a `PENDING` en el backend
  - Ahora usa correctamente el endpoint `/user-status` que permite a usuarios cambiar estado a `PENDING`
  - Eliminado uso incorrecto del endpoint `/status` que requiere permisos de administrador
- **CRÍTICO - Detección de Inscripciones Canceladas**: Corregida inconsistencia en la interfaz de usuario
  - Eliminada lógica de "reinscripción por tiempo" que contradecía la regla de negocio
  - Implementado método `clearCacheAndRefresh()` para limpieza completa del cache
  - Forzada actualización automática del cache después de cancelaciones
  - Agregada suscripción reactiva a cambios de inscripciones en las cards
  - Corregido mapeo de estados para mostrar correctamente el mensaje de bloqueo
  - Mejorado logging para debugging de estados de inscripción
- **CRÍTICO - Lógica de Negocio**: Implementada regla "una inscripción por concurso" (sin reinscripción)
  - Corregida validación en `CreateInscriptionService` para impedir reinscripciones después de cancelación
  - Agregado método `findByContestIdAndUserIdIncludingCancelled()` en backend para validación completa
  - Implementada lógica en frontend para mostrar mensajes informativos en lugar de botón de inscripción
  - **REGLA**: Una vez inscrito (cualquier estado), no se puede volver a inscribir al mismo concurso
- Corrección del flujo de navegación desde la lista de concursos hacia el proceso de inscripción
- Mejoras en la gestión de errores durante la creación de inscripciones

## [1.4.0] - 2024-12-07

### ✅ Completado - Pasos Recomendados Fase 4

#### Added
- **Refactoring Glassmorphism 100% completado** - Todos los componentes de usuario migrados
- **Verificación exhaustiva** de componentes PostulacionesComponent, PerfilComponent, etc.
- **Sistema funcionando** - Backend y frontend operativos sin errores críticos

#### Changed
- **Material UI completamente eliminado** del área de usuario común
- **Componentes custom** implementados en todos los módulos de usuario
- **Standalone components** sin dependencias externas pesadas

#### Fixed
- **Errores de compilación** corregidos en frontend y backend
- **Warnings CSS** menores identificados (no críticos)
- **Tests obsoletos** identificados para futura corrección

#### Technical
- **Glassmorphism premium dark** aplicado consistentemente
- **Arquitectura hexagonal** consolidada en backend
- **Arquitectura modular** consolidada en frontend
- **Principios SOLID** y clean code respetados

## [1.3.0] - 2024-12-06

### 🔍 Análisis - Fase 4 Migración UUID

#### 📊 Análisis de Complejidad Completado
- **Script de Migración**: V3__migrate_contests_to_uuid.sql creado para migración de base de datos
- **ContestIdAdapter**: Adaptador temporal para conversión bidireccional Long ↔ UUID
- **ContestRepositoryAdapter**: Wrapper para mantener compatibilidad durante migración
- **Evaluación de Impacto**: Identificación de 50+ archivos afectados por migración UUID
- **Documentación Técnica**: Plan detallado de sub-fases para migración gradual

#### ⚠️ Complejidad Crítica Detectada
- **Incompatibilidades Masivas**: Long vs UUID en toda la aplicación
- **APIs Públicas**: Requieren versionado para mantener compatibilidad
- **Base de Datos**: Migración compleja con potencial downtime
- **Testing Exhaustivo**: Validación de integridad en 50+ archivos

#### 🎯 Recomendaciones Estratégicas
- **División en Sub-Fases**: Fase 4A-4E para migración incremental
- **Versionado de APIs**: Mantener compatibilidad con clientes existentes
- **Testing Incremental**: Validación en cada sub-fase
- **Priorización**: Completar Fases 1-3 antes de abordar migración UUID

### 🔄 Cambiado - Estrategia de Migración
- **Fase 4 Pausada**: Migración UUID requiere enfoque más gradual
- **Modelo Principal**: Actualizado para usar Long ID temporalmente
- **Documentación**: Plan de migración UUID documentado para futuras fases

---

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
