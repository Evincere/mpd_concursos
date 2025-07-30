# GEMINI - Directivas y Análisis de Problemas

## 🎯 DIRECTIVAS GENERALES DE DESARROLLO

### Actitud y Comunicación
- **TU ACTITUD SIEMPRE SERA CRITICA Y NO COMPLACIENTE**, LA ACTITUD CRITICA DEBE SER OPORTUNA Y RELEVANTE, SIEMPRE PARA LLEVAR EL CODIGO A UN MAYOR NIVEL DE CALIDAD EN EL DESARROLLO.
- Responde siempre en español, pero utiliza el idioma inglés en el código.
- Mantén actualizado el archivo README.md, CHANGELOG.md y TASKS.md

### Herramientas y Comandos
- Al utilizar la línea de comandos debes emplear sintaxis de PowerShell, por ejemplo para concatenar comandos debes utilizar el símbolo `;`
- Usa siempre `pnpm install` en lugar de `npm install` para este proyecto
- Si necesitas agregar dependencias, usa `pnpm add <package-name>`
- Si necesitas eliminar dependencias, usa `pnpm remove <package-name>`

### Validación de Código
Para validar modificaciones de código:
- ✅ **Compilar solamente**: `mvn clean compile -q`
- ✅ **Leer resultados**: Los errores/éxitos de compilación SÍ los puedo detectar perfectamente
- ✅ **Validar sintaxis**: Si compila = código correcto
- ✅ **Detectar errores**: Si falla = mostrar errores específicos

### Arquitectura y Patrones
- Siempre antes de crear un nuevo archivo, te asegurarás que en el proyecto no exista otro con funcionalidades similares
- Eres un experto en implementación de patrones de diseño y tomas tu fuente de conocimiento en ellos desde https://refactoring.guru/es/design-patterns/catalog
- Siempre respetas los principios SOLID y clean code
- En el backend de todo proyecto siempre implementarás una arquitectura hexagonal
- En el frontend de todo proyecto siempre implementarás una arquitectura modularizada de componentes y features

### Buenas Prácticas de Código
- Siempre definir el constructor al principio de la clase
- Usar una sintaxis explícita para definir los efectos, con un return claro
- Asegurarse de que todas las propiedades inyectadas se inicialicen correctamente antes de ser utilizadas
- **Crear archivos más pequeños**: Limitar el tamaño de cada archivo que creamos
- **Dividir la implementación en partes**: Implementar una funcionalidad a la vez

### Optimización de Herramientas
- **Reducir el tamaño de las entradas** en las llamadas a herramientas: Especialmente en str-replace-editor
- **Usar rangos específicos** al ver archivos: Usar view_range para ver solo las partes relevantes
- **Implementar funcionalidades incrementalmente**: Agregar funcionalidades básicas primero y luego mejorarlas
- Para evitar el error "I'm sorry. I tried to call a tool, but provided too large of an input", implementa los cambios en porciones más pequeñas y manejables

## 🚨 PREVENCIÓN DE PROBLEMAS TÉCNICOS

### Spring Boot - Dependencias Circulares
**Convenciones de nombres**: Evita el sufijo "Impl" para clases que implementan interfaces de dominio pero dependen de interfaces de Spring Data JPA con nombres similares.

```java
// EVITAR
public class JpaUserRepositoryImpl implements UserRepository {
    private final JpaUserRepository jpaRepository;
}

// PREFERIR
public class CustomUserRepository implements UserRepository {
    private final JpaUserRepository jpaRepository;
}
```

### Angular - Servicios de Diálogo
**Inyección de dependencias**: Usa siempre UnifiedDialogService + UnifiedDialogRef + DIALOG_DATA desde el mismo archivo unified-dialog.service.ts para evitar incompatibilidades de inyección.

### JPA/Hibernate - Versioning Consistente
- **Flujo de guardado estandarizado**: Asegúrate de que todos los documentos (originales y reemplazos) sigan el mismo flujo de persistencia para mantener consistencia en el campo @Version.
- **Evitar doble save**: No guardes entidades primero sin datos completos y luego las actualices asincrónicamente, ya que esto causa inconsistencias en el versioning.
- **Usar campos semánticamente correctos**: Para determinar el orden cronológico usa uploadDate o createdAt, no el campo @Version que está diseñado para optimistic locking.

### Principios de Migración
- Migración gradual por fases es más segura y controlable
- Eliminación sistemática de legacy es más efectiva que coexistencia
- Estados específicos mejoran significativamente claridad y mantenibilidad
- Verificación continua detecta problemas temprano

---

## 🔄 PLAN DE REFACTORING: Sistema Unificado de Gestión de Documentación

### Problema Actual
La gestión de documentación en la plataforma presenta múltiples problemas arquitecturales:

1. **Desconexión entre componentes**: Los diálogos de carga y los componentes de visualización no están sincronizados
2. **Mecanismos inconsistentes**: Diferentes partes de la aplicación manejan documentos de manera distinta
3. **Comunicación frágil**: Dependencia de eventos específicos (`afterClosed()`) que pueden fallar
4. **Duplicación de lógica**: Código repetido entre el paso 3 de inscripción y la pestaña "Mi Perfil"
5. **Problemas de cierre de diálogos**: Inconsistencias entre servicios de diálogo

### Solución Propuesta: Patrón Observer con DocumentManagerService

Implementar un sistema centralizado basado en el patrón Observer que unifique toda la gestión de documentación en la plataforma.

---

## 🏗️ ARQUITECTURA DEL SISTEMA UNIFICADO

### 1. DocumentManagerService (Servicio Central Observable)

**Archivo**: `mpd-concursos-app-frontend/src/app/core/services/documentos/document-manager.service.ts`

**Responsabilidades**:
- Gestión centralizada del estado de documentos
- Emisión de eventos de cambio a componentes suscritos
- Operaciones CRUD unificadas (crear, leer, actualizar, eliminar)
- Cache inteligente para optimizar rendimiento

**Observables principales**:
```typescript
// Estado de documentos
public documentos$: Observable<DocumentoUsuario[]>

// Estado de carga
public loading$: Observable<boolean>

// Eventos específicos
public documentoSubido$: Observable<DocumentoUsuario>
public documentoEliminado$: Observable<string>
```

### 2. Componentes de Visualización Reactivos

**Archivos afectados**:
- `documentos-embebidos.component.ts` (Paso 3 inscripción)
- `perfil-documentos.component.ts` (Pestaña Mi Perfil)

**Funcionalidad unificada**:
- Suscripción automática a cambios de documentos
- Actualización reactiva sin intervención manual
- Eliminación de lógica de actualización específica

### 3. Diálogos de Carga Simplificados

**Archivos afectados**:
- `documento-upload-dialog.component.ts`
- `documento-multiple-upload-dialog.component.ts`

**Simplificaciones**:
- Eliminación de lógica de comunicación con componentes padre
- Uso exclusivo del DocumentManagerService
- Cierre simple sin pasar datos complejos

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: Creación del DocumentManagerService (Semana 1)

**Objetivos**:
- Crear el servicio central con patrón Observer
- Implementar observables para estado de documentos
- Migrar lógica de DocumentosService al nuevo servicio

**Tareas específicas**:
1. **Crear DocumentManagerService**
   - ✅ Archivo: `src/app/core/services/documentos/document-manager.service.ts`
   - ✅ Implementar BehaviorSubjects para documentos y loading
   - ✅ Métodos: `cargarDocumentos()`, `subirDocumento()`, `eliminarDocumento()`

2. **Implementar Cache Inteligente**
   - ✅ Sistema de cache para evitar llamadas redundantes al backend
   - ✅ Invalidación automática después de operaciones CRUD
   - ✅ Optimización de rendimiento

3. **Testing del Servicio**
   - ✅ Unit tests para todos los métodos públicos
   - ✅ Tests de integración con DocumentosService
   - ✅ Validación de observables y estados

**Criterios de Aceptación**:
- ✅ DocumentManagerService funciona independientemente
- ✅ Observables emiten correctamente
- ✅ Cache funciona sin memory leaks
- ✅ Tests pasan al 100%

### FASE 2: Refactorización de Diálogos de Carga (Semana 2)

**Objetivos**:
- Simplificar diálogos eliminando lógica de comunicación compleja
- Integrar diálogos con DocumentManagerService
- Resolver problemas de cierre de diálogos

**Tareas específicas**:
1. **Refactorizar DocumentoUploadDialogComponent**
   - 🟡 En progreso: Eliminar dependencias de BasicDialogService
   - 🟡 En progreso: Usar exclusivamente DocumentManagerService
   - 🟡 En progreso: Simplificar método `cerrarDialogo()` y `cancelar()`

2. **Refactorizar DocumentoMultipleUploadDialogComponent**
   - 🟡 En progreso: Aplicar mismo patrón que diálogo individual
   - 🟡 En progreso: Unificar lógica de carga múltiple
   - 🟡 En progreso: Optimizar UX de carga masiva

3. **Eliminar Lógica de Comunicación Compleja**
   - 🟡 En progreso: Remover `afterClosed()` con datos complejos
   - 🟡 En progreso: Eliminar eventos manuales entre componentes
   - 🟡 En progreso: Simplificar interfaces de resultado

**Criterios de Aceptación**:
- 🟡 Diálogos se cierran correctamente
- 🟡 No hay dependencias cruzadas entre servicios
- 🟡 Carga de documentos funciona sin errores
- 🟡 UX mejorada y más fluida

### FASE 3: Migración de Componentes de Visualización (Semana 3)

**Objetivos**:
- Migrar componentes existentes al patrón Observer
- Eliminar lógica de actualización manual
- Unificar comportamiento entre diferentes secciones

**Tareas específicas**:
1. **Migrar DocumentosEmbebidosComponent (Paso 3 Inscripción)**
   - 🟡 En progreso: Reemplazar lógica de `afterClosed()` con suscripciones a observables
   - 🟡 En progreso: Eliminar métodos de recarga manual (`recargarDocumentos()`)
   - 🟡 En progreso: Implementar suscripciones reactivas en `ngOnInit()`

2. **Migrar PerfilDocumentosComponent (Mi Perfil)**
   - ✅ Aplicar mismo patrón que DocumentosEmbebidosComponent
   - ✅ Unificar interfaz de usuario entre ambas secciones
   - ✅ Sincronizar estados entre paso 3 e inscripción y perfil

3. **Optimizar Detección de Cambios**
   - 🟡 En progreso: Implementar `OnPush` change detection strategy
   - 🟡 En progreso: Usar `trackBy` functions para optimizar renderizado
   - 🟡 En progreso: Eliminar `ChangeDetectorRef` manual

**Criterios de Aceptación**:
- 🟡 Componentes se actualizan automáticamente
- 🟡 No hay lógica de actualización manual
- 🟡 Comportamiento consistente entre secciones
- 🟡 Rendimiento optimizado

### FASE 4: Testing y Validación Integral (Semana 4)

**Objetivos**:
- Validar funcionamiento completo del sistema unificado
- Realizar testing exhaustivo de todos los flujos
- Optimizar rendimiento y UX

**Tareas específicas**:
1. **Testing de Integración**
   - Probar flujo completo: carga → visualización → actualización
   - Validar sincronización entre paso 3 e inscripción y Mi Perfil
   - Testing de casos edge (errores de red, documentos grandes, etc.)

2. **Testing de Rendimiento**
   - Medir tiempos de carga y actualización
   - Validar que no hay memory leaks
   - Optimizar observables y suscripciones

3. **Testing de UX**
   - Validar que diálogos se cierran correctamente
   - Confirmar que actualizaciones son instantáneas
   - Testing en diferentes navegadores y dispositivos

4. **Documentación**
   - Actualizar documentación técnica
   - Crear guías de uso para desarrolladores
   - Documentar patrones y mejores prácticas

**Criterios de Aceptación**:
- ✅ Todos los tests pasan
- ✅ Rendimiento optimizado
- ✅ UX fluida y consistente
- ✅ Documentación completa

---

## 🎯 BENEFICIOS ESPERADOS

### 1. Arquitectura Mejorada
- **Desacoplamiento**: Componentes independientes que se comunican a través del servicio central
- **Escalabilidad**: Fácil agregar nuevos componentes que consuman documentos
- **Mantenibilidad**: Lógica centralizada, más fácil de debuggear y mantener

### 2. Experiencia de Usuario Optimizada
- **Actualizaciones instantáneas**: Sin necesidad de recargar páginas o componentes
- **Consistencia**: Mismo comportamiento en toda la aplicación
- **Confiabilidad**: Eliminación de errores de sincronización

### 3. Desarrollo Simplificado
- **Menos código**: Eliminación de lógica duplicada
- **Patrones claros**: Uso consistente del patrón Observer
- **Testing más fácil**: Servicios centralizados son más fáciles de testear

---

## 🚀 IMPLEMENTACIÓN TÉCNICA DETALLADA

### DocumentManagerService - Código Base

```typescript
@Injectable({
  providedIn: 'root'
})
export class DocumentManagerService {
  private readonly LOG_TAG = 'DocumentManager';

  // Observables principales
  private documentosSubject = new BehaviorSubject<DocumentoUsuario[]>([]);
  public documentos$ = this.documentosSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Eventos específicos
  private documentoSubidoSubject = new Subject<DocumentoUsuario>();
  public documentoSubido$ = this.documentoSubidoSubject.asObservable();

  private documentoEliminadoSubject = new Subject<string>();
  public documentoEliminado$ = this.documentoEliminadoSubject.asObservable();

  // Cache inteligente
  private cache: Map<string, DocumentoUsuario[]> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(
    private documentosService: DocumentosService,
    private loggingService: LoggingService
  ) {
    this.cargarDocumentos();
  }
}
```

### Componente Refactorizado - Ejemplo

```typescript
@Component({
  selector: 'app-documentos-embebidos',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentosEmbebidosComponent implements OnInit, OnDestroy {
  documentos: DocumentoUsuario[] = [];
  loading = false;

  private subscription = new Subscription();

  constructor(
    private documentManager: DocumentManagerService,
    private dialog: UnifiedDialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Suscripción a documentos
    this.subscription.add(
      this.documentManager.documentos$.subscribe(docs => {
        this.documentos = docs;
        this.cdr.markForCheck();
      })
    );

    // Suscripción a estado de carga
    this.subscription.add(
      this.documentManager.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.markForCheck();
      })
    );
  }

  cargarDocumento(tipoDocumentoId: string) {
    // Simplificado - no necesita manejar afterClosed()
    this.dialog.open(DocumentoUploadDialogComponent, {
      data: { tipoDocumentoId }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

---

## 📊 CRONOGRAMA Y RECURSOS

### Cronograma Detallado (4 Semanas)

| Semana | Fase | Desarrollador Principal | Revisor | Horas Estimadas |
|--------|------|------------------------|---------|-----------------|
| 1 | DocumentManagerService | Dev Senior | Tech Lead | 32h |
| 2 | Refactoring Diálogos | Dev Mid | Dev Senior | 28h |
| 3 | Migración Componentes | Dev Mid + Dev Junior | Dev Senior | 40h |
| 4 | Testing y Validación | QA + Dev Senior | Tech Lead | 24h |

### Recursos Necesarios

**Humanos**:
- 1 Desarrollador Senior (Arquitectura y servicios centrales)
- 1 Desarrollador Mid (Refactoring componentes)
- 1 Desarrollador Junior (Testing y documentación)
- 1 QA (Testing integral)
- 1 Tech Lead (Revisión y validación)

**Técnicos**:
- Entorno de desarrollo configurado
- Acceso a repositorio y CI/CD
- Herramientas de testing (Jest, Cypress)
- Documentación técnica actualizada

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgos Técnicos

1. **Riesgo**: Problemas de rendimiento con múltiples observables
   **Mitigación**: Implementar cache inteligente y debounce en operaciones
   **Probabilidad**: Media | **Impacto**: Medio

2. **Riesgo**: Incompatibilidades con código legacy existente
   **Mitigación**: Migración gradual manteniendo compatibilidad hacia atrás
   **Probabilidad**: Alta | **Impacto**: Alto

3. **Riesgo**: Memory leaks por suscripciones no gestionadas
   **Mitigación**: Uso estricto de `takeUntil()` y `unsubscribe()` en `ngOnDestroy()`
   **Probabilidad**: Media | **Impacto**: Alto

### Riesgos de Proyecto

1. **Riesgo**: Retrasos por complejidad subestimada
   **Mitigación**: Buffer de 20% en estimaciones y revisiones semanales
   **Probabilidad**: Media | **Impacto**: Medio

2. **Riesgo**: Resistencia al cambio por parte del equipo
   **Mitigación**: Capacitación previa y documentación detallada
   **Probabilidad**: Baja | **Impacto**: Medio

---

## 🎯 CRITERIOS DE ÉXITO

### Métricas Técnicas

1. **Rendimiento**
   - Tiempo de carga de documentos < 2 segundos
   - Tiempo de actualización tras carga < 500ms
   - Memory usage estable sin leaks

2. **Calidad de Código**
   - Cobertura de tests > 90%
   - 0 errores de TypeScript
   - 0 warnings de Angular

3. **Funcionalidad**
   - 100% de diálogos se cierran correctamente
   - 100% de actualizaciones automáticas funcionan
   - 0 errores de sincronización entre componentes

### Métricas de Usuario

1. **Usabilidad**
   - Tiempo de respuesta percibido < 1 segundo
   - 0 clics adicionales necesarios para ver actualizaciones
   - Comportamiento consistente en toda la aplicación

2. **Confiabilidad**
   - 0 casos donde las cards no se actualicen
   - 0 casos donde los diálogos no se cierren
   - 100% de sincronización entre paso 3 e inscripción y Mi Perfil

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### 1. Aprobación del Plan
- ✅ Revisión técnica por Tech Lead
- ✅ Aprobación de recursos por Project Manager
- ✅ Validación de cronograma con stakeholders

### 2. Preparación del Entorno
- ✅ Crear branch de desarrollo para el refactoring
- ✅ Configurar entorno de testing
- ✅ Preparar documentación base

### 3. Inicio de Implementación
- ✅ Crear DocumentManagerService (Fase 1)
- ✅ Implementar tests unitarios básicos
- ✅ Validar arquitectura con prueba de concepto
- 🟡 Refactorizar Diálogos de Carga (Fase 2)
- 🟡 Migrar Componentes de Visualización (Fase 3)

---

## 📝 CONCLUSIÓN

Este plan de refactoring representa una **solución arquitectural definitiva** para los problemas de gestión de documentación en la plataforma.

**Beneficios clave**:
- ✅ **Elimina problemas de sincronización** entre componentes
- ✅ **Unifica comportamiento** en toda la aplicación
- ✅ **Mejora significativamente la UX** con actualizaciones automáticas
- ✅ **Reduce complejidad** del código y facilita mantenimiento
- ✅ **Establece patrones escalables** para futuras funcionalidades

La implementación del patrón Observer con DocumentManagerService no solo resuelve los problemas actuales, sino que **establece una base sólida y escalable** para la gestión de documentación en toda la plataforma MPD Concursos.
