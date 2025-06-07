# INVENTARIO DE CÓDIGO OBSOLETO Y DUPLICADO

## 🗑️ ARCHIVOS ELIMINADOS

### ✅ COMPLETADO
- `mpd-concursos-app-frontend/src/app/features/concursos/components/inscripcion/inscripcion-button/inscripcion-button.component.html`
  - **Razón:** Duplicaba lógica del template inline en .ts
  - **Impacto:** Eliminó confusión entre dos implementaciones diferentes

## 🔄 MODELOS DUPLICADOS - PENDIENTE UNIFICACIÓN

### Backend - Modelos Contest
1. **`concurso-backend/.../contest/domain/model/Contest.java`**
   - Tipo ID: `UUID`
   - Campos: Completo con fechas de inscripción
   - **Estado:** MANTENER como modelo principal

2. **`concurso-backend/.../contest/domain/Contest.java`**
   - Tipo ID: `Long`
   - Campos: Simplificado
   - **Estado:** ELIMINAR - Duplica funcionalidad

3. **`concurso-backend/.../filter/domain/model/Contest.java`**
   - Tipo ID: `ContestId` (value object)
   - Campos: Solo para filtros
   - **Estado:** MANTENER - Propósito específico

4. **`concurso-backend/.../contest/application/dto/ContestDTO.java`**
   - Tipo ID: `Long`
   - Campos: Para transferencia
   - **Estado:** ACTUALIZAR para usar modelo principal

### Frontend - Interfaces Contest
1. **`mpd-concursos-app-frontend/.../concurso/concurso.interface.ts`**
   - Tipo ID: `number | string`
   - Campos: Completo con alias Contest
   - **Estado:** MANTENER como interface principal

2. **`mpd-concursos-app-frontend/.../postulacion/postulacion.interface.ts`**
   - Contiene: `Concurso` y `Contest` duplicados
   - Tipo ID: `number`
   - **Estado:** ELIMINAR duplicados, usar interface principal

## 🏷️ ESTADOS LEGACY - PENDIENTE ELIMINACIÓN

### Backend
```java
// En ContestStatus.java - ELIMINAR gradualmente
@Deprecated
ACTIVE("Active", "Activo"),           // REEMPLAZAR con: INSCRIPTION_OPEN
@Deprecated  
CLOSED("Closed", "Cerrado"),          // REEMPLAZAR con: INSCRIPTION_CLOSED
@Deprecated
IN_PROGRESS("In Progress", "En Progreso"); // REEMPLAZAR con: IN_EVALUATION
```

### Frontend
```typescript
// En concurso.interface.ts - ELIMINAR después de migración
'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'PENDING'
```

## 🔧 COMPONENTES CON LÓGICA DUPLICADA

### InscripcionButtonComponent
- **Problema:** Lógica de estados duplicada en múltiples lugares
- **Solución:** Centralizar en servicio de estados

### ContestStatusBadgeComponent
- **Problema:** Mapeo de estados hardcodeado
- **Solución:** Usar servicio centralizado de traducción

## 📁 ARCHIVOS CANDIDATOS A ELIMINACIÓN

### Backend
```
concurso-backend/src/main/java/ar/gov/mpd/concursobackend/contest/domain/Contest.java
concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/rest/InscriptionUserStatusController.java.new
```

### Frontend
```
mpd-concursos-app-frontend/src/app/shared/interfaces/postulacion/postulacion.interface.ts (Concurso y Contest duplicados)
```

## 🎯 PRÓXIMOS PASOS PRIORITARIOS

### INMEDIATO (Hoy)
1. ✅ Eliminar archivo HTML duplicado
2. ✅ Actualizar README con eventos correctos
3. ✅ Documentar estados legacy en interface
4. ✅ Actualizar lógica de botón inscripción

### CORTO PLAZO (Esta semana)
1. [ ] Eliminar modelo Contest duplicado en backend
2. [ ] Unificar interfaces Contest en frontend
3. [ ] Migrar estados legacy a nuevos estados
4. [ ] Actualizar máquina de estados

### MEDIANO PLAZO (Próxima semana)
1. [ ] Eliminar estados @Deprecated del enum
2. [ ] Centralizar lógica de estados en servicios
3. [ ] Limpiar imports no utilizados
4. [ ] Actualizar documentación

## 📊 MÉTRICAS DE PROGRESO

### Eliminaciones Completadas: 1/15+ ✅
- [x] inscripcion-button.component.html

### Unificaciones Pendientes: 0/6 ❌
- [ ] Modelos Contest backend
- [ ] Interfaces Contest frontend  
- [ ] Estados legacy
- [ ] Lógica de inscripción
- [ ] Servicios de estado
- [ ] Componentes de estado

### Impacto Estimado:
- **Líneas de código eliminadas:** ~500+
- **Archivos consolidados:** 6 → 2
- **Duplicaciones eliminadas:** 15+
- **Tiempo de desarrollo ahorrado:** 20-30% en futuras modificaciones
