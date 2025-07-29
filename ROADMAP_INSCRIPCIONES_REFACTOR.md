# 🚀 Roadmap de Refactorización - Sistema de Inscripciones

## 📋 Resumen Ejecutivo

Este roadmap documenta el plan integral para resolver los **33 problemas específicos** identificados durante la auditoría completa del sistema de inscripciones, que causan el "comportamiento caótico e impredecible" observado durante el proceso de inscripción a concursos.

### 🎯 Objetivo Principal
Eliminar la cancelación automática no deseada de inscripciones causada por navegación accidental, garantizando que la regla de negocio (no reinscripción después de cancelación) solo se active cuando el usuario realmente desee cancelar su inscripción.

### 📊 Estado Actual
- **33 problemas identificados** distribuidos en 4 categorías
- **4 problemas críticos** que causan directamente el comportamiento caótico
- **Estimación total:** 10-16 días de desarrollo
- **Impacto esperado:** Eliminación completa del comportamiento impredecible

---

## 🎯 Tabla de Priorización de Problemas

### 🔴 CRÍTICOS (Resolver Inmediatamente)
| ID | Problema | Archivo Principal | Impacto | Urgencia |
|----|----------|-------------------|---------|----------|
| **9** | ngOnDestroy() agresivo | `inscripcion-process-page.component.ts` | 🔴 ALTO | 🔴 CRÍTICA |
| **17** | Ausencia CanDeactivate guard | `routes.ts` + NUEVO guard | 🔴 ALTO | 🔴 CRÍTICA |
| **23** | Sidebar desprotegido | `sidebar.component.ts/.html` | 🔴 ALTO | 🔴 CRÍTICA |
| **19** | Sin beforeunload handlers | `inscripcion-process-page.component.ts` | 🔴 ALTO | 🔴 CRÍTICA |

### 🟠 ALTOS (Fase 1)
| ID | Problema | Archivo Principal | Impacto | Urgencia |
|----|----------|-------------------|---------|----------|
| **10** | Sin distinción navegación intencional/accidental | `inscripcion-process-page.component.ts` | 🟠 ALTO | 🟠 ALTA |
| **21** | Flag isInternalNavigation inconsistente | `inscripcion-process-page.component.ts` | 🟠 ALTO | 🟠 ALTA |
| **6** | Estado local forzado inconsistente | `inscription-state.service.ts` | 🟠 ALTO | 🟠 ALTA |
| **12** | Métodos cancelación inconsistentes | `inscription.service.ts` | 🟠 ALTO | 🟠 ALTA |

### 🟡 MEDIOS (Fase 2)
| ID | Problema | Archivo Principal | Impacto | Urgencia |
|----|----------|-------------------|---------|----------|
| **1** | Falta flag isCreatingInscription backend | `CreateInscriptionService.java` | 🟡 MEDIO | 🟡 MEDIA |
| **7** | Múltiples fuentes de verdad | `inscription-state.service.ts` | 🟡 MEDIO | 🟡 MEDIA |
| **28** | Pérdida sincronización errores red | `inscription.service.ts` | 🟡 MEDIO | 🟡 MEDIA |
| **32** | Validación reinscripción inconsistente | Múltiples servicios | 🟡 MEDIO | 🟡 MEDIA |

### 🟢 BAJOS (Fase 3)
| ID | Problema | Archivo Principal | Impacto | Urgencia |
|----|----------|-------------------|---------|----------|
| **15** | Estados resumibles hardcodeados | `inscription-recovery.service.ts` | 🟢 BAJO | 🟢 BAJA |
| **29** | Reintentos automáticos problemáticos | `inscription.service.ts` | 🟢 BAJO | 🟢 BAJA |
| **31** | Limpieza conservadora excesiva | `inscription-recovery.service.ts` | 🟢 BAJO | 🟢 BAJA |

---

## 📅 Cronograma Detallado

### **FASE 0: Preparación** (1-2 días)
**Recursos:** 1 desarrollador senior  
**Fechas:** Días 1-2

#### Tareas:
- [x] Crear branch `feature/inscriptions-refactor`
- [x] Configurar tests de integración para validar comportamiento actual
- [x] Documentar estado actual del sistema
- [ ] Setup de métricas de monitoreo
- [ ] Configurar CI/CD para validación automática

### **FASE 1: Críticos - Protección Navegación** (3-5 días)
**Recursos:** 1 desarrollador senior + 1 tester  
**Fechas:** Días 3-7

#### 🔴 Problema 9: ngOnDestroy() agresivo
- [x] **Archivo:** `inscripcion-process-page.component.ts` (líneas 344-377)
- [x] Eliminar cancelación automática en ngOnDestroy()
- [x] Implementar guardado de estado en lugar de cancelación
- [x] Agregar logging detallado para debugging
- [x] **Tiempo estimado:** 0.5 días ✅ **COMPLETADO**

#### 🔴 Problema 17: CanDeactivate guard
- [x] **Archivo NUEVO:** `inscription-deactivate.guard.ts`
- [x] **Archivo:** `routes.ts` (líneas 5-11)
- [x] Implementar guard con confirmación de navegación
- [x] Integrar con sistema de notificaciones
- [x] Configurar en rutas de inscripción
- [x] **Tiempo estimado:** 1 día ✅ **COMPLETADO**

#### 🔴 Problema 23: Sidebar desprotegido
- [x] **Archivo:** `sidebar.component.ts` (agregar validación)
- [x] **Archivo:** `sidebar.component.html` (cambiar enlaces)
- [x] Implementar confirmación antes de navegación
- [x] Proteger todos los enlaces del sidebar
- [x] **Tiempo estimado:** 1 día ✅ **COMPLETADO**

#### 🔴 Problema 19: beforeunload handlers
- [x] **Archivo:** `inscripcion-process-page.component.ts`
- [x] Agregar @HostListener para beforeunload
- [x] Implementar guardado automático de estado
- [x] Agregar soporte para mobile (visibilitychange)
- [x] **Tiempo estimado:** 0.5 días ✅ **COMPLETADO**

#### Validación Fase 1:
- [ ] Tests e2e para navegación accidental
- [ ] Tests de confirmación de abandono
- [ ] Validación de guardado automático
- [ ] **Tiempo estimado:** 1-2 días

### **FASE 2: Altos - Estado y Sincronización** (4-6 días)
**Recursos:** 1 desarrollador senior + 1 desarrollador mid  
**Fechas:** Días 8-13

#### 🟠 Problema 10: Distinción navegación
- [x] **Archivo:** `inscripcion-process-page.component.ts`
- [x] Implementar enum NavigationType
- [x] Crear sistema de contexto de navegación
- [x] Mejorar logging de navegación
- [x] **Tiempo estimado:** 1 día ✅ **COMPLETADO**

#### 🟠 Problema 12: Métodos cancelación
- [x] **Archivo:** `inscription.service.ts`
- [x] Unificar métodos de cancelación
- [x] Implementar CancellationContext
- [x] Eliminar métodos duplicados
- [x] **Tiempo estimado:** 2 días ✅ **COMPLETADO**

#### 🟠 Problema 6: Estado local inconsistente
- [x] **Archivo:** `inscription-state.service.ts`
- [x] Corregir forzado de estado PENDING
- [x] Sincronizar con estado real del backend
- [x] Mejorar validación temporal
- [x] **Tiempo estimado:** 1-2 días ✅ **COMPLETADO**

#### Validación Fase 2:
- [ ] Tests de sincronización estado
- [ ] Tests de métodos unificados
- [ ] Validación de contexto de navegación
- [ ] **Tiempo estimado:** 1 día

### **FASE 3: Backend y Optimización** (2-3 días)
**Recursos:** 1 desarrollador backend + 1 desarrollador frontend  
**Fechas:** Días 14-16

#### 🟡 Problema 1: Flag backend concurrencia
- [x] **Archivo:** `CreateInscriptionService.java`
- [x] Implementar cache de creación
- [x] Agregar timeout y limpieza automática
- [x] Manejar condiciones de carrera
- [x] **Tiempo estimado:** 1 día ✅ **COMPLETADO**

#### 🟡 Problema 7: Múltiples fuentes de verdad
- [x] **Archivo:** `inscription-state.service.ts`
- [x] Consolidar almacenamiento en localStorage (parcial)
- [x] Mejorar validación temporal
- [x] **Tiempo estimado:** 0.5 días ✅ **COMPLETADO**

#### 🟡 Problema 28: Pérdida sincronización errores red
- [x] **Archivo:** `inscription.service.ts`
- [x] Mejorar manejo de errores de red
- [x] Implementar reintentos inteligentes
- [x] **Tiempo estimado:** 0.5 días ✅ **COMPLETADO**

#### Optimizaciones restantes:
- [x] Limpieza de código legacy ✅ **COMPLETADO**
- [x] Optimización recovery service ✅ **COMPLETADO**
- [x] Documentación final ✅ **COMPLETADO**
- [x] **Tiempo estimado:** 1-2 días ✅ **COMPLETADO**

---

## 📁 Archivos Específicos por Problema

### Frontend - Componentes
```
mpd-concursos-app-frontend/src/app/features/concursos/components/inscripcion/
├── pages/inscripcion-process-page/
│   └── inscripcion-process-page.component.ts (Problemas: 9, 10, 19, 21, 22)
├── guards/
│   └── inscription-deactivate.guard.ts (NUEVO - Problema 17)
└── routes.ts (Problema 17)
```

### Frontend - Servicios
```
mpd-concursos-app-frontend/src/app/core/services/inscripcion/
├── inscription.service.ts (Problemas: 12, 13, 14, 28, 29)
├── inscription-state.service.ts (Problemas: 6, 7, 8)
└── inscription-recovery.service.ts (Problemas: 15, 16, 31)
```

### Frontend - Navegación
```
mpd-concursos-app-frontend/src/app/features/dashboard/components/
├── sidebar/
│   ├── sidebar.component.ts (Problema 23)
│   └── sidebar.component.html (Problema 23)
└── navbar/
    ├── navbar.component.ts (Problema 24)
    └── navbar.component.html (Problema 24)
```

### Backend - Servicios
```
concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/
├── application/service/
│   ├── CreateInscriptionService.java (Problemas: 1, 2, 26, 30)
│   ├── CancelInscriptionService.java (Problema 4)
│   └── InscriptionStateService.java (Problema 5)
└── domain/model/
    └── Inscription.java (Problema 3)
```

---

## ✅ Criterios de Validación por Fase

### Fase 1 - Métricas Críticas
- [ ] **0% cancelaciones automáticas** no deseadas por navegación accidental
- [ ] **100% confirmaciones** antes de navegación desde sidebar/navbar
- [ ] **95% advertencias exitosas** antes de cerrar ventana/pestaña
- [ ] **< 500ms respuesta** en confirmaciones de navegación

### Fase 2 - Métricas de Estado
- [ ] **100% sincronización** entre estado local y backend
- [ ] **0 métodos duplicados** de cancelación
- [ ] **< 100ms latencia** en validaciones de estado
- [ ] **95% recuperación exitosa** de procesos interrumpidos

### Fase 3 - Métricas de Optimización
- [ ] **0 inscripciones duplicadas** por condiciones de carrera
- [ ] **< 50ms latencia** en validaciones de concurrencia
- [ ] **90% reducción** en logs de error relacionados
- [ ] **100% cobertura** de documentación actualizada

---

## 🔗 Referencias Cruzadas y Dependencias

### Dependencias Críticas
- **Problema 17** (CanDeactivate) → **Problema 9** (ngOnDestroy): El guard debe implementarse ANTES de corregir ngOnDestroy
- **Problema 23** (Sidebar) → **Problema 17** (Guard): Sidebar debe usar el mismo guard
- **Problema 10** (Navegación) → **Problema 21** (Flag): Ambos deben resolverse juntos

### Dependencias de Sincronización
- **Problema 6** (Estado local) → **Problema 12** (Cancelación): Estado debe ser consistente antes de unificar cancelación
- **Problema 1** (Backend) → **Problema 26** (Concurrencia): Ambos abordan el mismo problema desde diferentes ángulos

### Dependencias de Optimización
- **Problema 15** (Estados hardcodeados) → **Problema 3** (Estados backend): Deben sincronizarse
- **Problema 31** (Limpieza) → **Problema 16** (Recovery): Optimizar juntos para mejor rendimiento

---

## ⚠️ Riesgos y Planes de Mitigación

### 🔴 Riesgo Alto: Cambios Breaking
**Descripción:** Modificaciones en ngOnDestroy y guards pueden afectar otros flujos  
**Probabilidad:** Media | **Impacto:** Alto  
**Mitigación:**
- [ ] Feature flags para rollback rápido
- [ ] Tests exhaustivos en ambiente de staging
- [ ] Rollout gradual por porcentaje de usuarios
- [ ] Mantener código legacy hasta validación completa

### 🟡 Riesgo Medio: Performance
**Descripción:** Nuevas validaciones pueden impactar rendimiento  
**Probabilidad:** Baja | **Impacto:** Medio  
**Mitigación:**
- [ ] Profiling antes/después de cada cambio
- [ ] Métricas de performance en tiempo real
- [ ] Optimización incremental por componente
- [ ] Cache inteligente para validaciones frecuentes

### 🟢 Riesgo Bajo: UX Confusion
**Descripción:** Nuevas confirmaciones pueden confundir usuarios  
**Probabilidad:** Baja | **Impacto:** Bajo  
**Mitigación:**
- [ ] Tests de usabilidad con usuarios reales
- [ ] A/B testing de mensajes de confirmación
- [ ] Feedback continuo y ajustes iterativos
- [ ] Documentación clara para usuarios

---

## 📈 Métricas de Seguimiento

### Métricas Técnicas
- **Cancelaciones automáticas no deseadas:** 0 por día
- **Errores de sincronización estado:** < 1% de transacciones
- **Tiempo respuesta validaciones:** < 100ms percentil 95
- **Inscripciones duplicadas:** 0 por semana

### Métricas de Usuario
- **Satisfacción proceso inscripción:** > 4.5/5
- **Procesos completados exitosamente:** > 95%
- **Tiempo promedio completar inscripción:** < 10 minutos
- **Tickets soporte relacionados:** < 2 por semana

### Métricas de Desarrollo
- **Cobertura de tests:** > 90%
- **Tiempo build CI/CD:** < 5 minutos
- **Deuda técnica:** Reducción 50%
- **Documentación actualizada:** 100%

---

## 🎯 Definición de Éxito

### Criterio Principal
✅ **Un usuario puede navegar accidentalmente (sidebar, navbar, botones navegador) sin perder su inscripción en progreso**

### Criterios Secundarios
- ✅ Cierre accidental de ventana/pestaña muestra advertencia y guarda progreso
- ✅ Múltiples pestañas del mismo concurso no generan conflictos
- ✅ Recuperación de procesos interrumpidos funciona en 95% de casos
- ✅ Estado local siempre sincronizado con backend
- ✅ Mensajes claros y no intrusivos para el usuario
- ✅ Performance mantenida o mejorada
- ✅ Código mantenible y bien documentado

---

## 📞 Contactos y Responsabilidades

### Equipo Principal
- **Tech Lead:** Responsable de arquitectura y revisión de código
- **Frontend Senior:** Implementación de guards y componentes
- **Backend Senior:** Servicios de concurrencia y validación
- **QA Lead:** Estrategia de testing y validación
- **UX Designer:** Validación de flujos y mensajes de usuario

### Comunicación
- **Daily standups:** Progreso y blockers
- **Weekly reviews:** Demo de funcionalidades completadas
- **Retrospectivas:** Mejoras al proceso cada 2 semanas

---

## 📋 Lista Completa de 33 Problemas

### Backend (Problemas 1-5)
- [ ] **P1:** Falta flag `isCreatingInscription` backend
- [ ] **P2:** Validación de período tardía
- [ ] **P3:** Manejo inconsistente estados intermedios
- [ ] **P4:** Servicio cancelación demasiado simple
- [ ] **P5:** Falta validaciones específicas cancelación

### Frontend - Estado (Problemas 6-16)
- [ ] **P6:** Estado local forzado inconsistente
- [ ] **P7:** Múltiples fuentes de verdad
- [ ] **P8:** Limpieza incompleta de estado
- [ ] **P9:** ngOnDestroy() agresivo ⭐ CRÍTICO
- [ ] **P10:** Sin distinción navegación intencional/accidental
- [ ] **P11:** Recuperación procesos inconsistente
- [ ] **P12:** Métodos cancelación inconsistentes
- [ ] **P13:** Manejo estado local problemático
- [ ] **P14:** Validación basada localStorage obsoleto
- [ ] **P15:** Estados resumibles hardcodeados
- [ ] **P16:** Limpieza conservadora excesiva

### Navegación y Guards (Problemas 17-25)
- [ ] **P17:** Ausencia CanDeactivate guard ⭐ CRÍTICO
- [ ] **P18:** Guards existentes no aplicables
- [ ] **P19:** Sin beforeunload/unload handlers ⭐ CRÍTICO
- [ ] **P20:** No distinción navegación intencional/accidental
- [ ] **P21:** Flag isInternalNavigation inconsistente
- [ ] **P22:** Navegación por URL no protegida
- [ ] **P23:** Sidebar completamente desprotegido ⭐ CRÍTICO
- [ ] **P24:** Header/Navbar sin protección
- [ ] **P25:** Navegación por pasos sin validación

### Casos Edge (Problemas 26-33)
- [ ] **P26:** Condición carrera frontend/backend
- [ ] **P27:** Múltiples pestañas conflictivas
- [ ] **P28:** Pérdida sincronización errores red
- [ ] **P29:** Reintentos automáticos problemáticos
- [ ] **P30:** Inscripciones huérfanas por errores
- [ ] **P31:** Limpieza conservadora excesiva
- [ ] **P32:** Validación reinscripción inconsistente
- [ ] **P33:** Race condition validación estado

---

## 🧪 Plan de Testing Detallado

### Tests Unitarios
```typescript
// inscription-deactivate.guard.spec.ts
describe('InscriptionDeactivateGuard', () => {
  it('should allow navigation when inscription completed', () => {});
  it('should block navigation when inscription in progress', () => {});
  it('should show confirmation dialog', () => {});
});

// inscription.service.spec.ts
describe('InscriptionService', () => {
  it('should unify cancellation methods', () => {});
  it('should maintain state consistency', () => {});
  it('should handle network errors gracefully', () => {});
});
```

### Tests de Integración
```typescript
// inscription-flow.integration.spec.ts
describe('Inscription Flow Integration', () => {
  it('should maintain state across navigation', () => {});
  it('should recover interrupted processes', () => {});
  it('should prevent duplicate inscriptions', () => {});
});
```

### Tests E2E
```typescript
// inscription-navigation.e2e.spec.ts
describe('Navigation Protection E2E', () => {
  it('should prevent accidental sidebar navigation', () => {});
  it('should warn before window close', () => {});
  it('should recover from browser back/forward', () => {});
});
```

---

## 📚 Documentación Requerida

### Documentos Técnicos
- [ ] **Arquitectura de Guards:** Diagrama y flujo de validación
- [ ] **Estados de Inscripción:** Máquina de estados actualizada
- [ ] **API de Cancelación:** Documentación de endpoints unificados
- [ ] **Manejo de Errores:** Estrategias y códigos de error

### Documentos de Usuario
- [ ] **Guía de Recuperación:** Cómo recuperar procesos interrumpidos
- [ ] **FAQ Navegación:** Preguntas frecuentes sobre el nuevo comportamiento
- [ ] **Mensajes de Sistema:** Catálogo de confirmaciones y advertencias

### Documentos de Desarrollo
- [ ] **Guía de Contribución:** Estándares para modificar el sistema
- [ ] **Troubleshooting:** Guía de resolución de problemas comunes
- [ ] **Performance:** Métricas y optimizaciones implementadas

---

## 🔄 Proceso de Rollback

### Triggers de Rollback
- **Automático:** > 5% aumento en errores de inscripción
- **Manual:** Decisión del Tech Lead basada en métricas
- **Usuario:** > 10 tickets de soporte en 24h

### Procedimiento de Rollback
1. [ ] Activar feature flag de rollback
2. [ ] Verificar que sistema vuelve a comportamiento anterior
3. [ ] Notificar a stakeholders del rollback
4. [ ] Analizar causa raíz del problema
5. [ ] Planificar corrección y nuevo despliegue

### Validación Post-Rollback
- [ ] Métricas de error vuelven a baseline
- [ ] Funcionalidad básica de inscripciones operativa
- [ ] No hay inscripciones en estado inconsistente

---

## 📊 Dashboard de Monitoreo

### Métricas en Tiempo Real
- **Inscripciones Activas:** Número actual de procesos en curso
- **Cancelaciones por Hora:** Distinguiendo automáticas vs manuales
- **Errores de Sincronización:** Estado local vs backend
- **Tiempo Respuesta Guards:** Latencia de validaciones

### Alertas Configuradas
- 🚨 **Crítica:** > 3 cancelaciones automáticas en 1 hora
- ⚠️ **Warning:** > 1% errores de sincronización
- 📊 **Info:** Tiempo respuesta > 200ms en validaciones

### Reportes Semanales
- **Resumen de Problemas:** Issues resueltos vs nuevos
- **Performance:** Comparativa con semana anterior
- **Satisfacción Usuario:** Métricas de UX y feedback
- **Deuda Técnica:** Progreso en limpieza de código

---

*Última actualización: 2025-01-29*
*Versión: 1.0*
*Estado: En Preparación*
*Próxima revisión: Semanal durante implementación*
