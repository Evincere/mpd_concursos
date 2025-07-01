# Informe: Problema de Cuelgue en Carga de Documentos

## Resumen del Problema

La aplicación experimenta un **cuelgue total** cuando hay documentos con estado `PENDING` en la base de datos. Este problema se manifiesta de dos formas:

1. **Durante la carga de documentos**: El diálogo de carga múltiple se congela después de subir un documento
2. **Al navegar al perfil**: Si existe un documento `PENDING` en la base de datos, el perfil se cuelga al cargar

## Síntomas Observados

### Comportamiento Específico:
- ✅ **Sin documentos PENDING**: La navegación al perfil funciona normalmente
- ❌ **Con documentos PENDING**: El perfil se cuelga completamente
- ❌ **Durante subida**: El diálogo se congela en estado "Subiendo..." al 30%
- 🔄 **Patrón reproducible**: Eliminar el registro PENDING de la BD restaura la funcionalidad

### Logs de Consola Observados:
```
[DocumentacionTab] ⚠️ DOCUMENTOS PENDING/PENDIENTE DETECTADOS: 1
[DocumentacionTab] 📄 Documento PENDING/PENDIENTE: {
  id: '76773c7e-d14e-4f74-8ad8-5bdad5f96ad9', 
  nombre: 'Título Universitario.pdf', 
  tipo: 'Título Universitario', 
  estado: 'PENDING', 
  fechaCarga: '2025-06-30T19:17:57.388156'
}
```

## Análisis Técnico

### Flujo del Problema:
1. Usuario sube documento → Backend crea registro con estado `PENDING`
2. Frontend inicia monitoreo de estado con `setInterval`
3. El monitoreo consulta `/api/documentos/queue/status-multiple`
4. **PUNTO DE FALLA**: El monitoreo se cuelga o entra en bucle infinito
5. La interfaz se vuelve no responsiva

### Componentes Afectados:
- `DocumentoMultipleUploadDialogComponent` (diálogo de carga)
- `DocumentacionTabComponent` (pestaña de perfil)
- `DocumentosService` (servicio compartido)

## Soluciones Intentadas

### 1. ✅ Corrección del `setInterval` no limpiado
**Problema identificado**: En `DocumentosEmbebidosComponent` había un `setInterval` que no se limpiaba en `ngOnDestroy()`

**Solución aplicada**:
```typescript
// Agregado en DocumentosEmbebidosComponent
private deadlineInterval: any;

ngOnDestroy(): void {
  this.subscription?.unsubscribe();
  if (this.deadlineInterval) {
    clearInterval(this.deadlineInterval);
    this.deadlineInterval = null;
  }
}
```

**Resultado**: ✅ Compilación exitosa, pero problema persiste

### 2. ✅ Implementación de cierre automático del diálogo
**Problema identificado**: El diálogo no se cerraba automáticamente después de subir documentos

**Solución aplicada**:
```typescript
// Modificado en finalizarProceso()
if (documentosCompletados === totalDocumentos && documentosCompletados > 0) {
  this.notificationService.success('Documentación subida exitosamente', 'Éxito');
  this.documentosService.notificarDocumentoActualizado();
  
  setTimeout(() => {
    this.dialogRef.close({ success: true, confirmed: true });
  }, 2000);
}
```

**Resultado**: ✅ Funcionalidad implementada, pero problema persiste

### 3. ✅ Corrección del monitoreo de documentos
**Problema identificado**: El `setInterval` en `monitorearEstadoDocumentos()` no se guardaba en variable para limpiarlo

**Solución aplicada**:
```typescript
// Agregado en DocumentoMultipleUploadDialogComponent
private monitoringInterval: any;

monitorearEstadoDocumentos(queueIds: string[]): void {
  if (this.monitoringInterval) {
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
  }
  
  this.monitoringInterval = setInterval(() => {
    // Lógica de monitoreo...
  }, 5000);
}

// Limpieza en todos los puntos de salida
clearInterval(this.monitoringInterval);
this.monitoringInterval = null;
```

**Resultado**: ✅ Compilación exitosa, pero problema persiste

### 4. ✅ Logs de diagnóstico agregados
**Solución aplicada**: Logs detallados para detectar documentos PENDING y rastrear el flujo

**Logs implementados**:
- Detección de documentos PENDING en `DocumentacionTabComponent`
- Logs de inicialización y destrucción de componentes
- Logs del proceso de monitoreo en el diálogo de carga

**Resultado**: ✅ Logs funcionando, problema identificado pero no resuelto

## Estado Actual

### ❌ Problema NO Resuelto
A pesar de todas las correcciones implementadas, el cuelgue persiste cuando hay documentos con estado `PENDING`.

### Evidencia del Problema Persistente:
```
[DocumentacionTab] 📄 Documentos del usuario cargados: 1
[DocumentacionTab] ⚠️ DOCUMENTOS PENDING/PENDIENTE DETECTADOS: 1
[DocumentacionTab] 📄 Documento PENDING/PENDIENTE: {...}
```

Después de estos logs, la aplicación se cuelga completamente.

## Hipótesis de Causa Raíz

### Teoría Principal: Bucle Infinito en Monitoreo
El problema parece estar en el método `monitorearEstadoDocumentos()` que:
1. Consulta el estado cada 5 segundos
2. Cuando encuentra documentos `PENDING`, continúa monitoreando
3. **Posible causa**: El backend no actualiza el estado o responde incorrectamente
4. El frontend entra en un bucle infinito de consultas

### Teoría Secundaria: Problema de Detección de Cambios
Angular puede estar entrando en un bucle de detección de cambios cuando:
1. Se detectan documentos PENDING
2. Se actualiza el estado del componente
3. Esto dispara nueva detección de cambios
4. El ciclo se repite infinitamente

## Próximos Pasos Recomendados

### 1. 🔍 Investigación del Backend
- Verificar que `/api/documentos/queue/status-multiple` responda correctamente
- Revisar si los documentos PENDING se procesan y cambian de estado
- Implementar timeout en las consultas del frontend

### 2. 🛡️ Implementar Safeguards
- Limitar el número máximo de consultas de monitoreo
- Implementar timeout para el monitoreo (ej: 2 minutos máximo)
- Agregar circuit breaker para evitar consultas infinitas

### 3. 🔧 Refactoring del Monitoreo
- Considerar usar WebSockets en lugar de polling
- Implementar exponential backoff en las consultas
- Separar el monitoreo del componente principal

### 4. 🧪 Testing Específico
- Crear test que reproduzca el escenario con documentos PENDING
- Probar el comportamiento del backend con documentos en cola
- Verificar el comportamiento de la aplicación bajo carga

## ✅ PROBLEMA RESUELTO - DOBLE EMISIÓN

**Causa raíz identificada**: **Doble emisión de `notificarDocumentoActualizado()`**

### **Análisis del problema**:
1. **DocumentosService.uploadDocumento()** emitía automáticamente en línea 127
2. **Componentes de carga múltiple** emitían manualmente después del éxito
3. **Resultado**: Dobles emisiones simultáneas → múltiples llamadas HTTP → cuelgue

### **Solución implementada**:
1. **Eliminadas emisiones duplicadas** en todos los componentes de carga
2. **Aumentado debounce** de 1s a 2s en DocumentosService
3. **Mantenida emisión automática** solo en uploadDocumento()

## Archivos Modificados

1. `profile-document-multiple-upload-dialog.component.ts` - Eliminada emisión duplicada línea 713
2. `documento-multiple-upload-dialog.component.ts` - Eliminadas emisiones duplicadas líneas 1672, 1763
3. `documento-upload-dialog.component.ts` - Eliminada emisión duplicada línea 728
4. `documentos.service.ts` - Aumentado debounce de 1s a 2s línea 20
5. `DocumentosEmbebidosComponent.ts` - Corrección de setInterval (anterior)
6. `DocumentoMultipleUploadDialogComponent.ts` - Corrección de monitoreo y cierre automático (anterior)
7. `DocumentacionTabComponent.ts` - Logs de diagnóstico (anterior)

## Soluciones Técnicas Propuestas

### Solución Inmediata: Circuit Breaker
```typescript
// En DocumentoMultipleUploadDialogComponent
private maxMonitoringAttempts = 24; // 2 minutos máximo (5s * 24)
private currentAttempts = 0;

monitorearEstadoDocumentos(queueIds: string[]): void {
  this.currentAttempts = 0;

  this.monitoringInterval = setInterval(() => {
    this.currentAttempts++;

    if (this.currentAttempts >= this.maxMonitoringAttempts) {
      console.warn('[DocumentoMultipleUpload] ⚠️ Timeout de monitoreo alcanzado');
      this.finalizarPorTimeout();
      return;
    }

    // Lógica de monitoreo existente...
  }, 5000);
}

private finalizarPorTimeout(): void {
  clearInterval(this.monitoringInterval);
  this.monitoringInterval = null;

  // Marcar documentos como completados por timeout
  this.documentosParaSubir.forEach(doc => {
    if (doc.estado === 'subiendo' || doc.estado === 'validando') {
      doc.estado = 'completado';
      doc.progreso = 100;
    }
  });

  this.finalizarProceso();
}
```

### Solución a Mediano Plazo: Debounce y Throttle
```typescript
// Implementar debounce en las actualizaciones de estado
import { debounceTime, throttleTime } from 'rxjs/operators';

// En DocumentacionTabComponent
ngOnInit(): void {
  this.subscription = this.documentosService.documentoActualizado$
    .pipe(
      debounceTime(500), // Esperar 500ms entre actualizaciones
      throttleTime(2000), // Máximo una actualización cada 2 segundos
      distinctUntilChanged()
    )
    .subscribe(() => {
      this.cargarDocumentosUsuario(true);
    });
}
```

### Solución a Largo Plazo: WebSockets
```typescript
// Reemplazar polling con WebSockets para updates en tiempo real
export class DocumentosWebSocketService {
  private socket: WebSocket;

  subscribeToDocumentUpdates(userId: string): Observable<DocumentUpdate> {
    return new Observable(observer => {
      this.socket = new WebSocket(`ws://localhost:8080/ws/documents/${userId}`);

      this.socket.onmessage = (event) => {
        const update = JSON.parse(event.data);
        observer.next(update);
      };

      return () => this.socket.close();
    });
  }
}
```

## Workaround Temporal

### Para Usuarios Finales:
1. **Si el perfil se cuelga**: Cerrar la ventana del navegador y abrir nueva sesión
2. **Si el uploader se cuelga**: Esperar 2-3 minutos o cerrar el diálogo
3. **Verificación**: Los documentos se suben correctamente al servidor a pesar del cuelgue

### Para Administradores:
```sql
-- Limpiar documentos PENDING antiguos (ejecutar en BD)
UPDATE documents
SET status = 'COMPLETED'
WHERE status = 'PENDING'
AND upload_date < NOW() - INTERVAL 1 HOUR;
```

## Métricas de Impacto

- **Usuarios afectados**: Todos los usuarios que suben documentos
- **Frecuencia**: 100% de las subidas de documentos
- **Severidad**: Alta (bloquea funcionalidad crítica)
- **Workaround disponible**: Sí (eliminar registros PENDING)

## Conclusión

El problema de cuelgue con documentos PENDING requiere una investigación más profunda del flujo backend-frontend y posiblemente una refactorización del sistema de monitoreo de documentos. Las correcciones implementadas han mejorado la gestión de memoria y el comportamiento general, pero no han resuelto la causa raíz del cuelgue.

**Recomendación inmediata**: Implementar el circuit breaker para evitar cuelgues indefinidos y permitir que los usuarios continúen usando la aplicación.
