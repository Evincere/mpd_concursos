# Navegación por URL con Pasos de Inscripción

## Descripción General

El sistema de inscripción ahora soporta navegación directa por URL, permitiendo a los usuarios:
- Navegar directamente a pasos específicos del proceso de inscripción
- Retomar procesos interrumpidos en el paso exacto donde se quedaron
- Usar el botón atrás/adelante del navegador
- Hacer bookmark de pasos específicos
- Compartir URLs de pasos específicos

## Estructura de URL

### Formato Base
```
/dashboard/inscripcion?contestId={id}&step={paso}&inscriptionId={id}
```

### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contestId` | number | ✅ | ID del concurso |
| `step` | number | ❌ | Paso específico (1-4) |
| `inscriptionId` | string | ❌ | ID de inscripción existente |

### Ejemplos de URLs

```bash
# Iniciar proceso de inscripción (paso 1)
/dashboard/inscripcion?contestId=2

# Navegar directamente al paso 2
/dashboard/inscripcion?contestId=2&step=2&inscriptionId=abc-123

# Retomar en paso 3 (documentación)
/dashboard/inscripcion?contestId=2&step=3&inscriptionId=abc-123

# Ir al paso final (confirmación)
/dashboard/inscripcion?contestId=2&step=4&inscriptionId=abc-123
```

## Mapeo de Pasos

| Paso | Nombre | Descripción |
|------|--------|-------------|
| 1 | Términos | Aceptación de bases y condiciones |
| 2 | Circunscripción | Selección de centro de vida y circunscripciones |
| 3 | Documentación | Carga de documentos requeridos |
| 4 | Confirmación | Revisión final y confirmación de datos |

## Validaciones de Acceso

### Sin Inscripción Existente
- ✅ **Paso 1**: Siempre permitido
- ❌ **Pasos 2-4**: Redirige automáticamente al paso 1

### Con Inscripción Existente
- ✅ **Todos los pasos**: Permitidos según el estado de la inscripción
- 🔄 **Validación automática**: El backend determina el paso apropiado

### Estados Especiales
- **COMPLETED_PENDING_DOCS**: Redirige automáticamente al paso 3
- **ACTIVE**: Permite navegación normal según progreso guardado

## Funcionalidades Implementadas

### 🔄 Actualización Automática de URL
- La URL se actualiza automáticamente al navegar entre pasos
- Usa `replaceUrl: true` para evitar entradas duplicadas en el historial
- Mantiene sincronización entre estado interno y URL

### 🛡️ Validación de Acceso
- Verifica permisos antes de permitir acceso a pasos avanzados
- Redirige automáticamente si el acceso no es válido
- Muestra notificaciones informativas al usuario

### 📱 Compatibilidad con Navegador
- Soporte completo para botones atrás/adelante
- Funciona con recarga de página
- Compatible con bookmarks

### 🔗 Deep Linking
- URLs pueden ser compartidas y accedidas directamente
- Validación automática de permisos al acceder por URL directa
- Recuperación automática del estado de inscripción

## Métodos Principales

### `updateUrlWithCurrentStep()`
Actualiza la URL con el paso actual y parámetros necesarios.

### `validateAndSetStep(requestedStep: number)`
Valida si el usuario puede acceder al paso solicitado y lo establece.

### Navegación entre Pasos
- `goToStep(step: number)`: Navega a un paso específico
- `nextStep()`: Avanza al siguiente paso
- `previousStep()`: Retrocede al paso anterior

Todos los métodos de navegación actualizan automáticamente la URL.

## Casos de Uso

### 1. Usuario Nuevo
```
URL: /dashboard/inscripcion?contestId=2
→ Inicia en paso 1 (Términos)
→ URL se actualiza automáticamente al avanzar
```

### 2. Retomar Proceso Interrumpido
```
URL: /dashboard/inscripcion?contestId=2&inscriptionId=abc-123
→ Sistema determina último paso completado
→ Navega automáticamente al paso apropiado
→ URL refleja el paso actual
```

### 3. Navegación Directa
```
URL: /dashboard/inscripcion?contestId=2&step=3&inscriptionId=abc-123
→ Valida permisos de acceso
→ Si es válido: navega al paso 3
→ Si no es válido: redirige al paso apropiado
```

### 4. Documentación Pendiente
```
Estado: COMPLETED_PENDING_DOCS
→ Automáticamente navega al paso 3
→ URL: /dashboard/inscripcion?contestId=2&step=3&inscriptionId=abc-123
```

## Beneficios

### Para el Usuario
- ✅ Experiencia más fluida y natural
- ✅ Puede retomar exactamente donde se quedó
- ✅ Navegación familiar con botones del navegador
- ✅ URLs compartibles y bookmarkables

### Para el Sistema
- ✅ Estado consistente entre URL y aplicación
- ✅ Mejor SEO y accesibilidad
- ✅ Debugging más fácil con URLs descriptivas
- ✅ Compatibilidad con herramientas de analytics

## Consideraciones Técnicas

### Seguridad
- Validación de permisos en cada acceso
- Verificación de ownership de inscripciones
- Sanitización de parámetros de URL

### Performance
- Uso de `replaceUrl` para optimizar historial
- Validaciones eficientes sin llamadas innecesarias al backend
- Carga lazy de datos según el paso actual

### Mantenibilidad
- Código centralizado en métodos específicos
- Logging detallado para debugging
- Separación clara entre navegación y validación
