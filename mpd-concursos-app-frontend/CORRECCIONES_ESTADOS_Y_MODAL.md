# Correcciones de Estados y Modal Automático

## Problemas Identificados y Solucionados

### 1. Estados en Inglés en lugar de Español

**Problema:** Los estados de concursos e inscripciones se mostraban en inglés (PUBLISHED, PENDING_DOCS) en lugar de español.

**Causa:** Los componentes no estaban usando las funciones de traducción existentes o faltaban traducciones para algunos estados.

**Solución:**
- Creado archivo centralizado de traducciones: `src/app/shared/utils/state-translations.util.ts`
- Agregadas traducciones para todos los estados de concursos e inscripciones
- Actualizados los componentes para usar las utilidades centralizadas:
  - `postulacion-detalle.component.ts`
  - `concurso-detalle.component.ts`
  - `concursos.component.ts`

**Estados de Concursos Traducidos:**
- `PUBLISHED` → "Publicado"
- `PAUSED` → "Pausado"
- `FINISHED` → "Finalizado"
- `ARCHIVED` → "Archivado"
- `DRAFT` → "Borrador"
- `CANCELLED` → "Cancelado"
- `CLOSED` → "Cerrado"
- `ACTIVE` → "Activo"

**Estados de Inscripciones Traducidos:**
- `COMPLETED_WITH_DOCS` → "Pendiente"
- `COMPLETED_PENDING_DOCS` → "Pendiente"
- `FROZEN` → "Congelada"
- `APPROVED` → "Aprobada"
- `REJECTED` → "Rechazada"
- `CANCELLED` → "Cancelada"

### 2. Modal Automático de Continuación de Inscripción

**Problema:** El modal de "Continuar inscripción" aparecía automáticamente al navegar a la página de concursos, sin que el usuario lo solicitara.

**Causa:** El `DashboardComponent` llamaba automáticamente a `inscriptionRecoveryService.checkForPendingInscriptions()` en el `ngOnInit`.

**Solución:**
- Modificado `DashboardComponent` para que solo muestre el modal en casos específicos (recuperación por desconexión)
- Actualizado `InscriptionRecoveryService` para ser más específico sobre cuándo mostrar el modal
- Cambiado el mensaje de la notificación para ser menos intrusivo
- El usuario ahora debe decidir cuándo retomar una inscripción desde "Mis Postulaciones"

**Cambios en `DashboardComponent`:**
```typescript
// ANTES: Siempre verificaba inscripciones pendientes
this.inscriptionRecoveryService.checkForPendingInscriptions();

// DESPUÉS: Solo en casos específicos como desconexión
const recoveryMode = urlParams.get('recoveryMode') === 'true';
const fromDisconnection = urlParams.get('fromDisconnection') === 'true';

if (recoveryMode && fromDisconnection) {
  this.inscriptionRecoveryService.checkForPendingInscriptions();
}
```

**Cambios en `InscriptionRecoveryService`:**
- Agregado parámetro `forceCheck` para controlar cuándo verificar
- Solo muestra notificación en casos de desconexión o fuerza explícita
- Mensaje cambiado de "Tienes una inscripción en proceso" a "Se detectó una inscripción interrumpida"

### 3. Mejora en la Continuación de Inscripciones

**Problema:** Cuando se reanudaba una inscripción con documentos pendientes, no llevaba directamente al paso de documentación.

**Solución:**
- Modificado `cargarEstadoGuardado()` en `inscripcion-process-page.component.ts`
- Agregada lógica para detectar continuación directa y llevar al paso 3 (documentación)
- Utiliza el flag `isDirectContinuation()` del `InscriptionStateService`

**Código agregado:**
```typescript
const shouldGoToDocumentation = this.inscriptionStateService.isDirectContinuation();

if (shouldGoToDocumentation) {
  console.log('[InscripcionProcess] Continuación directa detectada, dirigiendo al paso de documentación');
  this.currentStep = 3; // Paso de documentación
  this.inscriptionStateService.clearDirectContinuation(); // Limpiar el flag
} else {
  this.currentStep = Number(savedState.currentStep) || 1;
}
```

## Archivos Modificados

### Nuevos Archivos
- `src/app/shared/utils/state-translations.util.ts` - Utilidades centralizadas de traducción

### Archivos Modificados
- `src/app/features/dashboard/dashboard.component.ts` - Lógica del modal automático
- `src/app/core/services/inscripcion/inscription-recovery.service.ts` - Control de notificaciones
- `src/app/features/concursos/components/inscripcion/pages/inscripcion-process-page/inscripcion-process-page.component.ts` - Continuación directa
- `src/app/features/postulaciones/components/postulacion-detalle/postulacion-detalle.component.ts` - Traducciones
- `src/app/features/concursos/components/concurso-detalle/concurso-detalle.component.ts` - Traducciones
- `src/app/features/concursos/concursos.component.ts` - Traducciones

## Beneficios de los Cambios

1. **Mejor UX:** Los usuarios ya no son interrumpidos por modales automáticos no solicitados
2. **Consistencia:** Todos los estados se muestran en español de manera uniforme
3. **Mantenibilidad:** Traducciones centralizadas facilitan futuras actualizaciones
4. **Control del Usuario:** El usuario decide cuándo retomar una inscripción desde "Mis Postulaciones"
5. **Flujo Mejorado:** Continuación directa al paso de documentación cuando es necesario

## Notas Técnicas

- Las traducciones están centralizadas en `state-translations.util.ts` para facilitar mantenimiento
- El modal automático solo aparece en casos específicos de recuperación por desconexión
- La continuación directa funciona mediante flags en localStorage
- Todos los cambios son retrocompatibles con el sistema existente
