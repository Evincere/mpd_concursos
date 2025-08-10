# Test Plan: Reanudación de Inscripción con Datos Persistidos

## Problema Identificado
Cuando un usuario reanuda una inscripción provisional (estado `COMPLETED_PENDING_DOCS`), los datos no se cargan correctamente:
1. Centro de vida no aparece precargado
2. Circunscripciones seleccionadas no aparecen
3. Botones de navegación no se muestran debido a validación fallida

## Solución Implementada

### 1. Nuevo método para cargar datos desde backend
- `cargarDatosInscripcionDesdeBackend()`: Obtiene datos específicos de la inscripción
- `getInscriptionDetails()` en el servicio: Endpoint para obtener detalles de inscripción
- `updateInscriptionData()` en el servicio: Endpoint para actualizar datos de inscripción

### 2. Mejoras en la carga de datos
- Carga centro de vida desde backend con fallback al perfil del usuario
- Carga circunscripciones seleccionadas desde backend
- Actualización automática de datos cuando el usuario hace cambios

### 3. Validación mejorada
- Forzar validación después de cargar datos desde backend
- Marcar controles como touched para activar validación
- Actualizar selecciones internas de circunscripciones

## Casos de Prueba

### Caso 1: Reanudación de inscripción provisional
**URL de prueba:** `https://vps-4778464-x.dattaweb.com/dashboard/inscripcion?contestId=1&inscriptionId=feea6805-876d-4db6-8801-877f77f6d13a&resume=true&step=2`

**Pasos:**
1. Acceder a la URL con inscripción existente
2. Verificar que el centro de vida aparece cargado
3. Verificar que las circunscripciones aparecen seleccionadas
4. Verificar que el botón "Siguiente" está habilitado
5. Avanzar al paso 3 para cargar documentación

**Resultado esperado:**
- ✅ Centro de vida precargado desde backend
- ✅ Circunscripciones seleccionadas visibles
- ✅ Botón "Siguiente" habilitado
- ✅ Navegación fluida al paso 3

### Caso 2: Actualización automática de datos
**Pasos:**
1. Cambiar el centro de vida en el paso 2
2. Seleccionar diferentes circunscripciones
3. Verificar que los cambios se guardan automáticamente

**Resultado esperado:**
- ✅ Datos se actualizan en backend automáticamente
- ✅ Estado del formulario se mantiene consistente

### Caso 3: Fallback a perfil de usuario
**Pasos:**
1. Simular error en carga de datos desde backend
2. Verificar que se carga centro de vida desde perfil
3. Verificar que la funcionalidad continúa normalmente

**Resultado esperado:**
- ✅ Fallback funciona correctamente
- ✅ No se interrumpe el flujo del usuario

## Archivos Modificados

1. **inscripcion-process-page.component.ts**
   - Nuevo método `cargarDatosInscripcionDesdeBackend()`
   - Método `actualizarDatosInscripcionEnBackend()`
   - Mejoras en `determinarPasoInicialBasadoEnEstado()`
   - Actualización de `actualizarFormularioCircunscripciones()`

2. **inscription.service.ts**
   - Nuevo método `getInscriptionDetails()`
   - Nuevo método `updateInscriptionData()`

## Endpoints de Backend Requeridos

1. **GET** `/inscriptions/{id}/details`
   - Retorna datos específicos de la inscripción
   - Incluye: centroDeVida, circunscripciones, etc.

2. **PATCH** `/inscriptions/{id}/data`
   - Actualiza datos específicos de la inscripción
   - Acepta: centroDeVida, circunscripciones

## Logs de Debug

Los siguientes logs ayudarán a diagnosticar problemas:
- `[InscripcionProcess] Cargando datos específicos de inscripción desde backend`
- `[InscripcionProcess] Centro de vida cargado desde backend`
- `[InscripcionProcess] Circunscripciones cargadas desde backend`
- `[InscripcionProcess] Datos de inscripción aplicados al formulario`
- `[InscripcionProcess] Actualizando datos de inscripción en backend`

## Verificación de Funcionamiento

Para verificar que la solución funciona:

1. **Abrir Developer Tools** y ir a la pestaña Console
2. **Acceder a la URL de prueba** con inscripción existente
3. **Buscar los logs** mencionados arriba
4. **Verificar que los datos se cargan** correctamente en el formulario
5. **Probar la navegación** entre pasos

Si los logs muestran errores 404 en los endpoints `/details` o `/data`, será necesario implementar estos endpoints en el backend.